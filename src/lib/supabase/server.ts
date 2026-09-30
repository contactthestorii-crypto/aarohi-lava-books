import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/config";

/**
 * Supabase client bound to the signed-in user's session (RLS applies as that user).
 * Use in Server Components, Server Actions and Route Handlers.
 */
export async function createServerSupabase() {
  if (!isSupabaseConfigured) throw new StoreNotConfiguredError();
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component: cookies are read-only there. proxy.ts refreshes sessions.
        }
      },
    },
  });
}

export class StoreNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
    this.name = "StoreNotConfiguredError";
  }
}
