import { createPrivateKey, sign } from "node:crypto";

const appId = process.env.APP_STORE_CONNECT_APP_ID || "6795566131";
const versionString = process.env.APP_STORE_VERSION || "1.0";
const platform = process.env.APP_STORE_PLATFORM || "IOS";
const subscriptionGroupId = process.env.APP_STORE_SUBSCRIPTION_GROUP_ID || "22277285";
const subscriptionIds = (process.env.APP_STORE_SUBSCRIPTION_IDS || "6796619284,6796621786")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

const keyId = process.env.APPSTORE_KEY_ID || process.env.APP_STORE_CONNECT_KEY_ID;
const issuerId = process.env.APPSTORE_ISSUER_ID || process.env.APP_STORE_CONNECT_ISSUER_ID;
const privateKeyRaw = process.env.APPSTORE_PRIVATE_KEY || process.env.APP_STORE_CONNECT_PRIVATE_KEY;

if (!keyId || !privateKeyRaw) {
  throw new Error(
    [
      "Missing App Store Connect API credentials.",
      "Required secrets:",
      "- APPSTORE_PRIVATE_KEY or APP_STORE_CONNECT_PRIVATE_KEY",
      "- APPSTORE_KEY_ID or APP_STORE_CONNECT_KEY_ID",
      "- APPSTORE_ISSUER_ID or APP_STORE_CONNECT_ISSUER_ID for Team API keys",
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

let tokenMode = issuerId ? "team" : "individual";

function createJwt() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = {
    iat: now,
    exp: now + 20 * 60,
    aud: "appstoreconnect-v1",
  };

  if (tokenMode === "team") {
    payload.iss = issuerId;
  } else {
    payload.sub = "user";
  }

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const rawSignature = sign("sha256", Buffer.from(signingInput), {
    key: createPrivateKey(privateKey),
    dsaEncoding: "ieee-p1363",
  });
  return `${signingInput}.${base64url(rawSignature)}`;
}

class ApiError extends Error {
  constructor(response, body) {
    super(`App Store Connect API ${response.status} ${response.statusText}: ${JSON.stringify(body, null, 2)}`);
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
    throw new ApiError(response, body);
  }

  return body;
}

function compactErrors(error) {
  const errors = error?.body?.errors;
  if (!Array.isArray(errors)) return error.message;
  return errors
    .map((item) => [item.code, item.title, item.detail].filter(Boolean).join(" — "))
    .join(" | ");
}

function isAlreadyOrNotNeeded(error) {
  const message = compactErrors(error).toLowerCase();
  return [
    "already",
    "duplicate",
    "in review",
    "waiting for review",
    "not in a state",
    "state_error",
  ].some((needle) => message.includes(needle));
}

async function getAppStoreVersion() {
  const url = new URL(`/v1/apps/${appId}/appStoreVersions`, "https://api.appstoreconnect.apple.com");
  url.searchParams.set("filter[platform]", platform);
  url.searchParams.set("limit", "50");
  const response = await api(`${url.pathname}${url.search}`);
  const candidates = (response.data || []).filter(
    (version) => version.attributes?.versionString === versionString && version.attributes?.platform === platform,
  );

  if (!candidates.length) {
    throw new Error(`Could not find ${platform} App Store version ${versionString}.`);
  }

  const preferredStates = new Set([
    "PREPARE_FOR_SUBMISSION",
    "READY_FOR_REVIEW",
    "REJECTED",
    "METADATA_REJECTED",
    "DEVELOPER_REJECTED",
    "INVALID_BINARY",
  ]);

  return candidates.find((version) => preferredStates.has(version.attributes?.appStoreState)) || candidates[0];
}

async function createReviewSubmission() {
  try {
    return await api("/v1/reviewSubmissions", {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "reviewSubmissions",
          attributes: { platform },
          relationships: {
            app: { data: { type: "apps", id: appId } },
          },
        },
      }),
    });
  } catch (error) {
    console.log(`Could not create a fresh review submission: ${compactErrors(error)}`);
    console.log("Looking for an existing ready draft submission to reuse.");
    const lookup = await api(`/v1/apps/${appId}/reviewSubmissions?filter[platform]=${platform}&include=items&limit=20`);
    const existing = (lookup.data || []).find((submission) =>
      ["READY_FOR_REVIEW", "UNRESOLVED_ISSUES"].includes(submission.attributes?.state),
    );
    if (!existing) throw error;
    return { data: existing };
  }
}

