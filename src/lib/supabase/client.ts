import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../logger";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logger.warn(
      "Supabase credentials not configured in environment. Using robust hybrid in-memory store for reports.",
      "SupabaseClient"
    );
    return null;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    logger.info("Supabase PostgreSQL client initialized successfully", "SupabaseClient", { supabaseUrl });
    return supabaseClient;
  } catch (err) {
    logger.error("Failed to initialize Supabase client", "SupabaseClient", err);
    return null;
  }
}
