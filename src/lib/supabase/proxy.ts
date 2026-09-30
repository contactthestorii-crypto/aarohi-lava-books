import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/config";

/**
 * Refreshes the Supabase auth session cookie and returns the (optimistic) user id.
 * Authorisation is always re-checked on the server; this only keeps sessions alive and
 * lets proxy.ts redirect signed-out visitors early.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return { response, userId: null as string | null };

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  return { response, userId };
}
