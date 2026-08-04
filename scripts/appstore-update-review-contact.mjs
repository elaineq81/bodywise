import { createPrivateKey, sign } from "node:crypto";

const appId = process.env.APP_STORE_CONNECT_APP_ID || "6795566131";
const versionString = process.env.APP_STORE_VERSION || "1.0";
const platform = process.env.APP_STORE_PLATFORM || "IOS";
const contactFirstName = process.env.APP_REVIEW_CONTACT_FIRST_NAME;
const contactLastName = process.env.APP_REVIEW_CONTACT_LAST_NAME;
const contactEmail = process.env.APP_REVIEW_CONTACT_EMAIL;
const contactPhone = process.env.APP_REVIEW_CONTACT_PHONE;

const keyId = process.env.APPSTORE_KEY_ID || process.env.APP_STORE_CONNECT_KEY_ID;
const issuerId = process.env.APPSTORE_ISSUER_ID || process.env.APP_STORE_CONNECT_ISSUER_ID;
const privateKeyRaw = process.env.APPSTORE_PRIVATE_KEY || process.env.APP_STORE_CONNECT_PRIVATE_KEY;

for (const [name, value] of Object.entries({ contactFirstName, contactLastName, contactEmail, contactPhone })) {
  if (!value) throw new Error(`Missing required environment value: ${name}`);
}
if (!keyId || !privateKeyRaw) throw new Error("Missing App Store Connect API credentials.");

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

let tokenMode = issuerId ? "team" : "individual";
function createJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = { iat: now, exp: now + 20 * 60, aud: "appstoreconnect-v1" };
  if (tokenMode === "team") payload.iss = issuerId;
  else payload.sub = "user";
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const rawSignature = sign("sha256", Buffer.from(signingInput), {
    key: createPrivateKey(privateKey),
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${base64url(rawSignature)}`;
}

async function api(path, options = {}) {
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
    if (response.status === 401 && tokenMode === "team") {
      tokenMode = "individual";
      return api(path, options);
    }
    throw new Error(`API ${response.status} ${response.statusText}: ${JSON.stringify(body, null, 2)}`);
  }
  return body;
}

async function getAppStoreVersion() {
  const url = new URL(`/v1/apps/${appId}/appStoreVersions`, "https://api.appstoreconnect.apple.com");
  url.searchParams.set("filter[platform]", platform);
  url.searchParams.set("limit", "50");
  const response = await api(`${url.pathname}${url.search}`);
  const version = (response.data || []).find(
    (item) => item.attributes?.platform === platform && item.attributes?.versionString === versionString,
  );
  if (!version) throw new Error(`Could not find ${platform} App Store version ${versionString}.`);
  return version;
}

async function getOrCreateReviewDetail(versionId) {
  try {
    const detail = await api(`/v1/appStoreVersions/${versionId}/appStoreReviewDetail`);
    if (detail?.data?.id) return detail.data;
  } catch (error) {
    console.log("No readable review detail found; creating one.");
  }

  const created = await api("/v1/appStoreReviewDetails", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "appStoreReviewDetails",
        attributes: {
          contactFirstName,
          contactLastName,
          contactEmail,
          contactPhone,
          demoAccountRequired: false,
          demoAccountName: "",
          demoAccountPassword: "",
          notes: "No demo login is required. Reviewers can open the app and test the free workout flow directly.",
        },
        relationships: {
          appStoreVersion: { data: { type: "appStoreVersions", id: versionId } },
        },
      },
    }),
  });
  return created.data;
}

const version = await getAppStoreVersion();
console.log(`Found Bodywise Remedy iOS ${versionString}: ${version.id} (${version.attributes?.appStoreState || "unknown state"}).`);

const reviewDetail = await getOrCreateReviewDetail(version.id);
console.log(`Using App Review detail ${reviewDetail.id}.`);

await api(`/v1/appStoreReviewDetails/${reviewDetail.id}`, {
  method: "PATCH",
  body: JSON.stringify({
    data: {
      type: "appStoreReviewDetails",
      id: reviewDetail.id,
      attributes: {
        contactFirstName,
        contactLastName,
        contactEmail,
        contactPhone,
        demoAccountRequired: false,
        demoAccountName: "",
        demoAccountPassword: "",
        notes: "No demo login is required. Reviewers can open the app and test the free workout flow directly. Auto-renewable subscriptions use Apple In-App Purchase / StoreKit.",
      },
    },
  }),
});

console.log("Updated App Review contact details and set demoAccountRequired=false.");
