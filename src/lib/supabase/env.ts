export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("placeholder"));
}

export function getSupabaseEnv(): { url: string; anonKey: string } | null {
  if (!isSupabaseConfigured()) return null;
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}

/** Server-only service role — never expose to client / NEXT_PUBLIC_*. */
export function getServiceRoleKey(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || key.includes("your-") || key.includes("placeholder")) return null;
  return key;
}

export function hasServiceRole(): boolean {
  return Boolean(getSupabaseEnv() && getServiceRoleKey());
}

export const DEMO_CLIENT_ID = "client_demo";
export const DEMO_CLIENT = {
  id: DEMO_CLIENT_ID,
  name: "Client",
  phone: "079 000 00 01",
};
