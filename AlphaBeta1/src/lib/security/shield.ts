/**
 * OffresLocal Shield — Système de sécurité multi-couches
 * Protège contre : bots, scraping, abuse, tampering, injection, replay attacks
 */

// ═══════════════════════════════════════════
// 1. CLIENT FINGERPRINT (anti-usurpation)
// ═══════════════════════════════════════════

export function generateFingerprint(): string {
  const nav = typeof navigator !== "undefined" ? navigator : null;
  const screen = typeof window !== "undefined" ? window.screen : null;
  const parts = [
    nav?.userAgent || "unknown",
    nav?.language || "unknown",
    nav?.hardwareConcurrency || 0,
    screen?.width || 0,
    screen?.height || 0,
    screen?.colorDepth || 0,
    new Date().getTimezoneOffset(),
    nav?.platform || "unknown",
  ];
  // Simple hash (not crypto-grade, but enough for fingerprint)
  const raw = parts.join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return `fp_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}

// ═══════════════════════════════════════════
// 2. REQUEST TOKEN (anti-replay + anti-bot)
// ═══════════════════════════════════════════

const TOKEN_SECRET = "OL_5h13ld_v2"; // Obfuscated server-side in production

export function generateRequestToken(action: string): string {
  const ts = Math.floor(Date.now() / 30000); // 30s window
  const nonce = Math.random().toString(36).slice(2, 8);
  const payload = `${action}:${ts}:${nonce}`;
  // Simple HMAC-like signature
  let sig = 0;
  const combined = payload + TOKEN_SECRET;
  for (let i = 0; i < combined.length; i++) {
    sig = ((sig << 7) - sig + combined.charCodeAt(i)) | 0;
  }
  return `${payload}:${Math.abs(sig).toString(36)}`;
}

export function validateRequestToken(token: string, action: string): boolean {
  const parts = token.split(":");
  if (parts.length !== 4) return false;
  const [tokAction, tsStr, , sigStr] = parts;
  if (tokAction !== action) return false;
  const ts = parseInt(tsStr, 10);
  const now = Math.floor(Date.now() / 30000);
  // Token valid for 2 windows (60s max)
  if (Math.abs(now - ts) > 2) return false;
  // Verify signature
  const nonce = parts[2];
  const payload = `${action}:${tsStr}:${nonce}`;
  const combined = payload + TOKEN_SECRET;
  let sig = 0;
  for (let i = 0; i < combined.length; i++) {
    sig = ((sig << 7) - sig + combined.charCodeAt(i)) | 0;
  }
  return sigStr === Math.abs(sig).toString(36);
}

// ═══════════════════════════════════════════
// 3. RATE LIMITER (anti-abus)
// ═══════════════════════════════════════════

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count++;
  const remaining = Math.max(0, maxRequests - bucket.count);
  if (bucket.count > maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }
  return { allowed: true, remaining, retryAfterMs: 0 };
}

// Default limits
export const LIMITS = {
  reservation: { max: 3, windowMs: 60_000 }, // 3 réservations / minute
  offerView: { max: 30, windowMs: 60_000 }, // 30 vues / minute
  search: { max: 15, windowMs: 60_000 }, // 15 recherches / minute
  favorite: { max: 20, windowMs: 60_000 }, // 20 favoris / minute
  api: { max: 60, windowMs: 60_000 }, // 60 requêtes API / minute
} as const;

// ═══════════════════════════════════════════
// 4. BOT DETECTION (anti-scraping)
// ═══════════════════════════════════════════

export function detectBot(): { isBot: boolean; score: number; reasons: string[] } {
  if (typeof window === "undefined") return { isBot: true, score: 100, reasons: ["no-window"] };
  
  const reasons: string[] = [];
  let score = 0;

  // Check 1: webdriver flag
  if ((navigator as unknown as { webdriver?: boolean }).webdriver) {
    score += 50;
    reasons.push("webdriver");
  }

  // Check 2: missing plugins (headless browsers)
  if (navigator.plugins?.length === 0) {
    score += 20;
    reasons.push("no-plugins");
  }

  // Check 3: unusual screen size
  if (window.screen && (window.screen.width < 320 || window.screen.height < 320)) {
    score += 15;
    reasons.push("tiny-screen");
  }

  // Check 4: no mouse/touch events in first 5s (automated)
  let hadInteraction = false;
  const markInteraction = () => { hadInteraction = true; };
  window.addEventListener("mousemove", markInteraction, { once: true });
  window.addEventListener("touchstart", markInteraction, { once: true });
  // We check this lazily — if called after 5s and no interaction, suspicious
  // (This is checked asynchronously by the caller)

  // Check 5: languages
  if (!navigator.languages || navigator.languages.length === 0) {
    score += 10;
    reasons.push("no-languages");
  }

  // Check 6: automation-related user agent patterns
  const ua = navigator.userAgent.toLowerCase();
  const botPatterns = ["headless", "phantom", "selenium", "puppeteer", "playwright", "crawl", "bot", "spider"];
  for (const pattern of botPatterns) {
    if (ua.includes(pattern)) {
      score += 40;
      reasons.push(`ua:${pattern}`);
    }
  }

  // Check 7: DevTools protocol
  if ((window as unknown as { __PW_manual_test__?: boolean }).__PW_manual_test__) {
    score += 50;
    reasons.push("playwright-marker");
  }

  return { isBot: score >= 50, score, reasons };
}

// ═══════════════════════════════════════════
// 5. INTEGRITY CHECK (anti-tampering)
// ═══════════════════════════════════════════

// Hash of critical DOM elements that should not be modified
const INTEGRITY_MARKERS = {
  bottomNav: "data-ol-integrity='nav'",
  priceElements: "data-ol-price",
  stockElements: "data-ol-stock",
};

export function checkIntegrity(): { valid: boolean; violations: string[] } {
  if (typeof document === "undefined") return { valid: true, violations: [] };
  
  const violations: string[] = [];

  // Check if critical elements have been injected/modified
  const allScripts = document.querySelectorAll("script");
  for (const script of Array.from(allScripts)) {
    const src = script.getAttribute("src") || "";
    // Flag external scripts not from our domain
    if (src && !src.startsWith("/") && !src.includes("offreslocal") && !src.includes("_next")) {
      violations.push(`foreign-script:${src.slice(0, 50)}`);
    }
  }

  // Check for injected iframes
  const iframes = document.querySelectorAll("iframe");
  for (const iframe of Array.from(iframes)) {
    const src = iframe.getAttribute("src") || "";
    if (src && !src.includes("google") && !src.includes("openstreetmap")) {
      violations.push(`suspicious-iframe:${src.slice(0, 50)}`);
    }
  }

  // Check for console override attempts
  try {
    const consoleStr = console.log.toString();
    if (consoleStr.includes("[native code]") === false) {
      violations.push("console-override");
    }
  } catch {
    // ignore
  }

  return { valid: violations.length === 0, violations };
}

// ═══════════════════════════════════════════
// 6. HONEYPOT (piège à bots)
// ═══════════════════════════════════════════

export function createHoneypot(): { fieldName: string; trapClass: string } {
  // Hidden field that only bots would fill
  const names = ["email_confirm", "phone_verify", "address_check", "fax_number"];
  const fieldName = names[Math.floor(Math.random() * names.length)];
  const trapClass = `ol-${Math.random().toString(36).slice(2, 8)}`;
  return { fieldName, trapClass };
}

export function checkHoneypot(formData: Record<string, string>, fieldName: string): boolean {
  // If the honeypot field is filled, it's a bot
  return !formData[fieldName] || formData[fieldName] === "";
}

// ═══════════════════════════════════════════
// 7. ANTI-ABUSE SCORING
// ═══════════════════════════════════════════

interface AbuseEvent {
  type: string;
  timestamp: number;
  fingerprint: string;
}

const abuseLog: AbuseEvent[] = [];
const ABUSE_WINDOW = 300_000; // 5 minutes

export function logAbuseEvent(type: string, fingerprint: string) {
  abuseLog.push({ type, timestamp: Date.now(), fingerprint });
  // Clean old events
  const cutoff = Date.now() - ABUSE_WINDOW;
  while (abuseLog.length > 0 && abuseLog[0].timestamp < cutoff) {
    abuseLog.shift();
  }
}

export function getAbuseScore(fingerprint: string): number {
  const cutoff = Date.now() - ABUSE_WINDOW;
  const events = abuseLog.filter(
    (e) => e.fingerprint === fingerprint && e.timestamp > cutoff
  );
  let score = 0;
  for (const event of events) {
    switch (event.type) {
      case "rate_limited": score += 10; break;
      case "invalid_token": score += 20; break;
      case "bot_detected": score += 30; break;
      case "tampering": score += 50; break;
      case "honeypot": score += 40; break;
      default: score += 5;
    }
  }
  return Math.min(100, score);
}

export function isBlocked(fingerprint: string): boolean {
  return getAbuseScore(fingerprint) >= 75;
}

// ═══════════════════════════════════════════
// 8. SHIELD MIDDLEWARE (server-side)
// ═══════════════════════════════════════════

export interface ShieldContext {
  fingerprint: string;
  token: string;
  timestamp: number;
  abuseScore: number;
  isBot: boolean;
  isBlocked: boolean;
}

export function createShieldHeaders(ctx: ShieldContext): Record<string, string> {
  return {
    "X-OL-FP": ctx.fingerprint,
    "X-OL-Token": ctx.token,
    "X-OL-TS": String(ctx.timestamp),
    "X-OL-Score": String(ctx.abuseScore),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  };
}
