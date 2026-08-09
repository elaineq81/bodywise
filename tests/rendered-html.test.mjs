import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Bodywise Remedy release homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Bodywise Remedy Calisthenics — Bodyweight Strength Coach<\/title>/i);
  assert.match(html, /BODYWISE/);
  assert.match(html, /CALISTHENICS/);
  assert.match(html, /Your plan is ready/i);
  assert.match(html, /Start workout/i);
  assert.match(html, /TODAY · DAILY COACH/i);
  assert.match(html, /Not checked today/i);
  assert.match(html, /FIRST WIN BEFORE PREMIUM/i);
  assert.match(html, /NEXT BEST ACTION/);
  assert.match(html, /Body Confidence Path/i);
  assert.match(html, /Clear movement previews/i);
  assert.match(html, /Privacy/);
  assert.match(html, /Support/);
  assert.match(html, /Terms/);
  assert.doesNotMatch(html, /REAL HUMAN LOOP|REAL PERSON VIDEO|EXACT VIDEO|BODYWISE DEMO|EXACT DEMO/);
});

test("keeps release-critical wiring in source", async () => {
  const [page, layout, packageJson, capacitorConfig, capacitorExporter, bundledHome, bundledPrivacy, bundledTerms, screenshots] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../capacitor.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../scripts/export-capacitor.mjs", import.meta.url), "utf8"),
    readFile(new URL("../dist/client/index.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/client/privacy.html", import.meta.url), "utf8"),
    readFile(new URL("../dist/client/terms/index.html", import.meta.url), "utf8"),
    readdir(new URL("../app-store-assets/ios-6.5/", import.meta.url)),
  ]);

  assert.match(layout, /Bodywise Remedy Calisthenics — Bodyweight Strength Coach/);
  assert.match(page, /bodywise_remedy_premium_monthly/);
  assert.match(page, /bodywise_remedy_premium_yearly/);
  assert.match(page, /7-day free trial/);
  assert.match(page, /trackEvent\(/);
  assert.match(page, /workout_completed/);
  assert.match(page, /paywall_open/);
  assert.match(packageJson, /"audit:release"/);
  assert.match(packageJson, /npm run ios:export/);
  assert.match(capacitorConfig, /webDir: 'dist\/client'/);
  assert.match(capacitorConfig, /scheme: 'App'/);
  assert.doesNotMatch(capacitorConfig, /server\s*:/);
  assert.match(capacitorExporter, /const routes = \["\/", "\/privacy", "\/support", "\/terms"\]/);
  assert.match(bundledHome, /Start workout/i);
  assert.match(bundledPrivacy, /Privacy Policy — Bodywise Remedy/i);
  assert.match(bundledPrivacy, /import\("\/assets\/index-[^"]+\.js"\)/i);
  assert.match(bundledTerms, /Use Bodywise Remedy as guidance, not medical advice/i);
  const capacitorRoute = pathname => pathname.includes(".") ? pathname : "/index.html";
  assert.equal(capacitorRoute("/privacy"), "/index.html");
  assert.equal(capacitorRoute("/privacy.html"), "/privacy.html");
  assert.match(page, /window\.location\.assign\(`\/\$\{slug\}\.html`\)/);
  assert.equal(screenshots.filter(name => name.endsWith(".png")).length, 5);
  assert.doesNotMatch(page, /REAL HUMAN LOOP|REAL PERSON VIDEO|↻ EXACT DEMO|↻ BODYWISE DEMO|↻ EXACT VIDEO/);
});
