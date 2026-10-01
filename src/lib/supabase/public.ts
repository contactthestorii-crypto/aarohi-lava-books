import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/config";

export const CATALOG_TAG = "catalog";
export const CATALOG_REVALIDATE_SECONDS = 300;

let client: SupabaseClient | null = null;

export function getPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  
  const isMock = supabaseUrl.includes('mock.supabase.co');
  
  client ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        if (isMock) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        return fetch(input, { ...init, next: { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG] } });
      },
    },
  });
  return client;
}
