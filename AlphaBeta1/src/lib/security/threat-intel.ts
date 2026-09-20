/**
 * OffresLocal — Threat Intelligence & Active Defense System
 * ═══════════════════════════════════════════════════════════
 * Layer 12: IP Tracking + Geolocation + Attack Profiling
 * Layer 13: Active Deception (honeypots, fake pages, data poisoning)
 * Layer 14: Attacker Redirect (traps + ban escalation)
 * Layer 15: Real-time Alert System (notifications complètes)
 */

// ╔═══════════════════════════════════════════╗
// ║  THREAT DATABASE                          ║
// ╚═══════════════════════════════════════════╝

export interface ThreatRecord {
  id: string;
  ip: string;
  fingerprint: string;
  timestamp: number;
  geo: GeoLocation;
  device: DeviceInfo;
  attack: AttackProfile;
  severity: "low" | "medium" | "high" | "critical";
  actions: AttackAction[];
  banned: boolean;
  banExpiry?: number;
}

export interface GeoLocation {
  ip: string;
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  asn?: string;
  isProxy?: boolean;
  isVPN?: boolean;
  isTor?: boolean;
  isHosting?: boolean;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screen: string;
  timezone: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  touchPoints: number;
  webGL: string;
  canvas: string;
  plugins: string[];
  connectionType: string;
}

export interface AttackProfile {
  type: AttackType;
  method: string;
  target: string;
  tool: string | null;
  sophistication: "script-kiddie" | "intermediate" | "advanced" | "apt";
}

export type AttackType =
  | "brute-force"
  | "scraping"
  | "injection"
  | "xss"
  | "csrf"
  | "rate-abuse"
  | "bot"
  | "tampering"
  | "credential-stuffing"
  | "session-hijack"
  | "api-abuse"
  | "ddos"
  | "recon"
  | "honeypot-triggered"
  | "unknown";

export interface AttackAction {
  timestamp: number;
  type: string;
  detail: string;
  url?: string;
  payload?: string;
  blocked: boolean;
}

// In-memory threat database (production: use Redis/PostgreSQL)
const threatDB = new Map<string, ThreatRecord>();
const bannedIPs = new Set<string>();
const bannedFingerprints = new Set<string>();

// ╔═══════════════════════════════════════════╗
// ║  IP RESOLUTION & GEOLOCATION              ║
// ╚═══════════════════════════════════════════╝

/**
 * Get client IP from request headers (handles proxies)
 */
export function resolveClientIP(req?: { headers: { get(name: string): string | null } }): string {
  if (!req) {
    // Client-side: use WebRTC or API
    return "client-side";
  }
  const headers = req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") || // Cloudflare
    headers.get("x-client-ip") ||
    headers.get("x-cluster-client-ip") ||
    headers.get("forwarded")?.split(",")[0]?.replace("for=", "") ||
    "unknown"
  );
}

/**
 * Collect comprehensive device info from browser
 */
export function collectDeviceInfo(): DeviceInfo {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      userAgent: "server",
      platform: "server",
      language: "server",
      screen: "0x0",
      timezone: "UTC",
      hardwareConcurrency: 0,
      deviceMemory: 0,
      touchPoints: 0,
      webGL: "none",
      canvas: "none",
      plugins: [],
      connectionType: "unknown",
    };
  }

  let webGL = "none";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl && typeof gl === "object" && "getParameter" in gl) {
      const webglCtx = gl as WebGLRenderingContext;
      const debugInfo = webglCtx.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        webGL = webglCtx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      } else {
        webGL = webglCtx.getParameter(webglCtx.RENDERER);
      }
    }
  } catch {
    webGL = "blocked";
  }

  let canvas = "none";
  try {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 1;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(0, 0, 1, 1);
      canvas = c.toDataURL().slice(22, 42); // Partial hash of canvas output
    }
  } catch {
    canvas = "blocked";
  }

  const conn = (navigator as unknown as { connection?: { effectiveType?: string; type?: string } }).connection;

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform || "unknown",
    language: navigator.language,
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: (navigator as unknown as { deviceMemory?: number }).deviceMemory || 0,
    touchPoints: navigator.maxTouchPoints || 0,
    webGL,
    canvas,
    plugins: Array.from(navigator.plugins || []).map((p) => p.name),
    connectionType: conn?.effectiveType || conn?.type || "unknown",
  };
}

