import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseUrl } from "@/lib/config";
import { serviceRoleKey } from "@/lib/env";
import { StoreNotConfiguredError } from "./server";

let client: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  const key = serviceRoleKey();
  if (!isSupabaseConfigured || !key) throw new StoreNotConfiguredError();
  
  const isMock = supabaseUrl.includes('mock.supabase.co');
  
  client ??= createClient(supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { 
      fetch: async (input, init) => {
        if (isMock) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        return fetch(input, { ...init, cache: "no-store" });
      }
    },
  });
  return client;
}

export function isAdminClientConfigured(): boolean {
  return isSupabaseConfigured && Boolean(serviceRoleKey());
}
