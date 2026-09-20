/**
 * OffresLocal Shield — Security Module
 * ════════════════════════════════════════
 *
 * Système de sécurité multi-couches v2 :
 *
 * Layer 0  → Obfuscated Core Engine (code difficile à analyser)
 * Layer 1  → Cryptographic Hashing (FNV-1a, SHA-256, HMAC)
 * Layer 2  → AES-like Stream Cipher (chiffrement des tokens)
 * Layer 3  → Advanced Fingerprint (canvas, WebGL, audio, 15+ signaux)
 * Layer 4  → Proof of Work (calcul côté client, anti-bot)
 * Layer 5  → Behavioral Analysis (mouvements souris, scroll, timing)
 * Layer 6  → Anti-Debugger (détection DevTools, console hooks)
 * Layer 7  → DOM Integrity Monitor (MutationObserver, anti-tampering)
 * Layer 8  → Adaptive Rate Limiter (backoff exponentiel)
 * Layer 9  → Session Binding (session liée au device)
 * Layer 10 → Canary Tokens (données pièges)
 * Layer 11 → Advanced Bot Detection (15+ patterns détectés)
 */

// v2 exports (recommended)
export {
  // Crypto
  fnv1a,
  sha256,
  hmacSign,
  hmacVerify,
  cipherEncrypt,
  cipherDecrypt,
  // Fingerprint
  generateAdvancedFingerprint,
  type DeviceFingerprint,
  // Proof of Work
  generatePoWChallenge,
  solvePoW,
  verifyPoW,
  type ProofOfWork,
  // Behavioral
  initBehavioralAnalysis,
  getHumanScore,
  // Anti-debugger
  initAntiDebugger,
  // DOM Integrity
  initDOMIntegrityMonitor,
  getIntegrityViolations,
  type IntegrityViolation,
  // Rate Limiter
  adaptiveRateLimit,
  ADAPTIVE_LIMITS,
  // Session
  createBoundSession,
  getSession,
  validateSession,
  type BoundSession,
  // Canary
  CANARY_TOKENS,
  checkCanaryAccess,
  isCanaryTriggered,
  // Bot Detection
  advancedBotDetection,
  type BotAnalysis,
  // Master
  initShield,
  getShieldStatus,
  createSecuredHeaders,
  type ShieldStatus,
} from "./shield-v2";

// Server validation
export { validateSecuredRequest, generateSecurityReport } from "./server-v2";

// Threat Intelligence & Active Defense
export {
  // Threat Database
  recordThreat,
  isThreatBanned,
  getThreatDatabase,
  getThreatStats,
  type ThreatRecord,
  type GeoLocation,
  type DeviceInfo,
  type AttackProfile,
  type AttackType,
  type AttackAction,
  // IP & Geolocation
  resolveClientIP,
  geolocateIP,
  detectProxyVPN,
  collectDeviceInfo,
  // Attack Classification
  classifyAttack,
  // Alert System
  createAlert,
  getAlerts,
  onSecurityAlert,
  type SecurityAlert,
  // Deception
  DECEPTION_ENDPOINTS,
  FAKE_DATA,
  isDeceptionEndpoint,
  generateDeceptionResponse,
  // Attacker Redirect
  getAttackerRedirect,
  tarpitResponse,
  // Master Security Gate
  securityGate,
  type SecurityGateResult,
} from "./threat-intel";

// React hook
// (useShieldV2 exported separately to avoid SSR issues)

// Legacy v1 exports (backward compat)
export {
  generateFingerprint,
  generateRequestToken,
  validateRequestToken,
  checkRateLimit,
  detectBot,
  checkIntegrity,
  createHoneypot,
  checkHoneypot,
  logAbuseEvent,
  getAbuseScore,
  isBlocked,
  createShieldHeaders,
  LIMITS,
  type ShieldContext,
} from "./shield";

export { shieldRequest, securityResponseHeaders } from "./middleware";