/**
 * Fetch geolocation from IP (uses free ipapi.co with fallback)
 */
export async function geolocateIP(ip: string): Promise<GeoLocation> {
  const base: GeoLocation = { ip };

  if (ip === "unknown" || ip === "client-side" || ip === "127.0.0.1" || ip === "::1") {
    return { ...base, country: "Local", city: "Local" };
  }

  try {
    // Primary: ipapi.co (free, 1000 req/day)
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      return {
        ...base,
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        lat: data.latitude,
        lon: data.longitude,
        timezone: data.timezone,
        isp: data.org,
        org: data.org,
        asn: data.asn,
      };
    }
  } catch {
    // Fallback: ip-api.com
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      return {
        ...base,
        country: data.country,
        countryCode: data.countryCode,
        region: data.regionName,
        city: data.city,
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone,
        isp: data.isp,
        org: data.org,
        asn: data.as,
        isProxy: data.proxy || false,
        isHosting: data.hosting || false,
      };
    }
  } catch {
    // ignore
  }

  return base;
}

/**
 * Detect if IP is from proxy/VPN/Tor/hosting
 */
export async function detectProxyVPN(ip: string): Promise<{ isProxy: boolean; isVPN: boolean; isTor: boolean; isHosting: boolean; confidence: number }> {
  const result = { isProxy: false, isVPN: false, isTor: false, isHosting: false, confidence: 0 };

  // Check against known Tor exit nodes (abbreviated list)
  const torExits = new Set([
    "185.220.101.", "185.220.102.", "185.220.103.",
    "171.25.193.", "199.249.230.", "104.244.76.",
    "104.244.77.", "109.70.100.", "176.10.99.",
  ]);
  for (const prefix of Array.from(torExits)) {
    if (ip.startsWith(prefix)) {
      result.isTor = true;
      result.confidence = 90;
      return result;
    }
  }

  // Check known hosting providers
  const hostingPrefixes = [
    "34.", "35.", "52.", "54.", "104.", "172.", "198.", "199.",
    "13.", "18.", "23.", "44.", "46.", "157.", "162.", "168.",
  ];
  for (const prefix of hostingPrefixes) {
    if (ip.startsWith(prefix)) {
      result.isHosting = true;
      result.confidence = 60;
    }
  }

  // Browser-based proxy detection
  if (typeof window !== "undefined") {
    // WebRTC leak detection for VPNs
    try {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pc.createDataChannel("");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await new Promise<void>((resolve) => {
        pc.onicecandidate = (event) => {
          if (!event.candidate) {
            resolve();
            return;
          }
          const candidate = event.candidate.candidate;
          // If WebRTC reveals a different IP than expected, likely VPN
          if (candidate.includes("typ srflx") || candidate.includes("typ relay")) {
            result.isVPN = true;
            result.confidence = Math.max(result.confidence, 70);
          }
        };
        setTimeout(resolve, 3000);
      });
      pc.close();
    } catch {
      // WebRTC blocked = likely proxy
      result.isProxy = true;
      result.confidence = Math.max(result.confidence, 50);
    }
  }

  return result;
}

// ╔═══════════════════════════════════════════╗
// ║  ATTACK CLASSIFICATION                    ║
// ╚═══════════════════════════════════════════╝

/**
 * Classify the type and sophistication of an attack
 */
