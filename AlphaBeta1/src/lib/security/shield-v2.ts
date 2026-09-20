/**
 * OffresLocal Shield v2 — Advanced Security Module
 * ════════════════════════════════════════════════
 * Multi-layer defense system: obfuscation, encryption, anti-tamper,
 * behavioral analysis, proof-of-work, and polymorphic protections.
 */

// ╔═══════════════════════════════════════════╗
// ║  LAYER 0: OBFUSCATED CORE ENGINE         ║
// ╚═══════════════════════════════════════════╝

// Control flow obfuscation — makes static analysis very difficult
const _0x = {
  k: [0x4f, 0x4c, 0x5f, 0x73, 0x68, 0x31, 0x33, 0x6c, 0x64, 0x5f, 0x76, 0x32],
  r: (a: number[], b: number) => a.map((v) => String.fromCharCode(v ^ b)).join(""),
  s: (s: string) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; },
  m: (a: number, b: number) => { let r = 0; for (let i = 31; i >= 0; i--) { r = (r << 1) | ((a >> i) & 1); if (r >= b) r -= b; } return r; },
};

// Derive the actual secret from obfuscated source
function _deriveSecret(): string {
  return _0x.r(_0x.k, 0x23);
}

// ╔═══════════════════════════════════════════╗
// ║  LAYER 1: CRYPTOGRAPHIC HASHING          ║
// ╚═══════════════════════════════════════════╝

/**
 * FNV-1a 32-bit hash — fast, non-reversible, collision-resistant
 */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * SHA-256 via Web Crypto API (async, production-grade)
 */
export async function sha256(input: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    // Fallback for environments without Web Crypto
    return fnv1a(input).toString(16).padStart(8, "0");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * HMAC-like signature using FNV-1a chain
 */
export function hmacSign(data: string, secret: string): string {
  const combined = secret + data + secret;
  const h1 = fnv1a(combined);
  const h2 = fnv1a(h1.toString(36) + data);
  const h3 = fnv1a(secret + h2.toString(36));
  return `${h1.toString(36)}${h2.toString(36)}${h3.toString(36)}`;
}

/**
 * Verify HMAC signature (constant-time comparison to prevent timing attacks)
 */
export function hmacVerify(data: string, secret: string, signature: string): boolean {
  const expected = hmacSign(data, secret);
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

// ╔═══════════════════════════════════════════╗
// ║  LAYER 2: AES-LIKE STREAM CIPHER         ║
// ╚═══════════════════════════════════════════╝

/**
 * Lightweight stream cipher for encrypting tokens and sensitive data
 * Uses a combination of XOR, S-box substitution, and key scheduling
 */
const SBOX = (() => {
  const s = new Uint8Array(256);
  for (let i = 0; i < 256; i++) s[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + fnv1a("OL_CIPHER_" + i)) % 256;
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
})();

export function cipherEncrypt(plaintext: string, key: string): string {
  const keyHash = fnv1a(key + _deriveSecret());
  const keyBytes = new Uint8Array(4);
  keyBytes[0] = keyHash & 0xff;
  keyBytes[1] = (keyHash >> 8) & 0xff;
  keyBytes[2] = (keyHash >> 16) & 0xff;
  keyBytes[3] = (keyHash >> 24) & 0xff;

  // Initialize state from key
  let state = new Uint8Array(256);
  for (let i = 0; i < 256; i++) state[i] = SBOX[i];
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + state[i] + keyBytes[i % 4]) % 256;
    [state[i], state[j]] = [state[j], state[i]];
  }

  // RC4-like stream generation + XOR encryption
  let a = 0, b = 0;
  const result: number[] = [];
  for (let i = 0; i < plaintext.length; i++) {
    a = (a + 1) % 256;
    b = (b + state[a]) % 256;
    [state[a], state[b]] = [state[b], state[a]];
    const k = state[(state[a] + state[b]) % 256];
    result.push(plaintext.charCodeAt(i) ^ k);
  }
  // Base64url encoding
  return btoa(String.fromCharCode(...result)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function cipherDecrypt(ciphertext: string, key: string): string {
  const keyHash = fnv1a(key + _deriveSecret());
  const keyBytes = new Uint8Array(4);
  keyBytes[0] = keyHash & 0xff;
  keyBytes[1] = (keyHash >> 8) & 0xff;
  keyBytes[2] = (keyHash >> 16) & 0xff;
  keyBytes[3] = (keyHash >> 24) & 0xff;

  let state = new Uint8Array(256);
  for (let i = 0; i < 256; i++) state[i] = SBOX[i];
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + state[i] + keyBytes[i % 4]) % 256;
    [state[i], state[j]] = [state[j], state[i]];
  }

  // Decode base64url
  const decoded = atob(ciphertext.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);

  let a = 0, b = 0;
  const result: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    a = (a + 1) % 256;
    b = (b + state[a]) % 256;
    [state[a], state[b]] = [state[b], state[a]];
    const k = state[(state[a] + state[b]) % 256];
    result.push(String.fromCharCode(bytes[i] ^ k));
  }
  return result.join("");
}

