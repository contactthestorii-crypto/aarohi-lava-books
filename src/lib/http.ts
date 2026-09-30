import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { siteUrl } from "@/lib/config";

/**
 * CSRF guard for cookie-authenticated JSON route handlers (Server Actions already check
 * Origin themselves). Browsers always send Origin on cross-site POSTs, so a mismatch is
 * rejected. Webhooks and cron use their own signatures and must not use this.
 */
export function rejectCrossSite(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null; // same-origin fetches from older browsers / server-to-server
  const allowed = new Set([request.nextUrl.origin, siteUrl]);
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) allowed.add(`${request.nextUrl.protocol}//${forwardedHost}`);
  if (allowed.has(origin)) return null;
  return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
}