async function addAppVersionToSubmission(submissionId, versionId) {
  try {
    const response = await api("/v1/reviewSubmissionItems", {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "reviewSubmissionItems",
          relationships: {
            reviewSubmission: { data: { type: "reviewSubmissions", id: submissionId } },
            appStoreVersion: { data: { type: "appStoreVersions", id: versionId } },
          },
        },
      }),
    });
    console.log(`Added app version ${versionString} to review submission.`);
    return response;
  } catch (error) {
    console.log(`Could not add app version to review submission: ${compactErrors(error)}`);
    if (error?.body) {
      console.log(JSON.stringify(error.body, null, 2));
    }
    throw error;
  }
}

async function bestEffortSubmitSubscriptionGroup() {
  if (!subscriptionGroupId) return;
  try {
    await api("/v1/subscriptionGroupSubmissions", {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "subscriptionGroupSubmissions",
          relationships: {
            subscriptionGroup: { data: { type: "subscriptionGroups", id: subscriptionGroupId } },
          },
        },
      }),
    });
    console.log(`Submitted subscription group ${subscriptionGroupId} for review.`);
  } catch (error) {
    const detail = compactErrors(error);
    if (isAlreadyOrNotNeeded(error)) {
      console.log(`Subscription group ${subscriptionGroupId} appears already handled or only submit-able with app version: ${detail}`);
      return;
    }
    console.log(`WARNING: Subscription group ${subscriptionGroupId} could not be directly submitted: ${detail}`);
  }
}

async function bestEffortSubmitSubscription(subscriptionId) {
  try {
    await api("/v1/subscriptionSubmissions", {
      method: "POST",
      body: JSON.stringify({
        data: {
          type: "subscriptionSubmissions",
          relationships: {
            subscription: { data: { type: "subscriptions", id: subscriptionId } },
          },
        },
      }),
    });
    console.log(`Submitted subscription ${subscriptionId} for review.`);
  } catch (error) {
    const detail = compactErrors(error);
    if (isAlreadyOrNotNeeded(error)) {
      console.log(`Subscription ${subscriptionId} appears already handled or only submit-able with app version: ${detail}`);
      return;
    }
    console.log(`WARNING: Subscription ${subscriptionId} could not be directly submitted: ${detail}`);
  }
}

async function submitReviewSubmission(submissionId) {
  const response = await api(`/v1/reviewSubmissions/${submissionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "reviewSubmissions",
        id: submissionId,
        attributes: { submitted: true },
      },
    }),
  });
  console.log(`Submitted app review submission ${submissionId}. New state: ${response.data?.attributes?.state || "unknown"}.`);
  return response;
}

const version = await getAppStoreVersion();
console.log(`Found Bodywise Remedy iOS ${versionString}: ${version.id} (${version.attributes?.appStoreState || "unknown state"}).`);

const submission = await createReviewSubmission();
const submissionId = submission.data.id;
console.log(`Using review submission ${submissionId} (${submission.data.attributes?.state || "new"}).`);

await setAppVersionForReview(submissionId, version.id);
await addAppVersionToSubmission(submissionId, version.id);

await bestEffortSubmitSubscriptionGroup();
for (const subscriptionId of subscriptionIds) {
  await bestEffortSubmitSubscription(subscriptionId);
}

await submitReviewSubmission(submissionId);
console.log("Bodywise Remedy resubmission workflow completed.");


