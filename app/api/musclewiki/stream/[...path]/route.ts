import {NextRequest, NextResponse} from "next/server";

const API_BASE = "https://api.musclewiki.com";

function safePath(parts: string[]) {
  const joined = parts.join("/");
  if (!/^[a-zA-Z0-9._\-/]+$/.test(joined) || joined.includes("..")) return null;
  return joined;
}

export async function GET(
  request: NextRequest,
  context: {params: Promise<{path: string[]}>},
) {
  const key = process.env.MUSCLEWIKI_API_KEY;
  const {path} = await context.params;
  const streamPath = safePath(path || []);

  if (!key) {
    return NextResponse.json({error: "MuscleWiki is not connected yet."}, {status: 503});
  }

  if (!streamPath) {
    return NextResponse.json({error: "Invalid MuscleWiki stream path."}, {status: 400});
  }

  const upstream = await fetch(`${API_BASE}/stream/videos/${streamPath}`, {
    headers: {
      "X-API-Key": key,
      ...(request.headers.get("range") ? {range: request.headers.get("range") as string} : {}),
    },
    cache: "no-store",
  });

  if (!upstream.ok) {
    let detail = "MuscleWiki stream failed.";
    try {
      const errorPayload = await upstream.clone().json();
      detail = errorPayload?.message || errorPayload?.detail || detail;
    } catch {}
    return NextResponse.json({error: detail, status: upstream.status}, {status: upstream.status});
  }

  const headers = new Headers();
  for (const name of ["content-type", "content-length", "content-range", "accept-ranges"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("cache-control", "private, no-store");

  return new NextResponse(upstream.body, {status: upstream.status, headers});
}
