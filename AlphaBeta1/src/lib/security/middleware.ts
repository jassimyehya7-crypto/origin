/**
 * OffresLocal — Server Security Middleware
 * Applique le shield sur toutes les requêtes API
 */

import {
  checkRateLimit,
  validateRequestToken,
  getAbuseScore,
  isBlocked,
  logAbuseEvent,
  LIMITS,
  createShieldHeaders,
  type ShieldContext,
} from "@/lib/security/shield";

interface SecurityResult {
  allowed: boolean;
  status?: number;
  error?: string;
  headers: Record<string, string>;
  ctx: ShieldContext;
}

export function shieldRequest(
  req: { headers: { get(name: string): string | null } },
  action: string
): SecurityResult {
  const fingerprint = req.headers.get("X-OL-FP") || "anonymous";
  const token = req.headers.get("X-OL-Token") || "";
  const timestamp = parseInt(req.headers.get("X-OL-TS") || "0", 10);
  const abuseScore = getAbuseScore(fingerprint);
  const blocked = isBlocked(fingerprint);

  const ctx: ShieldContext = {
    fingerprint,
    token,
    timestamp,
    abuseScore,
    isBot: false,
    isBlocked: blocked,
  };

  const headers = createShieldHeaders(ctx);

  // Layer 1: Blocked fingerprint
  if (blocked) {
    logAbuseEvent("blocked_access", fingerprint);
    return {
      allowed: false,
      status: 429,
      error: "Trop de requêtes. Réessayez plus tard.",
      headers,
      ctx,
    };
  }

  // Layer 2: Token validation (for sensitive actions)
  const sensitiveActions = ["reservation", "favorite", "cancel"];
  if (sensitiveActions.includes(action) && token) {
    if (!validateRequestToken(token, action)) {
      logAbuseEvent("invalid_token", fingerprint);
      return {
        allowed: false,
        status: 403,
        error: "Session expirée. Rechargez la page.",
        headers,
        ctx,
      };
    }
  }

  // Layer 3: Rate limiting
  const limit = LIMITS[action as keyof typeof LIMITS] || LIMITS.api;
  const rateKey = `${action}:${fingerprint}`;
  const rate = checkRateLimit(rateKey, limit.max, limit.windowMs);
  if (!rate.allowed) {
    logAbuseEvent("rate_limited", fingerprint);
    headers["Retry-After"] = String(Math.ceil(rate.retryAfterMs / 1000));
    return {
      allowed: false,
      status: 429,
      error: `Trop de requêtes. Réessayez dans ${Math.ceil(rate.retryAfterMs / 1000)}s.`,
      headers,
      ctx,
    };
  }

  // Layer 4: Abuse score check
  if (abuseScore >= 50) {
    // High abuse score — add CAPTCHA challenge header
    headers["X-OL-Challenge"] = "required";
  }

  return { allowed: true, headers, ctx };
}

/**
 * Anti-scraping headers for all responses
 */
export function securityResponseHeaders(): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-src https://www.google.com https://openstreetmap.org https://*.openstreetmap.org",
    ].join("; "),
  };
}