export function classifyAttack(actions: AttackAction[], deviceInfo: DeviceInfo): AttackProfile {
  let type: AttackType = "unknown";
  let method = "unknown";
  let target = "";
  let tool: string | null = null;
  let sophistication: AttackProfile["sophistication"] = "script-kiddie";

  // Analyze action patterns
  const actionTypes = actions.map((a) => a.type);
  const typeCounts = new Map<string, number>();
  for (const t of actionTypes) {
    typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
  }

  // Brute force: many failed attempts
  if ((typeCounts.get("rate_limited") || 0) > 5) {
    type = "brute-force";
    method = "rate-limit-exceeded";
    sophistication = "script-kiddie";
  }

  // Scraping: many offer views in short time
  if ((typeCounts.get("offer_view") || 0) > 50) {
    type = "scraping";
    method = "mass-crawl";
    sophistication = "intermediate";
  }

  // Bot detection triggered
  if (typeCounts.has("bot_detected")) {
    type = "bot";
    method = "automation";
    // Check for known tools in user agent
    const ua = deviceInfo.userAgent.toLowerCase();
    if (ua.includes("selenium")) tool = "Selenium";
    else if (ua.includes("puppeteer")) tool = "Puppeteer";
    else if (ua.includes("playwright")) tool = "Playwright";
    else if (ua.includes("cypress")) tool = "Cypress";
    else if (ua.includes("phantom")) tool = "PhantomJS";
    sophistication = tool ? "intermediate" : "script-kiddie";
  }

  // Tampering detected
  if (typeCounts.has("tampering") || typeCounts.has("attribute-tampering")) {
    type = "tampering";
    method = "dom-modification";
    sophistication = "advanced";
  }

  // Honeypot triggered
  if (typeCounts.has("honeypot-triggered") || typeCounts.has("canary-access")) {
    type = "honeypot-triggered";
    method = "deception-triggered";
    sophistication = "intermediate";
  }

  // Injection attempts in payloads
  for (const action of actions) {
    const payload = (action.payload || "").toLowerCase();
    if (payload.includes("select ") || payload.includes("union ") || payload.includes("drop ")) {
      type = "injection";
      method = "sql-injection";
      target = action.url || "";
      sophistication = "advanced";
    }
    if (payload.includes("<script") || payload.includes("javascript:") || payload.includes("onerror=")) {
      type = "xss";
      method = "cross-site-scripting";
      target = action.url || "";
      sophistication = "advanced";
    }
    if (payload.includes("{{") || payload.includes("${") || payload.includes("__proto__")) {
      type = "injection";
      method = "template-injection";
      sophistication = "advanced";
    }
  }

  // DDoS pattern: extremely high frequency
  const timeSpan = actions.length > 1
    ? actions[actions.length - 1].timestamp - actions[0].timestamp
    : 60000;
  const rate = actions.length / (timeSpan / 1000);
  if (rate > 10) {
    type = "ddos";
    method = "flood";
    sophistication = rate > 50 ? "apt" : "intermediate";
  }

  return { type, method, target, tool, sophistication };
}

// ╔═══════════════════════════════════════════╗
// ║  THREAT RECORDING & MANAGEMENT            ║
// ╚═══════════════════════════════════════════╝

let threatIdCounter = 0;

export function recordThreat(
  ip: string,
  fingerprint: string,
  deviceInfo: DeviceInfo,
  geo: GeoLocation,
  action: AttackAction
): ThreatRecord {
  const key = ip !== "unknown" ? ip : fingerprint;
  let record = threatDB.get(key);

  if (!record) {
    threatIdCounter++;
    record = {
      id: `THR-${threatIdCounter.toString(36).toUpperCase()}`,
      ip,
      fingerprint,
      timestamp: Date.now(),
      geo,
      device: deviceInfo,
      attack: { type: "unknown", method: "unknown", target: "", tool: null, sophistication: "script-kiddie" },
      severity: "low",
      actions: [],
      banned: false,
    };
    threatDB.set(key, record);
  }

  record.actions.push(action);
  record.attack = classifyAttack(record.actions, deviceInfo);

  // Calculate severity
  const severityScore = calculateSeverity(record);
  record.severity =
    severityScore >= 80 ? "critical" :
    severityScore >= 50 ? "high" :
    severityScore >= 25 ? "medium" : "low";

  // Auto-ban if critical
  if (record.severity === "critical" && !record.banned) {
    banThreat(record);
  }

  return record;
}

