import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/config";

export const CATALOG_TAG = "catalog";
export const CATALOG_REVALIDATE_SECONDS = 300;

let client: SupabaseClient | null = null;

/**
 * Anonymous, cookie-less client for public catalog reads. Its fetches are cached by Next.js
 * (tag "catalog", 5 minutes) so storefront pages stay static and fast. Admin edits call
 * updateTag(CATALOG_TAG). Never use it for prices at checkout: use the uncached admin client.
 */
export function getPublicSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  client ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, next: { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [CATALOG_TAG] } }),
    },
  });
  return client;
}
