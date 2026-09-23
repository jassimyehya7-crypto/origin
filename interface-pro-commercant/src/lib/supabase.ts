import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const demoMode = import.meta.env.MODE === "demo";
export const initialAuthRedirect = typeof window !== "undefined" &&
  new URLSearchParams(window.location.hash.slice(1)).has("access_token");

// Ne créer le client que côté navigateur (pas en SSR Node.js)
// Node.js 20 n'a pas de WebSocket natif → Supabase realtime plante
export const supabase = !demoMode && typeof window !== "undefined" && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (typeof window !== "undefined" && !supabase) {
  console.warn(demoMode
    ? "[Supabase] Mode démonstration — données statiques"
    : "[Supabase] Credentials manquantes — fallback sur données statiques");
}