function calculateSeverity(record: ThreatRecord): number {
  let score = 0;

  // Base score from attack type
  const typeScores: Record<AttackType, number> = {
    "ddos": 90,
    "injection": 85,
    "xss": 80,
    "session-hijack": 75,
    "credential-stuffing": 70,
    "tampering": 65,
    "honeypot-triggered": 60,
    "scraping": 40,
    "brute-force": 50,
    "bot": 35,
    "rate-abuse": 30,
    "api-abuse": 35,
    "csrf": 60,
    "recon": 25,
    "unknown": 10,
  };
  score += typeScores[record.attack.type] || 10;

  // Escalate based on action count
  score += Math.min(30, record.actions.length * 2);

  // Escalate for proxy/VPN/Tor
  if (record.geo.isTor) score += 20;
  if (record.geo.isVPN) score += 10;
  if (record.geo.isProxy) score += 10;
  if (record.geo.isHosting) score += 15;

  // Escalate for sophistication
  const sophScores = { "script-kiddie": 0, "intermediate": 10, "advanced": 20, "apt": 30 };
  score += sophScores[record.attack.sophistication];

  return Math.min(100, score);
}

function banThreat(record: ThreatRecord) {
  record.banned = true;
  // Ban duration escalates: 1h, 24h, 7d, 30d, permanent
  const banCount = record.actions.filter((a) => a.type === "banned").length;
  const durations = [3_600_000, 86_400_000, 604_800_000, 2_592_000_000, Infinity];
  const duration = durations[Math.min(banCount, durations.length - 1)];

  if (duration === Infinity) {
    record.banExpiry = undefined; // Permanent ban
  } else {
    record.banExpiry = Date.now() + duration;
  }

  if (record.ip !== "unknown") bannedIPs.add(record.ip);
  if (record.fingerprint !== "unknown") bannedFingerprints.add(record.fingerprint);

  record.actions.push({
    timestamp: Date.now(),
    type: "banned",
    detail: `Banned for ${duration === Infinity ? "ever" : `${duration / 3_600_000}h`}`,
    blocked: true,
  });
}

export function isThreatBanned(ip: string, fingerprint: string): boolean {
  if (bannedIPs.has(ip)) return true;
  if (bannedFingerprints.has(fingerprint)) return true;

  // Check expiry
  const key = ip !== "unknown" ? ip : fingerprint;
  const record = threatDB.get(key);
  if (record?.banned && record.banExpiry && Date.now() > record.banExpiry) {
    record.banned = false;
    bannedIPs.delete(ip);
    bannedFingerprints.delete(fingerprint);
    return false;
  }
  return record?.banned || false;
}

export function getThreatDatabase(): ThreatRecord[] {
  return Array.from(threatDB.values()).sort((a, b) => b.timestamp - a.timestamp);
}

export function getThreatStats() {
  const records = Array.from(threatDB.values());
  return {
    total: records.length,
    banned: records.filter((r) => r.banned).length,
    critical: records.filter((r) => r.severity === "critical").length,
    high: records.filter((r) => r.severity === "high").length,
    medium: records.filter((r) => r.severity === "medium").length,
    low: records.filter((r) => r.severity === "low").length,
    topAttackTypes: Array.from(
      records.reduce((map, r) => {
        map.set(r.attack.type, (map.get(r.attack.type) || 0) + 1);
        return map;
      }, new Map<string, number>())
    ).sort(([, a], [, b]) => b - a).slice(0, 5),
    topCountries: Array.from(
      records.reduce((map, r) => {
        const country = r.geo.country || "Unknown";
        map.set(country, (map.get(country) || 0) + 1);
        return map;
      }, new Map<string, number>())
    ).sort(([, a], [, b]) => b - a).slice(0, 5),
  };
}

// ╔═══════════════════════════════════════════╗
// ║  ALERT SYSTEM                             ║
// ╚═══════════════════════════════════════════╝

export interface SecurityAlert {
  id: string;
  timestamp: number;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  threat: ThreatRecord | null;
  ip: string;
  location: string;
  action: string;
  device: string;
  recommendation: string;
}

const alertLog: SecurityAlert[] = [];
let alertIdCounter = 0;

// Alert callbacks (for real-time notifications)
const alertCallbacks: ((alert: SecurityAlert) => void)[] = [];

export function onSecurityAlert(callback: (alert: SecurityAlert) => void) {
  alertCallbacks.push(callback);
  return () => {
    const idx = alertCallbacks.indexOf(callback);
    if (idx >= 0) alertCallbacks.splice(idx, 1);
  };
}

