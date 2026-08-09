import { createHash, createPrivateKey, sign } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";

const appId = process.env.APP_STORE_CONNECT_APP_ID || "6795566131";
const versionString = process.env.APP_STORE_VERSION || "1.1";
const locale = process.env.APP_STORE_LOCALE || "en-US";
const platform = process.env.APP_STORE_PLATFORM || "IOS";
const keyId = process.env.APPSTORE_KEY_ID || process.env.APP_STORE_CONNECT_KEY_ID;
const issuerId = process.env.APPSTORE_ISSUER_ID || process.env.APP_STORE_CONNECT_ISSUER_ID;
const privateKeyRaw = process.env.APPSTORE_PRIVATE_KEY || process.env.APP_STORE_CONNECT_PRIVATE_KEY;

const screenshotSets = [
  {
    displayType: "APP_IPHONE_65",
    folder: "app-store-assets/ios-6.5",
  },
  {
    displayType: "APP_IPAD_PRO_3GEN_129",
    folder: "app-store-assets/ipad-13",
  },
];

if (!keyId || !privateKeyRaw) {
  throw new Error("Missing App Store Connect API credentials.");
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
    throw new Error(`App Store Connect API ${response.status} ${response.statusText}: ${JSON.stringify(body, null, 2)}`);
  }
  return body;
}

async function findVersionLocalization() {
  const versionsUrl = new URL(`/v1/apps/${appId}/appStoreVersions`, "https://api.appstoreconnect.apple.com");
  versionsUrl.searchParams.set("filter[platform]", platform);
  versionsUrl.searchParams.set("limit", "50");
  const versions = await api(`${versionsUrl.pathname}${versionsUrl.search}`);
  const version = (versions.data || []).find(
    (item) => item.attributes?.versionString === versionString && item.attributes?.platform === platform,
  );
  if (!version) throw new Error(`No editable ${platform} version ${versionString} was found.`);

  const localizations = await api(`/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=50`);
  const localization = (localizations.data || []).find((item) => item.attributes?.locale === locale) || localizations.data?.[0];
  if (!localization) throw new Error(`No localization found for app version ${versionString}.`);
  console.log(`Using App Store version ${versionString}, localization ${localization.attributes?.locale || locale}.`);
  return localization.id;
}

async function deleteExistingScreenshotSets(localizationId) {
  const url = new URL(`/v1/appStoreVersionLocalizations/${localizationId}/appScreenshotSets`, "https://api.appstoreconnect.apple.com");
  url.searchParams.set("limit", "200");
  const existing = await api(`${url.pathname}${url.search}`);
  for (const set of existing.data || []) {
    const displayType = set.attributes?.screenshotDisplayType || "unknown";
    await api(`/v1/appScreenshotSets/${set.id}`, { method: "DELETE" });
    console.log(`Deleted old ${displayType} screenshot set ${set.id}.`);
  }
}

async function createScreenshotSet(localizationId, displayType) {
  const created = await api("/v1/appScreenshotSets", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "appScreenshotSets",
        attributes: { screenshotDisplayType: displayType },
        relationships: {
          appStoreVersionLocalization: {
            data: { type: "appStoreVersionLocalizations", id: localizationId },
          },
        },
      },
    }),
  });
  console.log(`Created ${displayType} screenshot set ${created.data.id}.`);
  return created.data.id;
}

async function listPngFiles(folder) {
  const entries = await readdir(folder);
  return entries
    .filter((file) => /^\d{2}-bodywise-remedy\.png$/.test(file))
    .sort()
    .map((file) => join(folder, file));
}

async function uploadFileToOperation(operation, bytes) {
  const start = operation.offset || 0;
  const end = start + operation.length;
  const headers = {};
  for (const header of operation.requestHeaders || []) {
    headers[header.name] = header.value;
  }
  const response = await fetch(operation.url, {
    method: operation.method || "PUT",
    headers,
    body: bytes.subarray(start, end),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Screenshot binary upload failed ${response.status} ${response.statusText}: ${text}`);
  }
}

async function uploadScreenshot(setId, filePath) {
  const bytes = await readFile(filePath);
  const fileName = basename(filePath);
  const checksum = createHash("md5").update(bytes).digest("hex");

  const reservation = await api("/v1/appScreenshots", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "appScreenshots",
        attributes: {
          fileName,
          fileSize: bytes.length,
        },
        relationships: {
          appScreenshotSet: {
            data: { type: "appScreenshotSets", id: setId },
          },
        },
      },
    }),
  });

  const screenshot = reservation.data;
  for (const operation of screenshot.attributes?.uploadOperations || []) {
    await uploadFileToOperation(operation, bytes);
  }

  await api(`/v1/appScreenshots/${screenshot.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "appScreenshots",
        id: screenshot.id,
        attributes: {
          uploaded: true,
          sourceFileChecksum: checksum,
        },
      },
    }),
  });

  console.log(`Uploaded ${fileName}.`);
  return screenshot.id;
}

async function reorderScreenshots(setId, screenshotIds) {
  await api(`/v1/appScreenshotSets/${setId}/relationships/appScreenshots`, {
    method: "PATCH",
    body: JSON.stringify({
      data: screenshotIds.map((id) => ({ type: "appScreenshots", id })),
    }),
  });
}

const localizationId = await findVersionLocalization();
await deleteExistingScreenshotSets(localizationId);

for (const set of screenshotSets) {
  const files = await listPngFiles(set.folder);
  if (files.length === 0) throw new Error(`No screenshots found in ${set.folder}.`);
  if (files.length > 10) throw new Error(`${set.folder} contains ${files.length} screenshots; Apple allows up to 10.`);

  const setId = await createScreenshotSet(localizationId, set.displayType);
  const screenshotIds = [];
  for (const file of files) {
    screenshotIds.push(await uploadScreenshot(setId, file));
  }
  await reorderScreenshots(setId, screenshotIds);
  console.log(`Uploaded and ordered ${files.length} ${set.displayType} screenshots.`);
}

console.log("Bodywise Remedy screenshot upload completed.");
