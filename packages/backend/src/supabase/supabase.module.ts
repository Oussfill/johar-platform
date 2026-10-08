import { Global, Logger, Module } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CLIENT } from "./supabase.constants";

const logger = new Logger("SupabaseModule");

function buildClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || (!serviceKey && !anonKey)) {
    if (process.env.NODE_ENV === "production") {
      logger.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in production.");
      process.exit(1);
    }
    logger.warn("Supabase environment variables missing — Supabase client disabled. Set SUPABASE_URL and a key.");
    return null;
  }

  const key: string = serviceKey || anonKey || "";
  logger.log(`Supabase client created for ${url}`);
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

@Global()
@Module({
  providers: [{ provide: SUPABASE_CLIENT, useFactory: buildClient }],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}