export function createAlert(threat: ThreatRecord, action: AttackAction): SecurityAlert {
  alertIdCounter++;
  const geo = threat.geo;
  const location = [geo.city, geo.region, geo.country].filter(Boolean).join(", ") || "Inconnu";
  const flags: string[] = [];
  if (geo.isTor) flags.push("🧅 Tor");
  if (geo.isVPN) flags.push("🔒 VPN");
  if (geo.isProxy) flags.push("🌐 Proxy");
  if (geo.isHosting) flags.push("🖥️ Hosting");

  const severityLabels = {
    critical: "🚨 CRITIQUE",
    high: "🔴 ÉLEVÉE",
    medium: "🟡 MOYENNE",
    low: "🟢 BASSE",
  };

  const recommendations: Record<AttackType, string> = {
    "brute-force": "IP bannie automatiquement. Envisager un blocage au niveau firewall.",
    "scraping": "Données protégées par PoW. Surveiller les patterns récurrents.",
    "injection": "Payload bloqué. Vérifier les logs pour d'autres tentatives.",
    "xss": "Script bloqué. Vérifier la sanitization côté serveur.",
    "csrf": "Token invalide. Session potentiellement compromise.",
    "rate-abuse": "Rate limit appliqué. Backoff exponentiel actif.",
    "bot": "Bot détecté et bloqué. Outil: " + (threat.attack.tool || "inconnu"),
    "tampering": "Modification DOM détectée. Session invalidée.",
    "credential-stuffing": "Tentative de bourrage d'identifiants. Compte protégé.",
    "session-hijack": "Session compromise potentielle. Toutes les sessions invalidées.",
    "api-abuse": "Abus API détecté. Clé API potentiellement compromise.",
    "ddos": "Attaque DDoS en cours. Activer protection CDN.",
    "recon": "Reconnaissance détectée. Surveiller pour escalade.",
    "honeypot-triggered": "Piège déclenché. Données complètes de l'attaquant collectées.",
    "unknown": "Comportement suspect. Surveillance renforcée activée.",
  };

  const alert: SecurityAlert = {
    id: `ALT-${alertIdCounter.toString(36).toUpperCase()}`,
    timestamp: Date.now(),
    severity: threat.severity,
    title: `${severityLabels[threat.severity]} — ${threat.attack.type.replace("-", " ").toUpperCase()}`,
    message: [
      `🌍 IP: ${threat.ip}`,
      `📍 Localisation: ${location} ${flags.join(" ")}`,
      `🖥️ Appareil: ${threat.device.platform} | ${threat.device.screen}`,
      `🌐 Navigateur: ${threat.device.userAgent.slice(0, 80)}...`,
      `⚡ Action: ${action.type} — ${action.detail}`,
      action.url ? `🔗 URL: ${action.url}` : "",
      action.payload ? `📦 Payload: ${action.payload.slice(0, 200)}` : "",
      `🔧 Outil détecté: ${threat.attack.tool || "Aucun"}`,
      `📊 Niveau: ${threat.attack.sophistication}`,
      `📈 Score sévérité: ${calculateSeverity(threat)}/100`,
    ].filter(Boolean).join("\n"),
    threat,
    ip: threat.ip,
    location,
    action: `${action.type}: ${action.detail}`,
    device: `${threat.device.platform} | ${threat.device.screen}`,
    recommendation: recommendations[threat.attack.type] || "Surveillance recommandée.",
  };

  alertLog.push(alert);
  // Keep last 1000 alerts
  if (alertLog.length > 1000) alertLog.shift();

  // Fire callbacks
  for (const cb of alertCallbacks) {
    try { cb(alert); } catch { /* ignore */ }
  }

  return alert;
}

export function getAlerts(limit = 50): SecurityAlert[] {
  return alertLog.slice(-limit).reverse();
}

// ╔═══════════════════════════════════════════╗
// ║  ACTIVE DECEPTION (HONEYPOTS + TRAPS)     ║
// ╚═══════════════════════════════════════════╝

/**
 * Generate fake admin panels and APIs that look real but are traps
 */