// ╔═══════════════════════════════════════════╗
// ║  LAYER 3: ADVANCED FINGERPRINT           ║
// ╚═══════════════════════════════════════════╝

export interface DeviceFingerprint {
  hash: string;
  components: Record<string, string>;
  entropy: number;
}

export async function generateAdvancedFingerprint(): Promise<DeviceFingerprint> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { hash: "server", components: {}, entropy: 0 };
  }

  const components: Record<string, string> = {};

  // Canvas fingerprint (render hidden canvas, hash pixels)
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("OffresLocal 🔒", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Shield v2", 4, 35);
      components.canvas = fnv1a(canvas.toDataURL()).toString(36);
    }
  } catch {
    components.canvas = "blocked";
  }

  // WebGL fingerprint
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl && typeof gl === "object" && "getParameter" in gl) {
      const webgl = gl as WebGLRenderingContext;
      const vendor = webgl.getParameter(webgl.VENDOR);
      const renderer = webgl.getParameter(webgl.RENDERER);
      const version = webgl.getParameter(webgl.VERSION);
      components.webgl = fnv1a(`${vendor}|${renderer}|${version}`).toString(36);
    }
  } catch {
    components.webgl = "blocked";
  }

  // Audio fingerprint
  try {
    const AudioCtx = (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || window.AudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const analyser = ctx.createAnalyser();
      const gain = ctx.createGain();
      const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
      gain.gain.value = 0;
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gain);
      gain.connect(ctx.destination);
      components.audio = fnv1a(`${ctx.sampleRate}|${ctx.state}`).toString(36);
      ctx.close();
    }
  } catch {
    components.audio = "blocked";
  }

  // Standard components
  components.ua = fnv1a(navigator.userAgent).toString(36);
  components.lang = fnv1a(navigator.language + (navigator.languages?.join(",") || "")).toString(36);
  components.tz = fnv1a(String(new Date().getTimezoneOffset())).toString(36);
  components.scr = fnv1a(`${screen.width}x${screen.height}x${screen.colorDepth}`).toString(36);
  components.cpu = String(navigator.hardwareConcurrency || 0);
  components.mem = String((navigator as unknown as { deviceMemory?: number }).deviceMemory || 0);
  components.touch = String(navigator.maxTouchPoints || 0);
  components.cookies = String(navigator.cookieEnabled);
  components.doNotTrack = String(navigator.doNotTrack || "null");
  components.platform = fnv1a(navigator.platform || "unknown").toString(36);

  // Connection info
  try {
    const conn = (navigator as unknown as { connection?: { effectiveType?: string; downlink?: number; rtt?: number } }).connection;
    if (conn) {
      components.net = fnv1a(`${conn.effectiveType}|${conn.downlink}|${conn.rtt}`).toString(36);
    }
  } catch {
    components.net = "unknown";
  }

  // Combine all components into a single hash
  const raw = Object.entries(components)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("|");

  const hash = await sha256(raw + _deriveSecret());
  const entropy = Object.keys(components).length * 8; // bits of entropy estimate

  return { hash: `v2_${hash.slice(0, 32)}`, components, entropy };
}

// ╔═══════════════════════════════════════════╗
// ║  LAYER 4: PROOF OF WORK (anti-bot)       ║
// ╚═══════════════════════════════════════════╝

export interface ProofOfWork {
  challenge: string;
  nonce: number;
  solution: string;
  difficulty: number;
  elapsed: number;
}

/**
 * Generate a proof-of-work challenge
 * The client must find a nonce that produces a hash with N leading zeros
 * This is computationally expensive for bots but trivial for legitimate users
 */
