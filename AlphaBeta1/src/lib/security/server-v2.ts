/**
 * OffresLocal Shield v2 — Server Validation Middleware
 * ═══════════════════════════════════════════════════════
 * Validates all security layers on incoming requests
 */

import {
  hmacVerify,
  verifyPoW,
  cipherDecrypt,
  adaptiveRateLimit,
  advancedBotDetection,
  ADAPTIVE_LIMITS,
} from "./shield-v2";

import {
  getAbuseScore,
  isBlocked,
  logAbuseEvent,
} from "./shield";

interface ServerValidationResult {
  allowed: boolean;
  status?: number;
  error?: string;
  headers: Record<string, string>;
  riskLevel: "low" | "medium" | "high" | "critical";
  details: {
    fingerprintValid: boolean;
    signatureValid: boolean;
    powValid: boolean;
    sessionValid: boolean;
    rateLimited: boolean;
    humanScore: number;
    abuseScore: number;
  };
}

const _SECRET = "OL_5h13ld_v2"; // Must match client-side secret

export function validateSecuredRequest(
  req: { headers: { get(name: string): string | null } },
  action: keyof typeof ADAPTIVE_LIMITS
): ServerValidationResult {
  const headers = req.headers;
  const fp = headers.get("X-OL-FP") || "";
  const session = headers.get("X-OL-Session") || "";
  const signature = headers.get("X-OL-Sig") || "";
  const timestamp = parseInt(headers.get("X-OL-TS") || "0", 10);
  const powData = headers.get("X-OL-PoW") || "";
  const humanScore = parseInt(headers.get("X-OL-Human") || "50", 10);

  const responseHeaders: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  };

  const details = {
    fingerprintValid: false,
    signatureValid: false,
    powValid: false,
    sessionValid: false,
    rateLimited: false,
    humanScore,
    abuseScore: 0,
  };

  // ═══ Layer 1: Fingerprint validation ═══
  if (fp && fp.startsWith("v2_") && fp.length >= 20) {
    details.fingerprintValid = true;
  } else if (fp === "anonymous") {
    // Allow anonymous but flag it
    details.fingerprintValid = true;
  }

  // ═══ Layer 2: Timestamp freshness (5 min window) ═══
  const age = Date.now() - timestamp;
  if (age > 300_000 || age < -60_000) {
    return {
      allowed: false,
      status: 403,
      error: "Requête expirée. Rechargez la page.",
      headers: responseHeaders,
      riskLevel: "high",
      details,
    };
  }

  // ═══ Layer 3: Signature verification ═══
  if (signature) {
    const payload = `${action}:${fp}:${timestamp}`;
    details.signatureValid = hmacVerify(payload, _SECRET, signature);
    if (!details.signatureValid) {
      logAbuseEvent("invalid_signature", fp);
    }
  }

  // ═══ Layer 4: Session validation ═══
  if (session && fp) {
    try {
      const decrypted = cipherDecrypt(session, fp);
      details.sessionValid = decrypted.includes(":") && decrypted.length > 10;
    } catch {
      details.sessionValid = false;
    }
  }

  // ═══ Layer 5: Proof of Work (for sensitive actions) ═══
  const sensitiveActions: string[] = ["reservation", "cancel", "payment"];
  if (sensitiveActions.includes(action) && powData) {
    const [challenge, nonceStr] = powData.split(":").slice(-2);
    const nonce = parseInt(nonceStr || "0", 10);
    if (challenge && !isNaN(nonce)) {
      details.powValid = verifyPoW(
        powData.split(":").slice(0, -1).join(":"),
        nonce,
        3
      );
    }
  } else if (!sensitiveActions.includes(action)) {
    details.powValid = true; // Not required for non-sensitive actions
  }

  // ═══ Layer 6: Adaptive rate limiting ═══
  const rateKey = `${action}:${fp}`;
  const rateResult = adaptiveRateLimit(rateKey, action);
  details.rateLimited = !rateResult.allowed;

  if (rateResult.allowed) {
    responseHeaders["X-RateLimit-Remaining"] = String(rateResult.remaining);
  } else {
    responseHeaders["Retry-After"] = String(Math.ceil(rateResult.retryAfterMs / 1000));
    responseHeaders["X-RateLimit-Backoff"] = String(rateResult.backoffLevel);
  }

  // ═══ Layer 7: Abuse score check ═══
  details.abuseScore = getAbuseScore(fp);
  if (isBlocked(fp)) {
    return {
      allowed: false,
      status: 429,
      error: "Activité suspecte détectée. Contactez le support.",
      headers: responseHeaders,
      riskLevel: "critical",
      details,
    };
  }

  // ═══ Layer 8: Human score check ═══
  if (humanScore < 20 && sensitiveActions.includes(action)) {
    responseHeaders["X-OL-Challenge"] = "required";
    logAbuseEvent("low_human_score", fp);
  }

  // ═══ Calculate risk level ═══
  let riskScore = 0;
  if (!details.fingerprintValid) riskScore += 30;
  if (!details.signatureValid) riskScore += 25;
  if (!details.powValid) riskScore += 20;
  if (!details.sessionValid) riskScore += 15;
  if (details.rateLimited) riskScore += 20;
  if (humanScore < 30) riskScore += 15;
  if (details.abuseScore > 50) riskScore += 20;

  let riskLevel: "low" | "medium" | "high" | "critical";
  if (riskScore >= 70) riskLevel = "critical";
  else if (riskScore >= 45) riskLevel = "high";
  else if (riskScore >= 20) riskLevel = "medium";
  else riskLevel = "low";

  // ═══ Decision ═══
  const allowed =
    details.fingerprintValid &&
    (details.signatureValid || riskLevel === "low") &&
    (details.powValid || !sensitiveActions.includes(action)) &&
    !details.rateLimited &&
    riskLevel !== "critical";

  if (!allowed) {
    const error =
      riskLevel === "critical"
        ? "Activité suspecte détectée."
        : details.rateLimited
        ? `Trop de requêtes. Réessayez dans ${Math.ceil((rateResult.retryAfterMs || 30000) / 1000)}s.`
        : "Requête non autorisée.";

    return {
      allowed: false,
      status: details.rateLimited ? 429 : 403,
      error,
      headers: responseHeaders,
      riskLevel,
      details,
    };
  }

  // Add risk header for logging
  responseHeaders["X-OL-Risk"] = riskLevel;

  return {
    allowed: true,
    headers: responseHeaders,
    riskLevel,
    details,
  };
}

/**
 * Generate a comprehensive security report for admin dashboard
 */
export function generateSecurityReport(): Record<string, unknown> {
  const botAnalysis = advancedBotDetection();
  return {
    timestamp: new Date().toISOString(),
    botDetection: botAnalysis,
    activeBuckets: "tracked",
    generatedAt: Date.now(),
  };
}
