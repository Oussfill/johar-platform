import { createClient, SupabaseClient } from "@supabase/supabase-js";

const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};

function buildClient(): SupabaseClient | null {
  const url = env.VITE_SUPABASE_URL || "";
  const anonKey = env.VITE_SUPABASE_ANON_KEY || "";
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}

export const supabase: SupabaseClient = buildClient() as SupabaseClient;

export const isSupabaseEnabled: boolean = Boolean(supabase);
