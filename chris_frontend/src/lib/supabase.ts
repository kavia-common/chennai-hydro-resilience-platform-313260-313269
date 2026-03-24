import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

let _client: SupabaseClient | null = null;

/**
 * PUBLIC_INTERFACE
 */
export function getSupabaseClient(): SupabaseClient | null {
  /** Lazily create and return the Supabase client. */
  if (_client) return _client;

  const cfg = getSupabaseConfig();
  if (!cfg) return null;

  _client = createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return _client;
}
