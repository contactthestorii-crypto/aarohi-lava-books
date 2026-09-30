import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Refreshes the Supabase session cookie and redirects signed-out visitors away from
 * private areas early. This is an optimistic check only: every protected page and action
 * verifies the user again on the server (docs/SECURITY.md).
 */
export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const isPrivate = pathname.startsWith("/account") || pathname.startsWith("/admin");
  if (isPrivate && !userId) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/cart",
    "/checkout/:path*",
    "/order-success",
    "/books/:slug*/review",
    "/api/cart/:path*",
    "/api/checkout/:path*",
    "/api/payments/:path*",
  ],
};
