import { createPrivateKey, sign } from "node:crypto";

const APPLE_STANDARD_EULA_URL =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

const appId = process.env.APP_STORE_CONNECT_APP_ID || "6795566131";
const versionString = process.env.APP_STORE_VERSION || "1.0";
const keyId = process.env.APP_STORE_CONNECT_KEY_ID || process.env.APPSTORE_KEY_ID;
const issuerId =
  process.env.APP_STORE_CONNECT_ISSUER_ID || process.env.APPSTORE_ISSUER_ID;
const privateKeyRaw =
  process.env.APP_STORE_CONNECT_PRIVATE_KEY || process.env.APPSTORE_PRIVATE_KEY;

if (!keyId || !issuerId || !privateKeyRaw) {
  throw new Error(
    [
      "Missing App Store Connect API credentials.",
      "Required secrets:",
      "- APP_STORE_CONNECT_PRIVATE_KEY or APPSTORE_PRIVATE_KEY",
      "- APP_STORE_CONNECT_KEY_ID or APPSTORE_KEY_ID",
      "- APP_STORE_CONNECT_ISSUER_ID or APPSTORE_ISSUER_ID",
    ].join("\n"),
  );
}

const privateKey = privateKeyRaw.includes("\\n")
  ? privateKeyRaw.replace(/\\n/g, "\n")
  : privateKeyRaw;

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function derToJose(signature, partLength = 32) {
  let offset = 0;

  if (signature[offset++] !== 0x30) {
    throw new Error("Invalid ECDSA signature: expected DER sequence.");
  }

  const seqLength = signature[offset++];
  if (seqLength + 2 !== signature.length) {
    throw new Error("Invalid ECDSA signature length.");
  }

  if (signature[offset++] !== 0x02) {
    throw new Error("Invalid ECDSA signature: expected R integer.");
  }
  const rLength = signature[offset++];
  let r = signature.slice(offset, offset + rLength);
  offset += rLength;

  if (signature[offset++] !== 0x02) {
    throw new Error("Invalid ECDSA signature: expected S integer.");
  }
  const sLength = signature[offset++];
  let s = signature.slice(offset, offset + sLength);

  r = r[0] === 0 ? r.slice(1) : r;
  s = s[0] === 0 ? s.slice(1) : s;

  if (r.length > partLength || s.length > partLength) {
    throw new Error("Invalid ECDSA signature: R/S component too long.");
  }

  return Buffer.concat([
    Buffer.concat([Buffer.alloc(partLength - r.length), r]),
    Buffer.concat([Buffer.alloc(partLength - s.length), s]),
  ])
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function createJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 20 * 60,
    aud: "appstoreconnect-v1",
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(payload),
  )}`;
  const derSignature = sign(
    "sha256",
    Buffer.from(signingInput),
    createPrivateKey(privateKey),
  );
  return `${signingInput}.${derToJose(derSignature)}`;
}

async function appStoreRequest(path, options = {}) {
  const response = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${createJwt()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `App Store Connect API ${response.status} ${response.statusText}: ${JSON.stringify(
        body,
        null,
        2,
      )}`,
    );
  }

  return body;
}

function chooseVersion(versions) {
  const matchingVersion = versions.filter(
    (version) =>
      version.attributes?.platform === "IOS" &&
      version.attributes?.versionString === versionString,
  );

  if (matchingVersion.length === 0) {
    throw new Error(
      `Could not find iOS App Store version ${versionString}. Found: ${versions
        .map(
          (version) =>
            `${version.attributes?.platform || "?"} ${
              version.attributes?.versionString || "?"
            } (${version.attributes?.appStoreState || "unknown state"})`,
        )
        .join(", ")}`,
    );
  }

  const editableStates = new Set([
    "PREPARE_FOR_SUBMISSION",
    "DEVELOPER_REJECTED",
    "REJECTED",
    "METADATA_REJECTED",
    "INVALID_BINARY",
  ]);

  return (
    matchingVersion.find((version) =>
      editableStates.has(version.attributes?.appStoreState),
    ) || matchingVersion[0]
  );
}

function chooseLocalization(localizations) {
  const localization =
    localizations.find((item) => item.attributes?.locale === "en-US") ||
    localizations[0];

  if (!localization) {
    throw new Error("No App Store version localization was found to update.");
  }

  return localization;
}

function appendEula(description = "") {
  if (description.includes(APPLE_STANDARD_EULA_URL)) {
    return { changed: false, description };
  }

  const addition = `Terms of Use (EULA): ${APPLE_STANDARD_EULA_URL}`;
  const nextDescription = `${description.trim()}\n\n${addition}`.trim();

  if (nextDescription.length > 4000) {
    throw new Error(
      `App description would exceed Apple's 4,000 character limit after adding the EULA link. Current: ${description.length}, next: ${nextDescription.length}.`,
    );
  }

  return { changed: true, description: nextDescription };
}

const versionsUrl = new URL(`/v1/apps/${appId}/appStoreVersions`, "https://api.appstoreconnect.apple.com");
versionsUrl.searchParams.set("filter[platform]", "IOS");
versionsUrl.searchParams.set("limit", "50");

const versionsResponse = await appStoreRequest(
  `${versionsUrl.pathname}${versionsUrl.search}`,
);
const version = chooseVersion(versionsResponse.data || []);

const localizationsResponse = await appStoreRequest(
  `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=50`,
);
const localization = chooseLocalization(localizationsResponse.data || []);

const { changed, description } = appendEula(
  localization.attributes?.description || "",
);

if (!changed) {
  console.log(
    `EULA link already present in ${localization.attributes?.locale || "selected"} description for iOS ${versionString}.`,
  );
  process.exit(0);
}

await appStoreRequest(`/v1/appStoreVersionLocalizations/${localization.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    data: {
      type: "appStoreVersionLocalizations",
      id: localization.id,
      attributes: {
        description,
      },
    },
  }),
});

console.log(
  `Added Apple Standard EULA link to ${localization.attributes?.locale || "selected"} App Description for Bodywise Remedy iOS ${versionString}.`,
);
