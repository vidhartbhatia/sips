import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Admin Supabase client using the secret key.
 * Bypasses RLS — use only in server actions / API routes.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
