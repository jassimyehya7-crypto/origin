import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseEnv } from "./env";

/**
 * Server Supabase client.
 * Prefer SERVICE ROLE for all server reads/writes (bypasses RLS).
 * Falls back to anon only if service role missing (dev) — logs a warning.
 * Never import this from client components.
 */
export function createServerClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  if (!env) return null;
  const serviceKey = getServiceRoleKey();
  const key = serviceKey || env.anonKey;
  if (!serviceKey) {
    console.warn(
      "[supabase] SUPABASE_SERVICE_ROLE_KEY missing — using anon key on server (not pilot-safe)"
    );
  }
  return createClient(env.url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Explicit service-role client; returns null if key unset. */
export function createServiceClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  const serviceKey = getServiceRoleKey();
  if (!env || !serviceKey) return null;
  return createClient(env.url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