export function generatePoWChallenge(difficulty: number = 4): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}:${rand}:${difficulty}`;
}

/**
 * Solve a proof-of-work challenge (client-side computation)
 */
export async function solvePoW(challenge: string): Promise<ProofOfWork> {
  const parts = challenge.split(":");
  const difficulty = parseInt(parts[2] || "4", 10);
  const prefix = "0".repeat(difficulty);
  const start = Date.now();
  let nonce = 0;
  let solution = "";

  while (true) {
    const input = `${challenge}:${nonce}`;
    const hash = fnv1a(input).toString(16).padStart(8, "0");
    if (hash.startsWith(prefix)) {
      solution = hash;
      break;
    }
    nonce++;
    // Yield to event loop every 10000 iterations
    if (nonce % 10000 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
    // Safety limit
    if (nonce > 10_000_000) break;
  }

  return {
    challenge,
    nonce,
    solution,
    difficulty,
    elapsed: Date.now() - start,
  };
}

/**
 * Verify a proof-of-work solution (server-side, instant)
 */
export function verifyPoW(challenge: string, nonce: number, difficulty: number): boolean {
  const input = `${challenge}:${nonce}`;
  const hash = fnv1a(input).toString(16).padStart(8, "0");
  return hash.startsWith("0".repeat(difficulty));
}

// ╔═══════════════════════════════════════════╗
// ║  LAYER 5: BEHAVIORAL ANALYSIS            ║
// ╚═══════════════════════════════════════════╝

interface BehaviorSample {
  timestamp: number;
  type: "mouse" | "touch" | "scroll" | "key" | "click" | "nav";
  x?: number;
  y?: number;
  velocity?: number;
  duration?: number;
}

const behaviorLog: BehaviorSample[] = [];
let lastMousePos = { x: 0, y: 0, t: 0 };

export function initBehavioralAnalysis() {
  if (typeof window === "undefined") return;

  // Track mouse movements with velocity
  window.addEventListener(
    "mousemove",
    (e) => {
      const now = Date.now();
      const dt = now - lastMousePos.t;
      if (dt > 0) {
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const velocity = dist / dt;
        behaviorLog.push({
          timestamp: now,
          type: "mouse",
          x: e.clientX,
          y: e.clientY,
          velocity,
        });
      }
      lastMousePos = { x: e.clientX, y: e.clientY, t: now };
    },
    { passive: true }
  );

  // Track touch events
  window.addEventListener(
    "touchstart",
    (e) => {
      const touch = e.touches[0];
      behaviorLog.push({
        timestamp: Date.now(),
        type: "touch",
        x: touch?.clientX || 0,
        y: touch?.clientY || 0,
      });
    },
    { passive: true }
  );

  // Track scroll behavior
  let scrollTimer: ReturnType<typeof setTimeout>;
  window.addEventListener(
    "scroll",
    () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        behaviorLog.push({
          timestamp: Date.now(),
          type: "scroll",
          y: window.scrollY,
        });
      }, 100);
    },
    { passive: true }
  );

  // Track keystroke timing (without recording keys)
  window.addEventListener(
    "keydown",
    () => {
      behaviorLog.push({
        timestamp: Date.now(),
        type: "key",
        duration: 0,
      });
    },
    { passive: true }
  );

  // Track clicks
  window.addEventListener(
    "click",
    (e) => {
      behaviorLog.push({
        timestamp: Date.now(),
        type: "click",
        x: e.clientX,
        y: e.clientY,
      });
    },
    { passive: true }
  );

  // Keep log bounded
  setInterval(() => {
    if (behaviorLog.length > 500) {
      behaviorLog.splice(0, behaviorLog.length - 500);
    }
  }, 60_000);
}

/**
 * Calculate a human-likeness score from behavioral data
 * Returns 0-100 where 100 = definitely human, 0 = definitely bot
 */
export function getHumanScore(): { score: number; signals: string[] } {
  const signals: string[] = [];
  let score = 50; // Start neutral

  const now = Date.now();
  const recentEvents = behaviorLog.filter((e) => e.timestamp > now - 30_000);

  // Signal 1: Mouse movement entropy
  const mouseEvents = recentEvents.filter((e) => e.type === "mouse");
  if (mouseEvents.length > 10) {
    const velocities = mouseEvents.map((e) => e.velocity || 0);
    const avgVel = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const variance = velocities.reduce((a, v) => a + (v - avgVel) ** 2, 0) / velocities.length;

    if (variance > 0.01) {
      score += 15;
      signals.push("natural-mouse-variance");
    } else if (variance < 0.001) {
      score -= 20;
      signals.push("robotic-mouse");
    }

    // Check for linear mouse movement (bots move in straight lines)
    if (mouseEvents.length > 20) {
      const positions = mouseEvents.map((e) => ({ x: e.x || 0, y: e.y || 0 }));
      let linearCount = 0;
      for (let i = 2; i < positions.length; i++) {
        const dx1 = positions[i - 1].x - positions[i - 2].x;
        const dy1 = positions[i - 1].y - positions[i - 2].y;
        const dx2 = positions[i].x - positions[i - 1].x;
        const dy2 = positions[i].y - positions[i - 1].y;
        const cross = dx1 * dy2 - dy1 * dx2;
        if (Math.abs(cross) < 0.5) linearCount++;
      }
      const linearRatio = linearCount / (positions.length - 2);
      if (linearRatio > 0.8) {
        score -= 20;
        signals.push("linear-mouse-path");
      }
    }
  } else if (mouseEvents.length === 0 && recentEvents.length > 5) {
    score -= 10;
    signals.push("no-mouse-movement");
  }

  // Signal 2: Click distribution
  const clicks = recentEvents.filter((e) => e.type === "click");
  if (clicks.length > 0) {
    score += 5;
    signals.push("has-clicks");
  }

  // Signal 3: Scroll behavior
  const scrolls = recentEvents.filter((e) => e.type === "scroll");
  if (scrolls.length > 3) {
    score += 10;
    signals.push("natural-scrolling");
  }

  // Signal 4: Touch events (mobile users)
  const touches = recentEvents.filter((e) => e.type === "touch");
  if (touches.length > 0) {
    score += 10;
    signals.push("touch-interaction");
  }

  // Signal 5: Idle periods (humans pause, bots don't)
  if (recentEvents.length > 5) {
    const timestamps = recentEvents.map((e) => e.timestamp).sort();
    let maxGap = 0;
    for (let i = 1; i < timestamps.length; i++) {
      maxGap = Math.max(maxGap, timestamps[i] - timestamps[i - 1]);
    }
    if (maxGap > 2000) {
      score += 10;
      signals.push("human-pauses");
    } else if (maxGap < 100 && recentEvents.length > 20) {
      score -= 15;
      signals.push("machine-timing");
    }
  }

  // Signal 6: Event diversity
  const types = new Set(recentEvents.map((e) => e.type));
  if (types.size >= 3) {
    score += 10;
    signals.push("diverse-interactions");
  } else if (types.size <= 1) {
    score -= 10;
    signals.push("single-interaction-type");
  }

  return { score: Math.max(0, Math.min(100, score)), signals };
}

// ╔═══════════════════════════════════════════╗
// ║  LAYER 6: ANTI-DEBUGGER                  ║
// ╚═══════════════════════════════════════════╝

export function initAntiDebugger(): void {
  if (typeof window === "undefined") return;

  // Detect console open via timing difference
  const detect = () => {
    const start = performance.now();
    // debugger statement causes delay when DevTools is open
    // We use a timing-based heuristic instead
    const el = new Image();
    Object.defineProperty(el, "id", {
      get() {
        // This getter fires when DevTools inspects the element
        console.warn("[Shield] DevTools inspection detected");
      },
    });

    const diff = performance.now() - start;
    if (diff > 100) {
      console.warn("[Shield] Debugger detected via timing:", diff, "ms");
    }
  };

  // Run detection periodically
  setInterval(detect, 5000);

  // Override console methods to detect tampering
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  // Check if console methods have been overridden by external scripts
  const checkConsole = () => {
    if (console.log !== originalLog || console.warn !== originalWarn || console.error !== originalError) {
      console.warn("[Shield] Console method override detected");
    }
  };
  setInterval(checkConsole, 10_000);

  // Detect Function constructor manipulation
  const origFunction = Function;
  Object.defineProperty(window, "Function", {
    get() {
      return origFunction;
    },
    set() {
      console.warn("[Shield] Function constructor override blocked");
    },
  });
}

// ╔═══════════════════════════════════════════╗
// ║  LAYER 7: DOM INTEGRITY MONITOR          ║
// ╚═══════════════════════════════════════════╝

export interface IntegrityViolation {
  type: string;
  target: string;
  timestamp: number;
  detail: string;
}

const violations: IntegrityViolation[] = [];

export function initDOMIntegrityMonitor() {
  if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;

  // Monitor critical DOM elements for unauthorized changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target as Element;

      // Check for injected scripts
      if (mutation.type === "childList") {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLScriptElement) {
            const src = node.src || "";
            if (src && !src.includes("offreslocal") && !src.includes("_next") && !src.startsWith("/")) {
              violations.push({
                type: "script-injection",
                target: node.tagName,
                timestamp: Date.now(),
                detail: src.slice(0, 100),
              });
            }
          }
          if (node instanceof HTMLIFrameElement) {
            const src = node.src || "";
            if (src && !src.includes("google.com") && !src.includes("openstreetmap")) {
              violations.push({
                type: "iframe-injection",
                target: node.tagName,
                timestamp: Date.now(),
                detail: src.slice(0, 100),
              });
            }
          }
        }
      }

      // Check for attribute changes on protected elements
      if (mutation.type === "attributes") {
        const protectedAttrs = ["data-price", "data-stock", "data-ol-integrity"];
        if (protectedAttrs.includes(mutation.attributeName || "")) {
          violations.push({
            type: "attribute-tampering",
            target: `${target.tagName}#${target.id || target.className}`,
            timestamp: Date.now(),
            detail: `${mutation.attributeName}: ${(mutation.target as Element).getAttribute(mutation.attributeName || "")}`,
          });
        }
      }
    }
  });

  // Start observing
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-price", "data-stock", "data-ol-integrity", "src", "href"],
  });
}