export const DECEPTION_ENDPOINTS = [
  "/admin",
  "/admin/login",
  "/admin/dashboard",
  "/wp-admin",
  "/wp-login.php",
  "/.env",
  "/.git/config",
  "/phpmyadmin",
  "/api/admin/users",
  "/api/internal/config",
  "/api/debug",
  "/server-status",
  "/.well-known/security.txt",
  "/backup.sql",
  "/database.sql",
  "/config.json",
  "/api/v1/admin/keys",
  "/graphql",
  "/api/swagger.json",
];

/**
 * Fake data to serve to attackers (data poisoning)
 */
export const FAKE_DATA = {
  users: [
    { id: 1, email: "admin@offreslocal.ch", password: "admin123", role: "admin" },
    { id: 2, email: "root@offreslocal.ch", password: "root2024", role: "superadmin" },
  ],
  apiKeys: [
    { key: "sk_live_FAKE_4f6b8c2d1e9f3a7b", scope: "admin" },
    { key: "pk_live_FAKE_9a8b7c6d5e4f3g2h", scope: "read" },
  ],
  dbConfig: {
    host: "db.offreslocal.ch",
    port: 5432,
    database: "offreslocal_prod",
    username: "postgres",
    password: "FAKE_P@ssw0rd_2024!",
  },
  env: `
DB_HOST=db.offreslocal.ch
DB_PORT=5432
DB_NAME=offreslocal_prod
DB_USER=postgres
DB_PASS=FAKE_P@ssw0rd_2024!
REDIS_URL=redis://cache.offreslocal.ch:6379
JWT_SECRET=FAKE_jwt_s3cr3t_k3y_2024_!@#$
STRIPE_SECRET=sk_live_FAKE_51Jx8k2Lm9nOp4QrStUv
AWS_ACCESS_KEY=AKIAIOSFODNN7FAKE_EXAMPLE
AWS_SECRET_KEY=FAKE/wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  `.trim(),
};

/**
 * Check if a URL is a deception endpoint
 */
export function isDeceptionEndpoint(url: string): boolean {
  return DECEPTION_ENDPOINTS.some((ep) => url === ep || url.startsWith(ep + "/"));
}

/**
 * Generate a fake response for deception endpoints
 */
export function generateDeceptionResponse(url: string): { status: number; body: string; headers: Record<string, string> } {
  if (url.includes(".env")) {
    return { status: 200, body: FAKE_DATA.env, headers: { "Content-Type": "text/plain" } };
  }
  if (url.includes("admin") || url.includes("login")) {
    return {
      status: 200,
      body: `<!DOCTYPE html><html><head><title>Admin</title></head><body>
        <form method="POST" action="/admin/login">
          <input name="email" type="email" />
          <input name="password" type="password" />
          <input name="_token" type="hidden" value="csrf_FAKE_${Math.random().toString(36).slice(2)}" />
          <button type="submit">Login</button>
        </form>
      </body></html>`,
      headers: { "Content-Type": "text/html" },
    };
  }
  if (url.includes("users")) {
    return { status: 200, body: JSON.stringify(FAKE_DATA.users), headers: { "Content-Type": "application/json" } };
  }
  if (url.includes("keys") || url.includes("config")) {
    return { status: 200, body: JSON.stringify(FAKE_DATA.apiKeys), headers: { "Content-Type": "application/json" } };
  }
  if (url.includes(".git")) {
    return { status: 200, body: "[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false", headers: { "Content-Type": "text/plain" } };
  }
  if (url.includes(".sql") || url.includes("backup") || url.includes("database")) {
    return { status: 200, body: "-- FAKE DATABASE DUMP\nCREATE TABLE users (id SERIAL, email VARCHAR, password VARCHAR);\nINSERT INTO users VALUES (1, 'admin@offreslocal.ch', '$2b$10$FAKE_HASH');", headers: { "Content-Type": "text/sql" } };
  }
  return { status: 404, body: "Not Found", headers: {} };
}

// ╔═══════════════════════════════════════════╗
// ║  ATTACKER REDIRECT                        ║
// ╚═══════════════════════════════════════════╝

/**
 * Redirect detected attackers to a deception page or a blocking page
 */
