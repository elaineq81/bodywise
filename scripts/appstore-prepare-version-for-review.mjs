import { createPrivateKey, sign } from "node:crypto";

const appId = process.env.APP_STORE_CONNECT_APP_ID || "6795566131";
const versionString = process.env.APP_STORE_VERSION || "1.1";
const locale = process.env.APP_STORE_LOCALE || "en-US";
const platform = process.env.APP_STORE_PLATFORM || "IOS";
const keyId = process.env.APPSTORE_KEY_ID || process.env.APP_STORE_CONNECT_KEY_ID;
const issuerId = process.env.APPSTORE_ISSUER_ID || process.env.APP_STORE_CONNECT_ISSUER_ID;
const privateKeyRaw = process.env.APPSTORE_PRIVATE_KEY || process.env.APP_STORE_CONNECT_PRIVATE_KEY;

const whatsNew = process.env.APP_STORE_WHATS_NEW || [
  "Bodywise Remedy now feels more guided and app-like from the first tap.",
  "",
  "- Clearer daily workout dashboard and first-week path",
  "- Improved workout sound, countdown beeps, and coach cues",
  "- Better movement preview flow and calmer visual option",
  "- Stronger progress, subscription status, and post-workout guidance",
  "- Additional polish for iPhone safe areas and navigation clarity",
].join("\n");

if (!keyId || !privateKeyRaw) {
  throw new Error("Missing App Store Connect API credentials in GitHub secrets.");
}

const privateKey = privateKeyRaw.includes("\\n") ? privateKeyRaw.replace(/\\n/g, "\n") : privateKeyRaw;

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

class ApiError extends Error {
  constructor(response, body, path) {
    super(`App Store Connect API ${response.status} ${response.statusText} for ${path}: ${JSON.stringify(body, null, 2)}`);
    this.status = response.status;
    this.body = body;
  }
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
      console.log("Team-key token was not accepted; retrying with Individual API Key token format.");
      return api(path, options);
    }
    throw new ApiError(response, body, path);
  }
  return body;
}

function compact(error) {
  const errors = error?.body?.errors;
  if (!Array.isArray(errors)) return String(error?.message || error);
  return errors.map((item) => [item.code, item.title, item.detail].filter(Boolean).join(" — ")).join(" | ");
}

async function findVersion() {
  const url = new URL(`/v1/apps/${appId}/appStoreVersions`, "https://api.appstoreconnect.apple.com");
  url.searchParams.set("filter[platform]", platform);
  url.searchParams.set("include", "appStoreVersionLocalizations,build");
  url.searchParams.set("limit", "50");
  const response = await api(`${url.pathname}${url.search}`);
  const version = (response.data || []).find((item) => item.attributes?.versionString === versionString && item.attributes?.platform === platform);
  if (!version) throw new Error(`Could not find ${platform} App Store version ${versionString}.`);
  return { version, included: response.included || [] };
}

async function updateWhatsNew(versionId, included) {
  let localization = included.find((item) => item.type === "appStoreVersionLocalizations" && item.attributes?.locale === locale)
    || included.find((item) => item.type === "appStoreVersionLocalizations");
  if (!localization) {
    const localizations = await api(`/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations?limit=50`);
    localization = (localizations.data || []).find((item) => item.attributes?.locale === locale) || localizations.data?.[0];
  }
  if (!localization) throw new Error(`No App Store version localization found for ${versionString}.`);
  await api(`/v1/appStoreVersionLocalizations/${localization.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "appStoreVersionLocalizations",
        id: localization.id,
        attributes: { whatsNew },
      },
    }),
  });
  console.log(`Updated What's New for ${localization.attributes?.locale || locale}.`);
}

async function findLatestValidBuild() {
  const url = new URL("/v1/builds", "https://api.appstoreconnect.apple.com");
  url.searchParams.set("filter[app]", appId);
  url.searchParams.set("filter[processingState]", "VALID");
  url.searchParams.set("include", "preReleaseVersion");
  url.searchParams.set("fields[builds]", "version,uploadedDate,processingState,expired,usesNonExemptEncryption,preReleaseVersion");
  url.searchParams.set("fields[preReleaseVersions]", "version,platform");
  url.searchParams.set("sort", "-uploadedDate");
  url.searchParams.set("limit", "50");
  const response = await api(`${url.pathname}${url.search}`);
  const included = response.included || [];
  const builds = (response.data || []).map((build) => {
    const preId = build.relationships?.preReleaseVersion?.data?.id;
    const pre = included.find((item) => item.type === "preReleaseVersions" && item.id === preId);
    return { build, preReleaseVersion: pre };
  });
  const matching = builds.find((item) => item.preReleaseVersion?.attributes?.version === versionString && item.preReleaseVersion?.attributes?.platform === platform && item.build.attributes?.expired !== true);
  if (!matching) {
    const sample = builds.slice(0, 8).map((item) => `${item.build.id}: build=${item.build.attributes?.version}, appVersion=${item.preReleaseVersion?.attributes?.version || "unknown"}, state=${item.build.attributes?.processingState}`).join(" | ");
    throw new Error(`No valid processed ${platform} build found for version ${versionString}. Latest builds: ${sample}`);
  }
  console.log(`Selected build ${matching.build.id}: build number ${matching.build.attributes?.version}, uploaded ${matching.build.attributes?.uploadedDate}.`);
  return matching.build;
}

async function setExportCompliance(build) {
  if (build.attributes?.usesNonExemptEncryption === false) {
    console.log("Export compliance already marked as non-exempt encryption false.");
    return;
  }
  try {
    await api(`/v1/builds/${build.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        data: {
          type: "builds",
          id: build.id,
          attributes: { usesNonExemptEncryption: false },
        },
      }),
    });
    console.log("Marked build export compliance as usesNonExemptEncryption=false.");
  } catch (error) {
    console.log(`WARNING: Could not update export compliance automatically: ${compact(error)}`);
  }
}

async function attachBuild(versionId, buildId) {
  await api(`/v1/appStoreVersions/${versionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "appStoreVersions",
        id: versionId,
        relationships: {
          build: { data: { type: "builds", id: buildId } },
        },
      },
    }),
  });
  console.log(`Attached build ${buildId} to App Store version ${versionString}.`);
}

const { version, included } = await findVersion();
console.log(`Preparing Bodywise Remedy ${platform} ${versionString}: ${version.id} (${version.attributes?.appStoreState || "unknown"}).`);
await updateWhatsNew(version.id, included);
const build = await findLatestValidBuild();
await setExportCompliance(build);
await attachBuild(version.id, build.id);
console.log("Bodywise Remedy version is prepared for App Review submission.");