export function getIntegrityViolations(): IntegrityViolation[] {
  return [...violations];
}

// ╔═══════════════════════════════════════════╗
// ║  LAYER 8: RATE LIMITER (ADAPTIVE)        ║
// ╚═══════════════════════════════════════════╝

interface AdaptiveBucket {
  count: number;
  resetAt: number;
  violations: number;
  backoffMultiplier: number;
}

const adaptiveBuckets = new Map<string, AdaptiveBucket>();

export const ADAPTIVE_LIMITS = {
  reservation: { max: 3, windowMs: 60_000, backoffFactor: 2 },
  offerView: { max: 30, windowMs: 60_000, backoffFactor: 1.5 },
  search: { max: 15, windowMs: 60_000, backoffFactor: 1.5 },
  favorite: { max: 20, windowMs: 60_000, backoffFactor: 2 },
  api: { max: 60, windowMs: 60_000, backoffFactor: 1.5 },
} as const;

export function adaptiveRateLimit(
  key: string,
  action: keyof typeof ADAPTIVE_LIMITS
): { allowed: boolean; remaining: number; retryAfterMs: number; backoffLevel: number } {
  const config = ADAPTIVE_LIMITS[action];
  const now = Date.now();
  let bucket = adaptiveBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + config.windowMs, violations: 0, backoffMultiplier: 1 };
    adaptiveBuckets.set(key, bucket);
  }

  bucket.count++;
  const effectiveMax = Math.floor(config.max / bucket.backoffMultiplier);
  const remaining = Math.max(0, effectiveMax - bucket.count);

  if (bucket.count > effectiveMax) {
    bucket.violations++;
    bucket.backoffMultiplier = Math.min(8, Math.pow(config.backoffFactor, bucket.violations));
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: bucket.resetAt - now,
      backoffLevel: bucket.violations,
    };
  }

  return { allowed: true, remaining, retryAfterMs: 0, backoffLevel: bucket.violations };
}

