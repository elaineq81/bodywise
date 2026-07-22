import {NextRequest, NextResponse} from "next/server";

type MuscleWikiVideo = {
  url?: string;
  video?: string;
  filename?: string;
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
    return NextResponse.json(
      {error: "MuscleWiki search failed.", status: upstream.status},
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
      // Do not proxy/download media here. MuscleWiki videos must stream inside
      // the app through their authenticated API media routes per their terms.
    })),
  });
}
