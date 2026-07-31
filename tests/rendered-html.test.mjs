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
  assert.match(html, /<title>Bodywise Remedy — Your adaptive calisthenics coach<\/title>/i);
  assert.match(html, /BODYWISE REMEDY/);
  assert.match(html, /CALISTHENICS COACH/);
  assert.match(html, /Start free session/i);
  assert.match(html, /BODY CONFIDENCE PATH/);
  assert.match(html, /Movement media checks/);
  assert.match(html, /Privacy/);
  assert.match(html, /Support/);
  assert.match(html, /Terms/);
  assert.doesNotMatch(html, /REAL HUMAN LOOP|REAL PERSON VIDEO|EXACT VIDEO|BODYWISE DEMO|EXACT DEMO/);
});

test("keeps release-critical wiring in source", async () => {
  const [page, layout, packageJson, screenshots] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readdir(new URL("../app-store-assets/ios-6.5/", import.meta.url)),
  ]);

  assert.match(layout, /Bodywise Remedy — Your adaptive calisthenics coach/);
  assert.match(page, /bodywise_remedy_premium_monthly/);
  assert.match(page, /bodywise_remedy_premium_yearly/);
  assert.match(page, /7-day free trial/);
  assert.match(page, /trackEvent\(/);
  assert.match(page, /workout_completed/);
  assert.match(page, /paywall_open/);
  assert.match(packageJson, /"audit:release"/);
  assert.equal(screenshots.filter(name => name.endsWith(".png")).length, 5);
  assert.doesNotMatch(page, /REAL HUMAN LOOP|REAL PERSON VIDEO|↻ EXACT DEMO|↻ BODYWISE DEMO|↻ EXACT VIDEO/);
});