import { createPrivateKey, sign } from "node:crypto";

const appId = process.env.APP_STORE_CONNECT_APP_ID || "6795566131";
const versionString = process.env.APP_STORE_VERSION || "1.0";
const platform = process.env.APP_STORE_PLATFORM || "IOS";
const expectedEula = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
const expectedPrivacy = "https://bodywise-snowy.vercel.app/privacy";
const expectedMarketing = "https://bodywise-snowy.vercel.app";
const subscriptionGroupId = process.env.APP_STORE_SUBSCRIPTION_GROUP_ID || "22277285";
const subscriptionIds = (process.env.APP_STORE_SUBSCRIPTION_IDS || "6796619284,6796621786")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const keyId = process.env.APPSTORE_KEY_ID || process.env.APP_STORE_CONNECT_KEY_ID;
const issuerId = process.env.APPSTORE_ISSUER_ID || process.env.APP_STORE_CONNECT_ISSUER_ID;
const privateKeyRaw = process.env.APPSTORE_PRIVATE_KEY || process.env.APP_STORE_CONNECT_PRIVATE_KEY;

if (!keyId || !privateKeyRaw) {
  throw new Error("Missing App Store Connect API credentials in GitHub secrets.");
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
    const detail = JSON.stringify(body, null, 2);
    throw new Error(`API ${response.status} ${response.statusText} for ${path}: ${detail}`);
  }
  return body;
}

function pass(label, detail = "") {
  console.log(`PASS | ${label}${detail ? ` | ${detail}` : ""}`);
}
function warn(label, detail = "") {
  console.log(`WARN | ${label}${detail ? ` | ${detail}` : ""}`);
}
function fail(label, detail = "") {
  console.log(`FAIL | ${label}${detail ? ` | ${detail}` : ""}`);
  failures += 1;
}

let failures = 0;

const versionsUrl = new URL(`/v1/apps/${appId}/appStoreVersions`, "https://api.appstoreconnect.apple.com");
versionsUrl.searchParams.set("filter[platform]", platform);
versionsUrl.searchParams.set("limit", "50");
versionsUrl.searchParams.set("include", "build,appStoreVersionLocalizations,appStoreReviewDetail");
versionsUrl.searchParams.set("fields[appStoreVersions]", "platform,versionString,appStoreState,appVersionState,reviewType,releaseType,build,appStoreVersionLocalizations,appStoreReviewDetail");
versionsUrl.searchParams.set("fields[builds]", "version,processingState,usesNonExemptEncryption,uploadedDate,expired");
versionsUrl.searchParams.set("fields[appStoreVersionLocalizations]", "locale,description,marketingUrl,promotionalText,supportUrl,whatsNew");

const versionsResponse = await api(`${versionsUrl.pathname}${versionsUrl.search}`);
const version = (versionsResponse.data || []).find(
  (item) => item.attributes?.platform === platform && item.attributes?.versionString === versionString,
);

if (!version) {
  fail("App version found", `Could not find ${platform} ${versionString}`);
  process.exit(1);
}

console.log(`AUDIT | App Store version resource id: ${version.id}`);
console.log(`AUDIT | App Store visible version id: ${version.relationships?.appStoreVersionLocalizations?.links?.related ? "localizations linked" : "localization link not expanded"}`);
console.log(`AUDIT | Current appStoreState: ${version.attributes?.appStoreState || "unknown"}`);

if (["REJECTED", "METADATA_REJECTED", "DEVELOPER_REJECTED", "READY_FOR_REVIEW", "WAITING_FOR_REVIEW", "IN_REVIEW"].includes(version.attributes?.appStoreState)) {
  pass("App version exists in a known post-submit/edit state", version.attributes?.appStoreState);
} else {
  warn("App version state should be reviewed manually", version.attributes?.appStoreState || "unknown");
}

const included = versionsResponse.included || [];
const localizations = included.filter((item) => item.type === "appStoreVersionLocalizations");
const en = localizations.find((item) => item.attributes?.locale === "en-US") || localizations[0];
if (!en) {
  fail("App version localization exists", "No localization returned");
} else {
  const description = en.attributes?.description || "";
  if (description.includes(expectedEula)) pass("EULA link present in App Description", expectedEula);
  else fail("EULA link present in App Description", "Missing Apple standard EULA URL");

  if ((en.attributes?.marketingUrl || "").startsWith(expectedMarketing)) pass("Marketing URL present", en.attributes.marketingUrl);
  else warn("Marketing URL not visible/matching via API", en.attributes?.marketingUrl || "empty");

  if (en.attributes?.supportUrl) pass("Support URL present", en.attributes.supportUrl);
  else warn("Support URL not visible via API", "Apple may require it in metadata UI");

  if (en.attributes?.whatsNew) pass("What's New text present", en.attributes.whatsNew.slice(0, 80));
  else warn("What's New text not present", "Usually required for updates, not always for first version");
}