export function getAttackerRedirect(threat: ThreatRecord): { type: "block" | "deception" | "captcha" | "slow"; url?: string; message: string } {
  // Critical threats → hard block with legal warning
  if (threat.severity === "critical") {
    return {
      type: "block",
      message: [
        "⛔ ACCÈS INTERDIT",
        "",
        `Votre adresse IP (${threat.ip}) a été enregistrée.`,
        `Localisation: ${threat.geo.city || "Inconnu"}, ${threat.geo.country || "Inconnu"}`,
        `Activité détectée: ${threat.attack.type}`,
        `Timestamp: ${new Date().toISOString()}`,
        "",
        "Toutes les informations ont été transmises à l'administrateur.",
        "Toute tentative supplémentaire sera signalée aux autorités compétentes.",
        "",
        "Si vous pensez qu'il s'agit d'une erreur, contactez: security@offreslocal.ch",
      ].join("\n"),
    };
  }

  // High threats → deception (keep them engaged while collecting data)
  if (threat.severity === "high") {
    return {
      type: "deception",
      url: "/admin/login", // Redirect to honeypot
      message: "Redirecting to deception endpoint for data collection",
    };
  }

  // Medium threats → CAPTCHA challenge
  if (threat.severity === "medium") {
    return {
      type: "captcha",
      message: "Veuillez prouver que vous n'êtes pas un robot.",
    };
  }

  // Low threats → slow response (tarpit)
  return {
    type: "slow",
    message: "Response deliberately slowed (5s delay)",
  };
}

/**
 * Tarpit: respond extremely slowly to waste attacker resources
 */
export async function tarpitResponse(delayMs: number = 5000): Promise<Response> {
  await new Promise((r) => setTimeout(r, delayMs));
  return new Response("Loading...", { status: 200, headers: { "Content-Type": "text/plain" } });
}

// ╔═══════════════════════════════════════════╗
// ║  MASTER SECURITY GATE                     ║
// ╚═══════════════════════════════════════════╝

export interface SecurityGateResult {
  allowed: boolean;
  redirect?: { type: string; url?: string; message: string };
  alert?: SecurityAlert;
  threat?: ThreatRecord;
  headers: Record<string, string>;
}

/**
 * Main security gate — checks ALL layers and takes action
 */
export async function securityGate(
  ip: string,
  fingerprint: string,
  deviceInfo: DeviceInfo,
  action: AttackAction,
  url: string
): Promise<SecurityGateResult> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  // Check if already banned
  if (isThreatBanned(ip, fingerprint)) {
    const record = threatDB.get(ip !== "unknown" ? ip : fingerprint);
    if (record) {
      const redirect = getAttackerRedirect(record);
      return { allowed: false, redirect, threat: record, headers };
    }
  }

  // Check for deception endpoint access
  if (isDeceptionEndpoint(url)) {
    const geo = await geolocateIP(ip);
    const record = recordThreat(ip, fingerprint, deviceInfo, geo, {
      ...action,
      type: "honeypot-triggered",
      detail: `Accessed deception endpoint: ${url}`,
      url,
    });
    const alert = createAlert(record, record.actions[record.actions.length - 1]);
    const deceptionResponse = generateDeceptionResponse(url);
    return {
      allowed: false,
      redirect: { type: "deception", message: "Honeypot triggered" },
      alert,
      threat: record,
      headers: { ...headers, ...deceptionResponse.headers },
    };
  }

  // Geolocate and record
  const geo = await geolocateIP(ip);

  // Check for proxy/VPN/Tor
  const proxyInfo = await detectProxyVPN(ip);
  geo.isProxy = proxyInfo.isProxy;
  geo.isVPN = proxyInfo.isVPN;
  geo.isTor = proxyInfo.isTor;
  geo.isHosting = proxyInfo.isHosting;

  // Record the action
  const record = recordThreat(ip, fingerprint, deviceInfo, geo, action);

  // Create alert if severity is medium or above
  let alert: SecurityAlert | undefined;
  if (record.severity !== "low" || action.blocked) {
    alert = createAlert(record, action);
  }

  // Determine response
  if (!action.blocked && record.severity !== "critical") {
    return { allowed: true, threat: record, alert, headers };
  }

  const redirect = getAttackerRedirect(record);
  return { allowed: false, redirect, alert, threat: record, headers };
}
