import { createPrivateKey, sign } from "node:crypto";

const APPLE_STANDARD_EULA_URL =
  "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";

const appId = process.env.APP_STORE_CONNECT_APP_ID || "6795566131";
const versionString = process.env.APP_STORE_VERSION || "1.1";
const locale = process.env.APP_STORE_LOCALE || "en-US";
const platform = process.env.APP_STORE_PLATFORM || "IOS";
const keyId = process.env.APPSTORE_KEY_ID || process.env.APP_STORE_CONNECT_KEY_ID;
const issuerId = process.env.APPSTORE_ISSUER_ID || process.env.APP_STORE_CONNECT_ISSUER_ID;
const privateKeyRaw = process.env.APPSTORE_PRIVATE_KEY || process.env.APP_STORE_CONNECT_PRIVATE_KEY;

const target = {
  name: "Bodywise Remedy Calisthenics",
  subtitle: "Bodyweight Strength Coach",
  keywords: "bodyweight,home workout,core,knee,strength,mobility,fitness,beginner,exercise,rehab",
  promotionalText: "Start with a safer daily bodyweight plan, then unlock your personal 4-week strength path.",
  marketingUrl: "https://bodywise-snowy.vercel.app",
  supportUrl: "https://bodywise-snowy.vercel.app/support",
  description: [
    "Bodywise Remedy is a calisthenics and bodyweight training app that builds safer daily workouts around your goal, age, level, and body condition.",
    "",
    "It is made for people who want clear, body-aware training without feeling overwhelmed.",
    "",
    "Choose your main target: core control, knee confidence, arm strength, upper body, lower body, mobility or full-body foundation. Bodywise then starts a guided bodyweight session built around your readiness, available time and movement needs.",
    "",
    "The app is designed to make training feel clear from the first screen:",
    "",
    "- Quick body check before each workout",
    "- Goal-based calisthenics sessions",
    "- Movement previews and simple coach cues",
    "- Beginner-friendly and knee-aware options",
    "- Timers, captions and effort feedback",
    "- Progress identity such as Core Control or Knee Confidence",
    "- Fresh rotations to reduce repeated generic routines",
    "",
    "Premium unlocks a more complete strength path with weekly progression, saved progress, full movement library access, recovery routines and replace-this-move alternatives.",
    "",
    "Bodywise Remedy is general fitness guidance, not medical care. Stop if a movement causes sharp pain and consult a qualified professional if you have an injury or medical concern.",
    "",
    `Terms of Use (EULA): ${APPLE_STANDARD_EULA_URL}`,
  ].join("\n"),
};

if (!keyId || !privateKeyRaw) {
  throw new Error(
    "Missing App Store Connect API credentials. Add APPSTORE_PRIVATE_KEY, APPSTORE_KEY_ID, and APPSTORE_ISSUER_ID or their APP_STORE_CONNECT_* equivalents.",
  );
}

if (target.name.length > 30) throw new Error(`App name is ${target.name.length}/30 characters.`);
if (target.subtitle.length > 30) throw new Error(`Subtitle is ${target.subtitle.length}/30 characters.`);
if (target.keywords.length > 100) throw new Error(`Keywords are ${target.keywords.length}/100 characters.`);
if (target.promotionalText.length > 170) throw new Error(`Promotional text is ${target.promotionalText.length}/170 characters.`);
if (target.description.length > 4000) throw new Error(`Description is ${target.description.length}/4000 characters.`);

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

function pickLocale(items, label) {
  const picked = items.find((item) => item.attributes?.locale === locale) || items[0];
  if (!picked) throw new Error(`No ${label} localization was found.`);
  return picked;
}

async function updateAppInfoLocalization() {
  const infos = await api(`/v1/apps/${appId}/appInfos?limit=50`);
  const appInfo = infos.data?.[0];
  if (!appInfo) throw new Error("No app info resource found for this app.");
  const localizations = await api(`/v1/appInfos/${appInfo.id}/appInfoLocalizations?limit=50`);
  const localization = pickLocale(localizations.data || [], "app info");
  await api(`/v1/appInfoLocalizations/${localization.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "appInfoLocalizations",
        id: localization.id,
        attributes: {
          name: target.name,
          subtitle: target.subtitle,
          privacyPolicyUrl: "https://bodywise-snowy.vercel.app/privacy",
        },
      },
    }),
  });
  console.log(`Updated app name/subtitle for ${localization.attributes?.locale || locale}.`);
}

async function updateVersionLocalization() {
  const versionsUrl = new URL(`/v1/apps/${appId}/appStoreVersions`, "https://api.appstoreconnect.apple.com");
  versionsUrl.searchParams.set("filter[platform]", platform);
  versionsUrl.searchParams.set("limit", "50");
  const versions = await api(`${versionsUrl.pathname}${versionsUrl.search}`);
  const version = (versions.data || []).find(
    (item) => item.attributes?.versionString === versionString && item.attributes?.platform === platform,
  );
  if (!version) throw new Error(`Could not find ${platform} App Store version ${versionString}. Create the new version in App Store Connect first.`);

  const localizations = await api(`/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations?limit=50`);
  const localization = pickLocale(localizations.data || [], "app version");
  await api(`/v1/appStoreVersionLocalizations/${localization.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "appStoreVersionLocalizations",
        id: localization.id,
        attributes: {
          description: target.description,
          keywords: target.keywords,
          marketingUrl: target.marketingUrl,
          promotionalText: target.promotionalText,
          supportUrl: target.supportUrl,
        },
      },
    }),
  });
  console.log(`Updated description, keywords, URLs and promotional text for iOS ${versionString}.`);
}

await updateAppInfoLocalization();
await updateVersionLocalization();
console.log("Bodywise Remedy discoverability metadata update completed.");