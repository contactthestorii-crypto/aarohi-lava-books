import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseUrl } from "@/lib/config";
import { serviceRoleKey } from "@/lib/env";
import { StoreNotConfiguredError } from "./server";

let client: SupabaseClient | null = null;

/**
 * Service-role client: bypasses RLS. Only for services and route handlers after the caller
 * has been authorised (docs/RULES.md). Reads are never cached.
 */
export function getAdminSupabase(): SupabaseClient {
  const key = serviceRoleKey();
  if (!isSupabaseConfigured || !key) throw new StoreNotConfiguredError();
  client ??= createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return client;
}

export function isAdminClientConfigured(): boolean {
  return isSupabaseConfigured && Boolean(serviceRoleKey());
}
