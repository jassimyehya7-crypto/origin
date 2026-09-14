import { NextRequest, NextResponse } from "next/server";

const STAFF_COOKIE = "ec_staff_session";
const STAFF_ROLE_COOKIE = "ec_staff_role";

function secretsConfigured(): boolean {
  return Boolean(
    process.env.EC_STAFF_SECRET ||
      process.env.EC_PRO_PIN ||
      process.env.EC_FOUNDER_PIN
  );
}

function headerMatches(req: NextRequest, need: "pro" | "fondateur"): boolean {
  const header =
    req.headers.get("x-ec-staff-secret") ||
    req.headers.get("x-ec-pro-pin") ||
    req.headers.get("x-ec-founder-pin") ||
    "";
  if (!header) return false;
  const shared = process.env.EC_STAFF_SECRET;
  if (shared && header === shared) return true;
  const pin =
    need === "pro"
      ? process.env.EC_PRO_PIN || shared
      : process.env.EC_FOUNDER_PIN || shared;
  return Boolean(pin && header === pin);
}

function hasRole(req: NextRequest, need: "pro" | "fondateur"): boolean {
  if (!secretsConfigured()) return false;
  if (headerMatches(req, need)) return true;
  const session = req.cookies.get(STAFF_COOKIE)?.value;
  const roleRaw = req.cookies.get(STAFF_ROLE_COOKIE)?.value || "";
  if (session !== "1") return false;
  if (roleRaw === "both" || roleRaw === "staff") return true;
  return roleRaw.split(",").includes(need);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname === "/pro/login" ||
    pathname === "/fondateur/login" ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/pro")) {
    if (!hasRole(req, "pro")) {
      const url = req.nextUrl.clone();
      url.pathname = "/pro/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/fondateur")) {
    if (!hasRole(req, "fondateur")) {
      const url = req.nextUrl.clone();
      url.pathname = "/fondateur/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (
    pathname.startsWith("/api/pro/") ||
    pathname.startsWith("/api/founder/") ||
    pathname.startsWith("/api/demo/")
  ) {
    const need: "pro" | "fondateur" = pathname.startsWith("/api/founder/")
      ? "fondateur"
      : "pro";
    if (!hasRole(req, need)) {
      return NextResponse.json(
        {
          error: secretsConfigured()
            ? "Non autorisé"
            : "Auth staff non configurée",
        },
        { status: secretsConfigured() ? 401 : 503 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/pro/:path*",
    "/fondateur/:path*",
    "/api/pro/:path*",
    "/api/founder/:path*",
    "/api/demo/:path*",
  ],
};
