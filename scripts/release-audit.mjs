import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "app", "page.tsx");
const page = fs.readFileSync(pagePath, "utf8");
const capacitorConfig = fs.readFileSync(path.join(root, "capacitor.config.ts"), "utf8");
const packageJson = fs.readFileSync(path.join(root, "package.json"), "utf8");
const failures = [];
const warnings = [];
const ok = [];

function pass(label){ ok.push(label); }
function fail(label){ failures.push(label); }
function warn(label){ warnings.push(label); }
function exists(rel){ return fs.existsSync(path.join(root, rel)); }

for (const id of ["bodywise_remedy_premium_monthly", "bodywise_remedy_premium_yearly"]) {
  page.includes(id) ? pass(`subscription product present: ${id}`) : fail(`missing subscription product: ${id}`);
}
page.includes("7-day free trial") ? pass("7-day free trial copy present") : fail("missing 7-day free trial copy");
page.includes("trackEvent(") ? pass("local retention/event tracking hooks present") : fail("missing local tracking hooks");

capacitorConfig.includes("webDir: 'dist/client'") ? pass("Capacitor uses the local app bundle") : fail("Capacitor local webDir is not configured");
!capacitorConfig.includes("server:") ? pass("Capacitor has no remote website wrapper") : fail("Capacitor still points at a remote server");
capacitorConfig.includes("scheme: 'App'") ? pass("Capacitor matches the shared Xcode App scheme") : fail("Capacitor iOS scheme does not match Xcode");
exists("scripts/export-capacitor.mjs") && packageJson.includes("npm run ios:export")
  ? pass("iOS build exports a local HTML entry before sync")
  : fail("iOS build does not create a local Capacitor entry page");
page.includes("window.location.assign(`/${slug}.html`)")
  ? pass("native legal links use concrete bundled HTML files")
  : fail("native legal links can fall through to the Capacitor homepage");

for (const rel of ["app/privacy/page.tsx", "app/support/page.tsx", "app/terms/page.tsx"]) {
  exists(rel) ? pass(`${rel} exists`) : fail(`${rel} missing`);
}

const bannedVisible = ["REAL HUMAN LOOP", "REAL PERSON VIDEO", "↻ EXACT DEMO", "↻ BODYWISE DEMO", "↻ EXACT VIDEO"];
for (const text of bannedVisible) {
  page.includes(text) ? fail(`customer-facing build label still present: ${text}`) : pass(`removed build label: ${text}`);
}

const mNames = [...page.matchAll(/\n\s*[a-zA-Z0-9_]+:\{name:"([^"]+)"/g)].map(m => m[1]);
const setMatch = page.match(/const exactMoveMediaNames=new Set\(\[([\s\S]*?)\]\)/);
const exactNames = new Set(setMatch ? [...setMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1]) : []);
const aliasMatch = page.match(/const movePreviewAliases:Record<string,string>=\{([\s\S]*?)\};/);
const aliasNames = new Set(aliasMatch ? [...aliasMatch[1].matchAll(/"([^"]+)":/g)].map(m => m[1]) : []);
const missingMovementNames = mNames.filter(name => !exactNames.has(name) && !aliasNames.has(name));
missingMovementNames.length ? fail(`moves without approved media marker: ${missingMovementNames.join(", ")}`) : pass(`${mNames.length} move definitions have approved media markers`);

const vaultNames = [...page.matchAll(/\{name:"([^"]+)",move:"[^"]+"/g)].map(m => m[1]);
const vaultMapMatch = page.match(/const vaultExactVideos:Record<string,VaultVideo>=\{([\s\S]*?)\};\r?\nconst premiumSourcePlan/);
const vaultVideoNames = new Set(vaultMapMatch ? [...vaultMapMatch[1].matchAll(/\n\s*"([^"]+)":\{kind:"direct"/g)].map(m => m[1]) : []);
const missingVault = [...new Set(vaultNames.filter(name => !vaultVideoNames.has(name)))];
missingVault.length ? fail(`Move Vault entries without direct visual: ${missingVault.join(", ")}`) : pass(`${vaultNames.length} Move Vault entries have direct visuals`);

const localPaths = new Set();
for (const re of [/(?:image|video|src|poster|preview|url):"(\/[^"]+)"/g, /<img src="(\/[^"]+)"/g, /<video src=\{?"(\/[^"]+)"/g]) {
  for (const m of page.matchAll(re)) localPaths.add(m[1].split("?")[0]);
}
const missingAssets = [...localPaths].filter(p => !fs.existsSync(path.join(root, "public", p.replace(/^\//, ""))));
missingAssets.length ? fail(`missing public media assets: ${missingAssets.join(", ")}`) : pass(`${localPaths.size} referenced local media assets exist`);

const shotsDir = path.join(root, "app-store-assets", "ios-6.5");
const shots = fs.existsSync(shotsDir) ? fs.readdirSync(shotsDir).filter(f => f.endsWith(".png")) : [];
function pngSize(file){
  const b = fs.readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}
if (shots.length >= 5) {
  const wrong = shots.map(f => ({ f, ...pngSize(path.join(shotsDir, f)) })).filter(s => s.width !== 1242 || s.height !== 2688);
  wrong.length ? fail(`App Store screenshots wrong size: ${wrong.map(s => `${s.f} ${s.width}x${s.height}`).join(", ")}`) : pass(`${shots.length} App Store screenshots found at 1242x2688`);
} else {
  fail(`expected at least 5 iPhone 6.5 screenshots, found ${shots.length}`);
}

if (page.includes("not medical care") && page.includes("Stop if a movement causes sharp pain")) pass("medical safety language present");
else warn("medical safety wording should be reviewed before submission");

const report = {
  generatedAt: new Date().toISOString(),
  status: failures.length ? "needs_attention" : "pass",
  passed: ok,
  warnings,
  failures,
};
const outPath = path.join(root, "app-store-assets", "release-audit.json");
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`Bodywise Remedy release audit: ${report.status}`);
console.log(`Passed: ${ok.length}`);
if (warnings.length) console.log(`Warnings: ${warnings.length}\n- ${warnings.join("\n- ")}`);
if (failures.length) {
  console.error(`Failures: ${failures.length}\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
}
