import {NextRequest, NextResponse} from "next/server";

type MuscleWikiVideo = {
  url?: string;
  video?: string;
  filename?: string;
  path?: string;
  gender?: string;
  angle?: string;
  type?: string;
};

type MuscleWikiExercise = {
  id: number;
  name: string;
  difficulty?: string | null;
  category?: string | null;
  primary_muscles?: string[];
  videos?: MuscleWikiVideo[];
};

const API_BASE = "https://api.musclewiki.com";

function cleanQuery(value: string | null) {
  return (value || "").trim().slice(0, 80);
}

export async function GET(request: NextRequest) {
  const key = process.env.MUSCLEWIKI_API_KEY;
  const query = cleanQuery(request.nextUrl.searchParams.get("q"));

  if (!key) {
    return NextResponse.json(
      {error: "MuscleWiki is not connected yet."},
      {status: 503},
    );
  }

  if (query.length < 2) {
    return NextResponse.json(
      {error: "Search with at least 2 characters."},
      {status: 400},
    );
  }

  const upstream = await fetch(
    `${API_BASE}/search?q=${encodeURIComponent(query)}&limit=8`,
    {
      headers: {"X-API-Key": key},
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    let detail = "MuscleWiki search failed.";
    let upgradeUrl: string | undefined;
    try {
      const errorPayload = await upstream.json();
      detail = errorPayload?.message || errorPayload?.detail || detail;
      upgradeUrl = errorPayload?.upgrade_url;
    } catch {}
    return NextResponse.json(
      {error: detail, status: upstream.status, upgradeUrl},
      {status: upstream.status},
    );
  }

  const payload = await upstream.json();
  const results: MuscleWikiExercise[] = Array.isArray(payload?.results)
    ? payload.results
    : Array.isArray(payload?.exercises)
      ? payload.exercises
      : [];

  return NextResponse.json({
    query,
    results: results.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      difficulty: exercise.difficulty,
      category: exercise.category,
      muscles: exercise.primary_muscles || [],
      videoCount: exercise.videos?.length || 0,
      videos: (exercise.videos || []).slice(0, 4).map((video, index) => ({
        index,
        gender: video.gender,
        angle: video.angle,
        type: video.type,
        filename: video.filename,
        path: video.path,
        hasStream: Boolean(video.filename || video.path || video.url || video.video),
      })),
    })),
  });
}
