import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!url) {
    return NextResponse.json(
      { connected: false, error: "Convex preview URL is not configured." },
      { status: 503 },
    );
  }

  try {
    const client = new ConvexHttpClient(url);
    const health = await client.query(api.bodywise.health, {});
    return NextResponse.json({ ...health, url });
  } catch {
    return NextResponse.json(
      { connected: false, error: "Convex preview did not respond." },
      { status: 502 },
    );
  }
}