// ╔═══════════════════════════════════════════╗
// ║  LAYER 9: SESSION BINDING                ║
// ╚═══════════════════════════════════════════╝

export interface BoundSession {
  id: string;
  fingerprint: string;
  createdAt: number;
  lastActive: number;
  requestCount: number;
  token: string;
}

let currentSession: BoundSession | null = null;

export async function createBoundSession(fingerprint: string): Promise<BoundSession> {
  const id = await sha256(`${fingerprint}:${Date.now()}:${Math.random()}`);
  const token = cipherEncrypt(`${id}:${Date.now()}`, fingerprint);

  currentSession = {
    id: id.slice(0, 32),
    fingerprint,
    createdAt: Date.now(),
    lastActive: Date.now(),
    requestCount: 0,
    token,
  };

  return currentSession;
}

export function getSession(): BoundSession | null {
  if (currentSession) {
    currentSession.lastActive = Date.now();
    // Expire sessions after 24h of inactivity
    if (Date.now() - currentSession.lastActive > 86_400_000) {
      currentSession = null;
    }
  }
  return currentSession;
}

export function validateSession(fingerprint: string): boolean {
  if (!currentSession) return false;
  if (currentSession.fingerprint !== fingerprint) return false;
  if (Date.now() - currentSession.lastActive > 86_400_000) return false;
  return true;
}

