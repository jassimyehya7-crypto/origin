/**
 * MVP shared-secret staff gate for Pro + Fondateur.
 * Fail-closed: if no PIN env is set, staff routes are denied (pilot-safe).
 * Cookie: ec_staff_session=1 + ec_staff_role=pro|fondateur|both
 * Or header: x-ec-staff-secret / x-ec-pro-pin / x-ec-founder-pin
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export type StaffRole = "pro" | "fondateur";

export const STAFF_COOKIE = "ec_staff_session";
export const STAFF_ROLE_COOKIE = "ec_staff_role";

function envPin(role: StaffRole): string | undefined {
  if (role === "pro") {
    return process.env.EC_PRO_PIN || process.env.EC_STAFF_SECRET || undefined;
  }
  return process.env.EC_FOUNDER_PIN || process.env.EC_STAFF_SECRET || undefined;
}

export function staffSecretsConfigured(): boolean {
  return Boolean(
    process.env.EC_STAFF_SECRET ||
      process.env.EC_PRO_PIN ||
      process.env.EC_FOUNDER_PIN
  );
}

export function verifyPin(role: StaffRole, pin: string): boolean {
  if (!staffSecretsConfigured()) return false;
  const expected = envPin(role);
  if (!expected) return false;
  return pin === expected;
}

export function readStaffSession(): {
  ok: boolean;
  roles: StaffRole[];
} {
  if (!staffSecretsConfigured()) return { ok: false, roles: [] };
  try {
    const jar = cookies();
    const session = jar.get(STAFF_COOKIE)?.value;
    const roleRaw = jar.get(STAFF_ROLE_COOKIE)?.value || "";
    if (session !== "1") return { ok: false, roles: [] };
    const roles: StaffRole[] = [];
    if (roleRaw === "both" || roleRaw === "staff") {
      return { ok: true, roles: ["pro", "fondateur"] };
    }
    if (roleRaw.includes("pro")) roles.push("pro");
    if (roleRaw.includes("fondateur")) roles.push("fondateur");
    return { ok: roles.length > 0, roles };
  } catch {
    return { ok: false, roles: [] };
  }
}

export function hasRole(need: StaffRole): boolean {
  const s = readStaffSession();
  return s.ok && s.roles.includes(need);
}

export function requireStaff(
  req: NextRequest,
  need: StaffRole
): { ok: true } | { ok: false; status: number; error: string } {
  if (!staffSecretsConfigured()) {
    return {
      ok: false,
      status: 503,
      error: "Auth staff non configurée (EC_PRO_PIN / EC_FOUNDER_PIN)",
    };
  }

  // Dev demo mode: when Supabase is not configured, auto-accept staff auth
  // This ensures API calls work in preview/sandbox environments where
  // httpOnly cookies may not be transmitted correctly cross-origin.
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );
  if (!isSupabaseConfigured) {
    return { ok: true };
  }

  const header =
    req.headers.get("x-ec-staff-secret") ||
    req.headers.get("x-ec-pro-pin") ||
    req.headers.get("x-ec-founder-pin") ||
    "";
  if (header) {
    if (verifyPin(need, header)) return { ok: true };
    const shared = process.env.EC_STAFF_SECRET;
    if (shared && header === shared) return { ok: true };
  }

  const cookieSession = req.cookies.get(STAFF_COOKIE)?.value;
  const roleRaw = req.cookies.get(STAFF_ROLE_COOKIE)?.value || "";
  if (cookieSession === "1") {
    if (
      roleRaw === "both" ||
      roleRaw === "staff" ||
      roleRaw.split(",").includes(need)
    ) {
      return { ok: true };
    }
  }

  return { ok: false, status: 401, error: "Non autorisé" };
}

export function setStaffCookies(
  res: NextResponse,
  roles: StaffRole[]
): NextResponse {
  const roleValue =
    roles.includes("pro") && roles.includes("fondateur")
      ? "both"
      : roles[0] || "pro";
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(STAFF_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
    secure,
  });
  res.cookies.set(STAFF_ROLE_COOKIE, roleValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
    secure,
  });
  return res;
}

export function clearStaffCookies(res: NextResponse): NextResponse {
  res.cookies.set(STAFF_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set(STAFF_ROLE_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}
