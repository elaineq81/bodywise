import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const clientDirectory = path.resolve("dist/client");
const workerEntry = path.resolve("dist/server/index.js");
const workerUrl = new URL(pathToFileURL(workerEntry));
workerUrl.searchParams.set("capacitor-export", `${Date.now()}`);

const { default: worker } = await import(workerUrl.href);
const routes = ["/", "/privacy", "/support", "/terms"];

const environment = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};
const context = {
  waitUntil() {},
  passThroughOnException() {},
};

async function renderRoute(route) {
  const response = await worker.fetch(
    new Request(`https://localhost${route}`, {
      headers: { accept: "text/html" },
    }),
    environment,
    context,
  );

  if (!response.ok) {
    throw new Error(`Could not export ${route}: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("text/html")) {
    throw new Error(`Could not export ${route}: expected HTML but received ${contentType || "no content type"}`);
  }

  const html = await response.text();
  if (!html.includes("Bodywise Remedy")) {
    throw new Error(`Could not export ${route}: Bodywise Remedy content is missing`);
  }

  if (route === "/") {
    await writeFile(path.join(clientDirectory, "index.html"), html, "utf8");
    return;
  }

  const slug = route.slice(1);
  const routeDirectory = path.join(clientDirectory, slug);
  await mkdir(routeDirectory, { recursive: true });
  await Promise.all([
    writeFile(path.join(routeDirectory, "index.html"), html, "utf8"),
    writeFile(path.join(clientDirectory, `${slug}.html`), html, "utf8"),
  ]);
}

await Promise.all(routes.map(renderRoute));
console.log(`Exported ${routes.length} local Capacitor routes to ${clientDirectory}`);