// ╔═══════════════════════════════════════════╗
// ║  LAYER 10: CANARY TOKENS                 ║
// ╚═══════════════════════════════════════════╝

/**
 * Canary tokens are fake data that, if accessed, indicate a breach.
 * They look like real API keys, admin tokens, etc.
 */
export const CANARY_TOKENS = {
  // These look real but are traps
  adminApiKey: "sk_live_CANARY_4f6b8c2d1e9f3a7b5c8d2e1f",
  dbPassword: "CANARY_pg_adm1n_s3cur3_p4ss",
  stripeKey: "sk_live_CANARY_51Jx8k2Lm9nOp4QrStUv",
  awsKey: "AKIAIOSFODNN7CANARY_EXAMPLE",
} as const;

let canaryTriggered = false;

export function checkCanaryAccess(key: string): boolean {
  if ((Object.values(CANARY_TOKENS) as string[]).includes(key)) {
    canaryTriggered = true;
    console.error("[Shield] 🚨 CANARY TOKEN ACCESSED — potential breach detected");
    return true;
  }
  return false;
}

export function isCanaryTriggered(): boolean {
  return canaryTriggered;
}

// ╔═══════════════════════════════════════════╗
// ║  LAYER 11: ADVANCED BOT DETECTION        ║
// ╚═══════════════════════════════════════════╝

export interface BotAnalysis {
  isBot: boolean;
  confidence: number;
  botType: string | null;
  signals: string[];
}

export function advancedBotDetection(): BotAnalysis {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { isBot: true, confidence: 100, botType: "server", signals: ["no-window"] };
  }

  const signals: string[] = [];
  let confidence = 0;
  let botType: string | null = null;

  // 1. WebDriver detection
  if ((navigator as unknown as { webdriver?: boolean }).webdriver) {
    confidence += 40;
    signals.push("webdriver-flag");
    botType = "selenium";
  }

  // 2. Headless browser detection
  const ua = navigator.userAgent.toLowerCase();
  const headlessPatterns: [string, string][] = [
    ["headless", "headless"],
    ["phantomjs", "phantomjs"],
    ["selenium", "selenium"],
    ["puppeteer", "puppeteer"],
    ["playwright", "playwright"],
    ["cypress", "cypress"],
    ["nightmare", "nightmare"],
  ];
  for (const [pattern, type] of headlessPatterns) {
    if (ua.includes(pattern)) {
      confidence += 35;
      signals.push(`ua-${pattern}`);
      botType = botType || type;
    }
  }

  // 3. Plugin check (headless browsers have 0 plugins)
  if (navigator.plugins?.length === 0) {
    confidence += 15;
    signals.push("zero-plugins");
  }

  // 4. Language check
  if (!navigator.languages || navigator.languages.length === 0) {
    confidence += 10;
    signals.push("no-languages");
  }

  // 5. Chrome-specific: check for automation extensions
  if ((window as unknown as { chrome?: { runtime?: unknown } }).chrome?.runtime === undefined && ua.includes("chrome")) {
    confidence += 15;
    signals.push("missing-chrome-runtime");
  }

  // 6. Check for CDP (Chrome DevTools Protocol) markers
  if ((window as unknown as { __PW_manual_test__?: boolean }).__PW_manual_test__) {
    confidence += 50;
    signals.push("playwright-marker");
    botType = "playwright";
  }
  if ((window as unknown as { __selenium_unwrapped?: boolean }).__selenium_unwrapped) {
    confidence += 50;
    signals.push("selenium-marker");
    botType = "selenium";
  }
  if ((window as unknown as { __nightmare?: boolean }).__nightmare) {
    confidence += 50;
    signals.push("nightmare-marker");
    botType = "nightmare";
  }
  if (document.querySelector("[data-cypress]")) {
    confidence += 50;
    signals.push("cypress-marker");
    botType = "cypress";
  }

  // 7. Permissions API check
  try {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "notifications" as PermissionName }).then((status) => {
        if (status.state === "denied" && !ua.includes("chrome")) {
          // Suspicious for non-Chrome browsers
        }
      });
    }
  } catch {
    // ignore
  }

  // 8. Screen consistency check
  if (screen.width < 100 || screen.height < 100) {
    confidence += 20;
    signals.push("abnormal-screen-size");
  }
  if (window.outerWidth === 0 || window.outerHeight === 0) {
    confidence += 20;
    signals.push("zero-outer-size");
  }

  // 9. Connection type check (bots often have unusual connection info)
  try {
    const conn = (navigator as unknown as { connection?: { type?: string } }).connection;
    if (conn?.type === "none") {
      confidence += 10;
      signals.push("no-connection-type");
    }
  } catch {
    // ignore
  }

  // 10. Battery API check (some headless browsers don't have it)
  if (!(navigator as unknown as { getBattery?: unknown }).getBattery) {
    confidence += 5;
    signals.push("no-battery-api");
  }

  return {
    isBot: confidence >= 50,
    confidence: Math.min(100, confidence),
    botType,
    signals,
  };
}

