import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { log } from "@/lib/utils/log";
import { searchProducts } from "@/services/catalog";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ items: [] });
  if (!(await checkRateLimit("search"))) {
    return NextResponse.json({ error: "Too many searches. Please slow down." }, { status: 429 });
  }
  try {
    const result = await searchProducts(q, 1, 6);
    const items = result.items.map((p) => ({
      slug: p.slug,
      title: p.title,
      author: p.author,
      pricePaise: p.pricePaise,
      coverUrl: p.cover?.url ?? null,
    }));
    return NextResponse.json({ items }, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
  } catch (error) {
    log.error("api.search.suggest", error);
    return NextResponse.json({ error: "Search is unavailable right now." }, { status: 503 });
  }
}
