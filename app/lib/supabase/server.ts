import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Service-role client for route handlers. Bypasses RLS: never send it to the browser. */
export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Anon client for public reads (settings). */
export function getAnonSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Whether the registration switch in the dashboard is on. Open if unknown. */
export async function isRegistrationOpen(): Promise<boolean> {
  const supabase = getAnonSupabase();
  if (!supabase) return true;
  const { data } = await supabase
    .from("settings")
    .select("registration_open")
    .eq("id", true)
    .maybeSingle();
  return data?.registration_open ?? true;
}