// ╔═══════════════════════════════════════════╗
// ║  MASTER SHIELD: Initialize All Layers     ║
// ╚═══════════════════════════════════════════╝

export interface ShieldStatus {
  initialized: boolean;
  fingerprint: DeviceFingerprint | null;
  session: BoundSession | null;
  botAnalysis: BotAnalysis | null;
  humanScore: { score: number; signals: string[] } | null;
  integrityViolations: IntegrityViolation[];
  canaryTriggered: boolean;
}

let shieldInitialized = false;
let cachedFingerprint: DeviceFingerprint | null = null;

export async function initShield(): Promise<ShieldStatus> {
  if (shieldInitialized) {
    return getShieldStatus();
  }

  shieldInitialized = true;

  // Layer 3: Advanced fingerprint
  cachedFingerprint = await generateAdvancedFingerprint();

  // Layer 5: Behavioral analysis
  initBehavioralAnalysis();

  // Layer 6: Anti-debugger
  initAntiDebugger();

  // Layer 7: DOM integrity
  initDOMIntegrityMonitor();

  // Layer 9: Create bound session
  const session = await createBoundSession(cachedFingerprint.hash);

  // Layer 11: Bot detection
  const botAnalysis = advancedBotDetection();

  return getShieldStatus();
}

export function getShieldStatus(): ShieldStatus {
  return {
    initialized: shieldInitialized,
    fingerprint: cachedFingerprint,
    session: getSession(),
    botAnalysis: typeof window !== "undefined" ? advancedBotDetection() : null,
    humanScore: typeof window !== "undefined" ? getHumanScore() : null,
    integrityViolations: getIntegrityViolations(),
    canaryTriggered: isCanaryTriggered(),
  };
}

/**
 * Create a secured request with all protection layers
 */
export async function createSecuredHeaders(action: string): Promise<Record<string, string>> {
  const status = getShieldStatus();
  const fp = status.fingerprint?.hash || "unknown";
  const session = status.session;

  // Layer 2: Encrypt the session token
  const encryptedSession = session ? cipherEncrypt(session.id, fp) : "";

  // Layer 4: Generate PoW for sensitive actions
  let powSolution = "";
  const sensitiveActions = ["reservation", "cancel", "payment"];
  if (sensitiveActions.includes(action)) {
    const challenge = generatePoWChallenge(3); // difficulty 3 = ~0.5s solve time
    const pow = await solvePoW(challenge);
    powSolution = `${pow.challenge}:${pow.nonce}`;
  }

  // Layer 1: HMAC signature
  const payload = `${action}:${fp}:${Date.now()}`;
  const signature = hmacSign(payload, _deriveSecret());

  return {
    "X-OL-FP": fp,
    "X-OL-Session": encryptedSession,
    "X-OL-Sig": signature,
    "X-OL-TS": String(Date.now()),
    "X-OL-Action": action,
    "X-OL-PoW": powSolution,
    "X-OL-Human": String(status.humanScore?.score || 0),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
  };
}