const build = included.find((item) => item.type === "builds");
if (!build) {
  warn("Build attached", "No build included in App Store version response; check UI if submission stays blocked");
} else {
  pass("Build attached", `build id ${build.id}, version ${build.attributes?.version || "unknown"}, state ${build.attributes?.processingState || "unknown"}`);
  if (build.attributes?.processingState === "VALID") pass("Build processing state valid");
  else warn("Build processing state not clearly valid", build.attributes?.processingState || "unknown");

  if (typeof build.attributes?.usesNonExemptEncryption === "boolean") {
    pass("Export compliance answer visible on build", `usesNonExemptEncryption=${build.attributes.usesNonExemptEncryption}`);
  } else {
    warn("Export compliance answer not visible on build", "If Apple blocks submission, check Export Compliance in App Store Connect UI");
  }
}

try {
  const reviewDetail = await api(`/v1/appStoreVersions/${version.id}/appStoreReviewDetail`);
  const attrs = reviewDetail.data?.attributes || {};
  if (attrs.contactFirstName && attrs.contactLastName && attrs.contactEmail && attrs.contactPhone) {
    pass("App Review contact information present");
  } else {
    warn("App Review contact information may be incomplete", JSON.stringify({
      hasFirstName: Boolean(attrs.contactFirstName),
      hasLastName: Boolean(attrs.contactLastName),
      hasEmail: Boolean(attrs.contactEmail),
      hasPhone: Boolean(attrs.contactPhone),
    }));
  }
  if (attrs.demoAccountName || attrs.demoAccountPassword) {
    warn("Demo account fields present", "Make sure credentials are valid if login is required");
  } else {
    pass("No demo account listed", "Appropriate if app can be reviewed without login");
  }
} catch (error) {
  warn("Could not read App Review detail", error.message.slice(0, 240));
}

try {
  const submissions = await api(`/v1/apps/${appId}/reviewSubmissions?filter[platform]=${platform}&include=items,appStoreVersionForReview&limit=20&fields[reviewSubmissions]=platform,submittedDate,state,items,appStoreVersionForReview&fields[reviewSubmissionItems]=state,appStoreVersion`);
  const active = submissions.data || [];
  if (active.length) {
    pass("Review submissions visible", `${active.length} returned`);
    for (const sub of active) {
      console.log(`AUDIT | ReviewSubmission ${sub.id}: ${sub.attributes?.state || "unknown"}, submittedDate=${sub.attributes?.submittedDate || "none"}`);
    }
  } else {
    warn("No review submissions returned", "App Store Connect UI may still show original rejected submission");
  }
} catch (error) {
  warn("Could not list review submissions", error.message.slice(0, 240));
}

try {
  const group = await api(`/v1/subscriptionGroups/${subscriptionGroupId}`);
  pass("Subscription group found", `${subscriptionGroupId} ${group.data?.attributes?.referenceName || ""}`.trim());
} catch (error) {
  fail("Subscription group found", error.message.slice(0, 240));
}

for (const subscriptionId of subscriptionIds) {
  try {
    const subscription = await api(`/v1/subscriptions/${subscriptionId}`);
    const attrs = subscription.data?.attributes || {};
    const state = attrs.state || "unknown";
    const product = attrs.productId || "unknown productId";
    if (["READY_TO_SUBMIT", "READY_FOR_REVIEW", "WAITING_FOR_REVIEW", "IN_REVIEW", "APPROVED"].includes(state)) {
      pass("Subscription state acceptable", `${subscriptionId} ${product} state=${state}`);
    } else {
      warn("Subscription state should be checked", `${subscriptionId} ${product} state=${state}`);
    }
  } catch (error) {
    fail("Subscription readable", `${subscriptionId}: ${error.message.slice(0, 240)}`);
  }
}

console.log(`AUDIT | Final failure count: ${failures}`);
if (failures > 0) process.exit(1);
