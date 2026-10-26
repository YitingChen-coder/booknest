import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * A Supabase client for the signed-in person, used on the server only.
 *
 * Every request carries the person's Clerk session token. Supabase verifies it
 * (third-party auth with Clerk) and row-level security uses its `sub` claim to
 * decide which rows that person may read or write. We only use the publishable
 * key here, never a service-role key, so RLS always applies.
 */
export async function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  const { getToken } = await auth();

  return createClient(url, key, {
    accessToken: async () => (await getToken()) ?? null,
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
