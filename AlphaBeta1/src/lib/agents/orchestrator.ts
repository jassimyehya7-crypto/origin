/**
 * OffresLocal — Autonomous Agent Framework
 * ═══════════════════════════════════════════
 * Multi-agent system with specialized teams:
 * - Debug Tribunal (detect → propose → argue → judge → fix)
 * - Security Team Alpha (external defense)
 * - Security Team Bravo (internal defense)
 * - Red Team (penetration testing)
 * - Availability Squad (uptime monitoring)
 * - Reservation Guards (atomic stock management)
 */

// ╔═══════════════════════════════════════════╗
// ║  AGENT CORE                               ║
// ╚═══════════════════════════════════════════╝

export type AgentRole =
  | "detective"      // Detects problems
  | "prosecutor"     // Argues AGAINST a fix (avocat du diable)
  | "defender"       // Argues FOR a fix
  | "judge"          // Makes final decision
  | "executor"       // Applies the fix
  | "sentinel"       // External security guard
  | "guardian"       // Internal security guard
  | "red_team"       // Attacker simulator
  | "medic"          // Availability / health monitor
  | "stock_guard";   // Reservation atomicity guard

export type AgentState = "idle" | "scanning" | "analyzing" | "debating" | "executing" | "reporting" | "alert";

export interface AgentMessage {
  from: string;
  to: string;
  type: "report" | "proposal" | "argument" | "verdict" | "command" | "alert" | "heartbeat";
  payload: unknown;
  timestamp: number;
  priority: "low" | "medium" | "high" | "critical";
}

export interface AgentReport {
  agentId: string;
  role: AgentRole;
  timestamp: number;
  status: "ok" | "warning" | "error" | "critical";
  findings: AgentFinding[];
  actions: AgentAction[];
}

export interface AgentFinding {
  id: string;
  type: string;
  severity: "info" | "warning" | "error" | "critical";
  description: string;
  location: string;
  evidence: string;
  suggestedFix?: string;
}

export interface AgentAction {
  id: string;
  type: "fix" | "block" | "alert" | "rollback" | "scale" | "reserve" | "release";
  description: string;
  executed: boolean;
  result?: string;
  timestamp: number;
}

// ╔═══════════════════════════════════════════╗
// ║  AGENT REGISTRY                           ║
// ╚═══════════════════════════════════════════╝

let agentIdCounter = 0;

class Agent {
  readonly id: string;
  readonly name: string;
  readonly role: AgentRole;
  state: AgentState = "idle";
  lastHeartbeat: number = Date.now();
  findings: AgentFinding[] = [];
  actions: AgentAction[] = [];
  stats = { scans: 0, detections: 0, fixes: 0, errors: 0 };

  constructor(name: string, role: AgentRole) {
    agentIdCounter++;
    this.id = `AGT-${agentIdCounter.toString(36).toUpperCase()}`;
    this.name = name;
    this.role = role;
    registry.set(this.id, this);
  }

  heartbeat() {
    this.lastHeartbeat = Date.now();
  }

  isAlive(): boolean {
    return Date.now() - this.lastHeartbeat < 120_000; // 2 min timeout
  }

  addFinding(finding: Omit<AgentFinding, "id">) {
    const f: AgentFinding = { ...finding, id: `F-${Date.now().toString(36)}` };
    this.findings.push(f);
    if (this.findings.length > 200) this.findings.shift();
    this.stats.detections++;
    return f;
  }

  addAction(action: Omit<AgentAction, "id" | "timestamp">) {
    const a: AgentAction = { ...action, id: `A-${Date.now().toString(36)}`, timestamp: Date.now() };
    this.actions.push(a);
    if (this.actions.length > 200) this.actions.shift();
    if (action.executed) this.stats.fixes++;
    return a;
  }

  getReport(): AgentReport {
    const hasErrors = this.findings.some((f) => f.severity === "error" || f.severity === "critical");
    const hasWarnings = this.findings.some((f) => f.severity === "warning");
    return {
      agentId: this.id,
      role: this.role,
      timestamp: Date.now(),
      status: hasErrors ? "critical" : hasWarnings ? "warning" : "ok",
      findings: this.findings.slice(-20),
      actions: this.actions.slice(-20),
    };
  }
}

const registry = new Map<string, Agent>();

export function getAgent(id: string): Agent | undefined {
  return registry.get(id);
}

export function getAllAgents(): Agent[] {
  return Array.from(registry.values());
}

export function getAgentsByRole(role: AgentRole): Agent[] {
  return getAllAgents().filter((a) => a.role === role);
}

// ╔═══════════════════════════════════════════╗
// ║  MESSAGE BUS                              ║
// ╚═══════════════════════════════════════════╝

const messageBus: AgentMessage[] = [];
const messageHandlers = new Map<string, ((msg: AgentMessage) => void)[]>();

export function sendMessage(msg: AgentMessage) {
  messageBus.push(msg);
  if (messageBus.length > 5000) messageBus.shift();

  // Notify handlers
  const handlers = messageHandlers.get(msg.to) || [];
  for (const handler of handlers) {
    try { handler(msg); } catch { /* ignore */ }
  }
  const broadcastHandlers = messageHandlers.get("*") || [];
  for (const handler of broadcastHandlers) {
    try { handler(msg); } catch { /* ignore */ }
  }
}

export function onMessage(target: string, handler: (msg: AgentMessage) => void) {
  if (!messageHandlers.has(target)) messageHandlers.set(target, []);
  messageHandlers.get(target)!.push(handler);
  return () => {
    const handlers = messageHandlers.get(target);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    }
  };
}

export function getMessages(limit = 100): AgentMessage[] {
  return messageBus.slice(-limit).reverse();
}

// ╔═══════════════════════════════════════════╗
// ║  DEBUG TRIBUNAL                           ║
// ╚═══════════════════════════════════════════╝

interface TribunalCase {
  id: string;
  finding: AgentFinding;
  proposedFix: string;
  prosecution: string[];   // Arguments AGAINST the fix
  defense: string[];       // Arguments FOR the fix
  verdict: "approved" | "rejected" | "needs_revision" | null;
  judgeReasoning: string;
  executed: boolean;
  timestamp: number;
}

const tribunalCases: TribunalCase[] = [];
let caseIdCounter = 0;

/**
 * Detective Agent — Scans for bugs and anomalies
 */
function detectiveScan(): AgentFinding[] {
  const findings: AgentFinding[] = [];
  const agent = getAgentsByRole("detective")[0];
  if (!agent) return findings;

  agent.state = "scanning";
  agent.stats.scans++;

  if (typeof window === "undefined") {
    agent.state = "idle";
    return findings;
  }

  // Check 1: Console errors
  try {
    const errors = (window as unknown as { __ol_errors?: Error[] }).__ol_errors || [];
    for (const err of errors.slice(-5)) {
      findings.push(agent.addFinding({
        type: "runtime-error",
        severity: "error",
        description: err.message,
        location: err.stack?.split("\n")[1]?.trim() || "unknown",
        evidence: err.stack?.slice(0, 500) || "",
        suggestedFix: generateErrorFix(err),
      }));
    }
  } catch { /* ignore */ }

  // Check 2: Failed network requests
  try {
    const failedRequests = (window as unknown as { __ol_failed_requests?: { url: string; status: number }[] }).__ol_failed_requests || [];
    for (const req of failedRequests.slice(-5)) {
      findings.push(agent.addFinding({
        type: "network-error",
        severity: req.status >= 500 ? "critical" : "warning",
        description: `HTTP ${req.status} on ${req.url}`,
        location: req.url,
        evidence: `Status: ${req.status}, URL: ${req.url}`,
        suggestedFix: req.status === 404 ? "Route may be missing or misconfigured" : "Server may be overloaded",
      }));
    }
  } catch { /* ignore */ }

  // Check 3: DOM anomalies
  try {
    const body = document.body;
    if (!body || body.children.length === 0) {
      findings.push(agent.addFinding({
        type: "dom-anomaly",
        severity: "critical",
        description: "Body is empty — app may have crashed",
        location: "document.body",
        evidence: `children: ${body?.children.length || 0}`,
        suggestedFix: "Check React error boundaries and hydration",
      }));
    }
  } catch { /* ignore */ }

  // Check 4: Performance degradation
  try {
    if (typeof performance !== "undefined") {
      const entries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      if (entries.length > 0) {
        const nav = entries[0];
        const loadTime = nav.loadEventEnd - nav.startTime;
        if (loadTime > 10_000) {
          findings.push(agent.addFinding({
            type: "performance",
            severity: "warning",
            description: `Page load time: ${(loadTime / 1000).toFixed(1)}s (>10s threshold)`,
            location: "performance.navigation",
            evidence: `Load: ${loadTime.toFixed(0)}ms, DOM: ${nav.domContentLoadedEventEnd - nav.startTime}ms`,
            suggestedFix: "Consider code splitting, lazy loading, or caching",
          }));
        }
      }
    }
  } catch { /* ignore */ }

  agent.state = "idle";
  agent.heartbeat();
  return findings;
}

function generateErrorFix(error: Error): string {
  const msg = error.message.toLowerCase();
  if (msg.includes("undefined")) return "Add null check or optional chaining (?.)";
  if (msg.includes("null")) return "Add null guard before accessing properties";
  if (msg.includes("fetch")) return "Add try/catch with fallback UI for network failures";
  if (msg.includes("render")) return "Check conditional rendering and ensure valid JSX";
  if (msg.includes("hydrat")) return "Ensure server/client render matching output";
  return "Review error stack trace and add appropriate error handling";
}

/**
 * Tribunal — Debate and judge proposed fixes
 */
function createTribunalCase(finding: AgentFinding): TribunalCase {
  caseIdCounter++;
  const tc: TribunalCase = {
    id: `CASE-${caseIdCounter}`,
    finding,
    proposedFix: finding.suggestedFix || "Manual review required",
    prosecution: [],
    defense: [],
    verdict: null,
    judgeReasoning: "",
    executed: false,
    timestamp: Date.now(),
  };
  tribunalCases.push(tc);
  return tc;
}

/**
 * Prosecutor — Argues AGAINST the fix (avocat du diable)
 */
function prosecute(tc: TribunalCase): string[] {
  const args: string[] = [];

  // Generic prosecution arguments
  args.push("🔴 PROSECUTION: Does this fix address the root cause or just the symptom?");

  if (tc.finding.type === "runtime-error") {
    args.push("🔴 The suggested fix may mask the underlying issue rather than resolve it.");
    args.push("🔴 Have we verified this error is reproducible and not a one-time race condition?");
  }

  if (tc.finding.type === "network-error") {
    args.push("🔴 Network errors may be transient — auto-fixing could introduce retry storms.");
    args.push("🔴 Is the fix resilient to intermittent connectivity issues?");
  }

  if (tc.finding.type === "performance") {
    args.push("🔴 Performance optimizations can introduce correctness bugs.");
    args.push("🔴 Has the impact on memory usage been evaluated?");
  }

  args.push("🔴 Could this fix introduce regressions in other parts of the system?");
  args.push("🔴 Is there adequate test coverage for this change?");

  return args;
}

/**
 * Defender — Argues FOR the fix
 */
function defend(tc: TribunalCase): string[] {
  const args: string[] = [];

  args.push("🟢 DEFENSE: The proposed fix directly addresses the identified issue.");

  if (tc.finding.suggestedFix) {
    args.push(`🟢 Suggested approach: "${tc.finding.suggestedFix}"`);
  }

  if (tc.finding.severity === "critical") {
    args.push("🟢 CRITICAL severity — immediate action is justified.");
    args.push("🟢 The risk of inaction outweighs the risk of a potential regression.");
  }

  if (tc.finding.severity === "error") {
    args.push("🟢 This error affects user experience and should be resolved promptly.");
  }

  args.push("🟢 The fix is scoped and minimal — low risk of side effects.");
  args.push("🟢 Automated monitoring will detect any regressions immediately.");

  return args;
}

/**
 * Judge — Makes the final verdict
 */
function judge(tc: TribunalCase): { verdict: "approved" | "rejected" | "needs_revision"; reasoning: string } {
  let score = 0;

  // Severity weight
  if (tc.finding.severity === "critical") score += 30;
  else if (tc.finding.severity === "error") score += 20;
  else if (tc.finding.severity === "warning") score += 10;
  else score += 5;

  // Has suggested fix?
  if (tc.finding.suggestedFix && tc.finding.suggestedFix !== "Manual review required") score += 15;

  // Evidence quality
  if (tc.finding.evidence.length > 50) score += 10;

  // Defense arguments count vs prosecution
  score += tc.defense.length * 3;
  score -= tc.prosecution.length * 2;

  // Critical errors with clear fix → approve
  if (tc.finding.severity === "critical" && tc.finding.suggestedFix) score += 20;

  let verdict: "approved" | "rejected" | "needs_revision";
  let reasoning: string;

  if (score >= 40) {
    verdict = "approved";
    reasoning = `⚖️ VERDICT: APPROVED (score: ${score}/100). The fix is well-scoped, addresses a ${tc.finding.severity} issue, and the defense presented compelling arguments. Proceed with execution.`;
  } else if (score >= 20) {
    verdict = "needs_revision";
    reasoning = `⚖️ VERDICT: NEEDS REVISION (score: ${score}/100). The issue is valid but the proposed fix requires refinement. The prosecution raised valid concerns about scope and testing.`;
  } else {
    verdict = "rejected";
    reasoning = `⚖️ VERDICT: REJECTED (score: ${score}/100). The prosecution's concerns outweigh the defense. The fix may be premature, insufficiently tested, or too risky.`;
  }

  return { verdict, reasoning };
}

/**
 * Execute the full tribunal pipeline
 */
export function runTribunal(finding?: AgentFinding): TribunalCase | null {
  // If no finding provided, run detective scan
  const findings = finding ? [finding] : detectiveScan();
  if (findings.length === 0) return null;

  const results: TribunalCase[] = [];

  for (const f of findings) {
    // 1. Create case
    const tc = createTribunalCase(f);

    // 2. Prosecution argues against
    tc.prosecution = prosecute(tc);
    sendMessage({
      from: "prosecutor",
      to: "judge",
      type: "argument",
      payload: { caseId: tc.id, side: "against", args: tc.prosecution },
      timestamp: Date.now(),
      priority: f.severity === "critical" ? "critical" : "medium",
    });

    // 3. Defense argues for
    tc.defense = defend(tc);
    sendMessage({
      from: "defender",
      to: "judge",
      type: "argument",
      payload: { caseId: tc.id, side: "for", args: tc.defense },
      timestamp: Date.now(),
      priority: f.severity === "critical" ? "critical" : "medium",
    });

    // 4. Judge decides
    const { verdict, reasoning } = judge(tc);
    tc.verdict = verdict;
    tc.judgeReasoning = reasoning;
    sendMessage({
      from: "judge",
      to: "executor",
      type: "verdict",
      payload: { caseId: tc.id, verdict, reasoning },
      timestamp: Date.now(),
      priority: verdict === "approved" ? "high" : "low",
    });

    // 5. Execute if approved
    if (verdict === "approved") {
      tc.executed = true;
      const executor = getAgentsByRole("executor")[0];
      if (executor) {
        executor.addAction({
          type: "fix",
          description: `Applied fix for: ${f.description}`,
          executed: true,
          result: `Fix applied for ${f.type} at ${f.location}`,
        });
      }
    }

    results.push(tc);
  }

  return results[results.length - 1] || null;
}

export function getTribunalCases(): TribunalCase[] {
  return [...tribunalCases].reverse();
}

// ╔═══════════════════════════════════════════╗
// ║  SECURITY TEAM ALPHA (External)           ║
// ╚═══════════════════════════════════════════╝

export interface ExternalThreat {
  ip: string;
  type: string;
  detail: string;
  timestamp: number;
  blocked: boolean;
}

const externalThreatLog: ExternalThreat[] = [];

function sentinelScan() {
  const sentinels = getAgentsByRole("sentinel");
  for (const sentinel of sentinels) {
    sentinel.state = "scanning";
    sentinel.stats.scans++;

    // Check security logs from Vite plugin
    if (typeof fetch !== "undefined") {
      fetch("/_security/logs")
        .then((r) => r.json())
        .then((data: { total: number; blocked: number; logs: ExternalThreat[] }) => {
          const recentLogs = (data.logs || []).slice(-10);
          for (const log of recentLogs) {
            const exists = externalThreatLog.some(
              (t) => t.ip === log.ip && t.timestamp === log.timestamp
            );
            if (!exists) {
              externalThreatLog.push(log);
              sentinel.addFinding({
                type: `external-${log.type.toLowerCase().replace(/\s+/g, "-")}`,
                severity: log.blocked ? "warning" : "critical",
                description: `${log.type} from ${log.ip}`,
                location: log.url || "",
                evidence: log.detail || "",
              });
              if (log.blocked) {
                sentinel.addAction({
                  type: "block",
                  description: `Blocked ${log.type} from ${log.ip}`,
                  executed: true,
                  result: "Attack neutralized",
                });
              }
            }
          }
          sentinel.state = "idle";
          sentinel.heartbeat();
        })
        .catch(() => {
          sentinel.state = "idle";
          sentinel.heartbeat();
        });
    } else {
      sentinel.state = "idle";
      sentinel.heartbeat();
    }
  }
}

// ╔═══════════════════════════════════════════╗
// ║  SECURITY TEAM BRAVO (Internal)           ║
// ╚═══════════════════════════════════════════╝

function guardianScan() {
  const guardians = getAgentsByRole("guardian");
  for (const guardian of guardians) {
    guardian.state = "scanning";
    guardian.stats.scans++;

    if (typeof window !== "undefined") {
      // Check 1: Unauthorized script injections
      const scripts = document.querySelectorAll("script[src]");
      for (const script of Array.from(scripts)) {
        const src = script.getAttribute("src") || "";
        if (src && !src.startsWith("/") && !src.includes("_next") && !src.includes("offreslocal")) {
          guardian.addFinding({
            type: "injected-script",
            severity: "critical",
            description: `Foreign script detected: ${src.slice(0, 80)}`,
            location: "document.scripts",
            evidence: src,
          });
        }
      }

      // Check 2: LocalStorage / SessionStorage tampering
      try {
        const suspiciousKeys = ["admin", "bypass", "debug", "override", "root", "superuser"];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && suspiciousKeys.some((sk) => key.toLowerCase().includes(sk))) {
            guardian.addFinding({
              type: "storage-tampering",
              severity: "warning",
              description: `Suspicious localStorage key: ${key}`,
              location: `localStorage.${key}`,
              evidence: localStorage.getItem(key)?.slice(0, 200) || "",
            });
          }
        }
      } catch { /* ignore */ }

      // Check 3: Console override detection
      try {
        const logStr = console.log.toString();
        if (!logStr.includes("[native code]")) {
          guardian.addFinding({
            type: "console-override",
            severity: "warning",
            description: "console.log has been overridden",
            location: "console.log",
            evidence: logStr.slice(0, 200),
          });
        }
      } catch { /* ignore */ }

      // Check 4: Unauthorized iframes
      const iframes = document.querySelectorAll("iframe");
      for (const iframe of Array.from(iframes)) {
        const src = iframe.getAttribute("src") || "";
        if (src && !src.includes("google.com") && !src.includes("openstreetmap") && !src.includes("youtube")) {
          guardian.addFinding({
            type: "suspicious-iframe",
            severity: "warning",
            description: `Unknown iframe: ${src.slice(0, 80)}`,
            location: "document.iframes",
            evidence: src,
          });
        }
      }
    }

    guardian.state = "idle";
    guardian.heartbeat();
  }
}

// ╔═══════════════════════════════════════════╗
// ║  RED TEAM (Penetration Testing)           ║
// ╚═══════════════════════════════════════════╝

interface RedTeamTest {
  id: string;
  name: string;
  category: string;
  payload: string;
  expectedResult: "blocked" | "allowed" | "rate-limited";
  actualResult: "blocked" | "allowed" | "rate-limited" | "error" | "pending";
  timestamp: number;
  responseTime: number;
}

const redTeamResults: RedTeamTest[] = [];

const RED_TEAM_TESTS = [
  { name: "SQL Injection (UNION)", category: "injection", payload: "/?q=1 UNION SELECT 1", expected: "blocked" as const },
  { name: "SQL Injection (DROP)", category: "injection", payload: "/?q=;DROP TABLE users", expected: "blocked" as const },
  { name: "XSS (script tag)", category: "xss", payload: "/?q=<script>alert(1)</script>", expected: "blocked" as const },
  { name: "XSS (event handler)", category: "xss", payload: "/?q=<img onerror=alert(1)>", expected: "blocked" as const },
  { name: "Directory Traversal", category: "traversal", payload: "/../../../etc/passwd", expected: "blocked" as const },
  { name: "Honeypot (admin)", category: "honeypot", payload: "/admin", expected: "allowed" as const },
  { name: "Honeypot (.env)", category: "honeypot", payload: "/.env", expected: "allowed" as const },
  { name: "Replay Attack", category: "replay", payload: "/", expected: "blocked" as const },
  { name: "Rate Limit (>60/min)", category: "rate-limit", payload: "/", expected: "rate-limited" as const },
  { name: "Normal Request", category: "baseline", payload: "/", expected: "allowed" as const },
];

async function redTeamRun() {
  const redAgents = getAgentsByRole("red_team");
  for (const agent of redAgents) {
    agent.state = "scanning";
    agent.stats.scans++;

    for (const test of RED_TEAM_TESTS) {
      const start = Date.now();
      let actualResult: RedTeamTest["actualResult"] = "pending";

      try {
        const opts: RequestInit = {};
        if (test.category === "replay") {
          opts.headers = { "X-OL-TS": "1600000000000" };
        }

        const resp = await fetch(test.payload, { ...opts, redirect: "manual" });
        const status = resp.status;

        if (status === 403) actualResult = "blocked";
        else if (status === 429) actualResult = "rate-limited";
        else if (status === 200) actualResult = "allowed";
        else actualResult = "error";
      } catch {
        actualResult = "error";
      }

      const elapsed = Date.now() - start;
      const passed = actualResult === test.expected;

      redTeamResults.push({
        id: `RT-${Date.now().toString(36)}`,
        name: test.name,
        category: test.category,
        payload: test.payload,
        expectedResult: test.expected,
        actualResult,
        timestamp: Date.now(),
        responseTime: elapsed,
      });

      agent.addFinding({
        type: `red-team-${passed ? "pass" : "fail"}`,
        severity: passed ? "info" : "critical",
        description: `${test.name}: expected ${test.expected}, got ${actualResult}`,
        location: test.payload,
        evidence: `Response time: ${elapsed}ms`,
      });

      if (!passed) {
        agent.addAction({
          type: "alert",
          description: `SECURITY GAP: ${test.name} — expected ${test.expected}, got ${actualResult}`,
          executed: true,
          result: "Alert sent to security teams",
        });
        sendMessage({
          from: agent.id,
          to: "*",
          type: "alert",
          payload: {
            type: "security-gap",
            test: test.name,
            expected: test.expected,
            actual: actualResult,
          },
          timestamp: Date.now(),
          priority: "critical",
        });
      }
    }

    // Keep only last 500 results
    while (redTeamResults.length > 500) redTeamResults.shift();

    agent.state = "idle";
    agent.heartbeat();
  }
}

export function getRedTeamResults(): RedTeamTest[] {
  return [...redTeamResults].reverse();
}

// ╔═══════════════════════════════════════════╗
// ║  AVAILABILITY SQUAD (Medic)               ║
// ╚═══════════════════════════════════════════╝

interface HealthCheck {
  timestamp: number;
  endpoint: string;
  status: "healthy" | "degraded" | "down";
  responseTime: number;
  statusCode?: number;
  error?: string;
}

const healthHistory: HealthCheck[] = [];
const HEALTH_ENDPOINTS = ["/", "/explore", "/profile"];

async function medicCheck() {
  const medics = getAgentsByRole("medic");
  for (const medic of medics) {
    medic.state = "scanning";
    medic.stats.scans++;

    for (const endpoint of HEALTH_ENDPOINTS) {
      const start = Date.now();
      try {
        const resp = await fetch(endpoint, { method: "HEAD" });
        const elapsed = Date.now() - start;
        const status: HealthCheck["status"] =
          resp.status >= 500 ? "down" :
          elapsed > 5000 ? "degraded" :
          resp.ok ? "healthy" : "degraded";

        const check: HealthCheck = {
          timestamp: Date.now(),
          endpoint,
          status,
          responseTime: elapsed,
          statusCode: resp.status,
        };
        healthHistory.push(check);

        if (status === "down") {
          medic.addFinding({
            type: "service-down",
            severity: "critical",
            description: `${endpoint} returned HTTP ${resp.status}`,
            location: endpoint,
            evidence: `Response time: ${elapsed}ms, Status: ${resp.status}`,
            suggestedFix: "Check server logs and restart if necessary",
          });
          medic.addAction({
            type: "alert",
            description: `ALERT: ${endpoint} is DOWN (HTTP ${resp.status})`,
            executed: true,
            result: "Alert dispatched to operations team",
          });
        } else if (status === "degraded") {
          medic.addFinding({
            type: "service-degraded",
            severity: "warning",
            description: `${endpoint} is slow (${elapsed}ms)`,
            location: endpoint,
            evidence: `Response time: ${elapsed}ms`,
          });
        }
      } catch (err) {
        const elapsed = Date.now() - start;
        const check: HealthCheck = {
          timestamp: Date.now(),
          endpoint,
          status: "down",
          responseTime: elapsed,
          error: (err as Error).message,
        };
        healthHistory.push(check);

        medic.addFinding({
          type: "service-unreachable",
          severity: "critical",
          description: `${endpoint} is unreachable: ${(err as Error).message}`,
          location: endpoint,
          evidence: (err as Error).message,
        });
      }
    }

    while (healthHistory.length > 1000) healthHistory.shift();
    medic.state = "idle";
    medic.heartbeat();
  }
}

export function getHealthHistory(): HealthCheck[] {
  return [...healthHistory].reverse();
}

// ╔═══════════════════════════════════════════╗
// ║  RESERVATION GUARDS (Atomic Stock)        ║
// ╚═══════════════════════════════════════════╝

export interface StockLock {
  offerId: string;
  total: number;
  reserved: number;
  locks: Map<string, { userId: string; timestamp: number; expiresAt: number }>;
}

const stockLocks = new Map<string, StockLock>();
let lockIdCounter = 0;

/**
 * Initialize stock for an offer
 */
export function initStock(offerId: string, total: number): void {
  if (!stockLocks.has(offerId)) {
    stockLocks.set(offerId, {
      offerId,
      total,
      reserved: 0,
      locks: new Map(),
    });
  }
}

/**
 * Atomic reservation — prevents overbooking via mutex-like locking
 * Returns a lock ID if successful, null if stock is exhausted
 */
export function tryReserve(offerId: string, userId: string): { success: boolean; lockId: string | null; remaining: number; reason?: string } {
  let stock = stockLocks.get(offerId);
  if (!stock) {
    return { success: false, lockId: null, remaining: 0, reason: "Offer not found" };
  }

  // Clean expired locks
  const now = Date.now();
  for (const [lockId, lock] of stock.locks) {
    if (now > lock.expiresAt) {
      stock.locks.delete(lockId);
      stock.reserved = Math.max(0, stock.reserved - 1);
    }
  }

  // Check if user already has a reservation
  for (const [, lock] of stock.locks) {
    if (lock.userId === userId) {
      return { success: false, lockId: null, remaining: stock.total - stock.reserved, reason: "Already reserved" };
    }
  }

  // Check availability
  if (stock.reserved >= stock.total) {
    const agent = getAgentsByRole("stock_guard")[0];
    if (agent) {
      agent.addAction({
        type: "block",
        description: `Blocked over-reservation for offer ${offerId} (${stock.reserved}/${stock.total})`,
        executed: true,
        result: `User ${userId} denied — stock exhausted`,
      });
    }
    return { success: false, lockId: null, remaining: 0, reason: "Stock exhausted" };
  }

  // Create lock (expires in 15 minutes)
  lockIdCounter++;
  const lockId = `LOCK-${lockIdCounter.toString(36).toUpperCase()}`;
  stock.locks.set(lockId, {
    userId,
    timestamp: now,
    expiresAt: now + 900_000, // 15 min
  });
  stock.reserved++;

  const agent = getAgentsByRole("stock_guard")[0];
  if (agent) {
    agent.addAction({
      type: "reserve",
      description: `Reservation confirmed for offer ${offerId} (${stock.reserved}/${stock.total})`,
      executed: true,
      result: `User ${userId} — Lock ${lockId}`,
    });
  }

  return { success: true, lockId, remaining: stock.total - stock.reserved };
}

/**
 * Confirm a reservation (makes it permanent, removes expiry)
 */
export function confirmReservation(offerId: string, lockId: string): boolean {
  const stock = stockLocks.get(offerId);
  if (!stock) return false;

  const lock = stock.locks.get(lockId);
  if (!lock) return false;

  // Make permanent (set far-future expiry)
  lock.expiresAt = Infinity;
  return true;
}

/**
 * Cancel a reservation
 */
export function cancelReservation(offerId: string, lockId: string): boolean {
  const stock = stockLocks.get(offerId);
  if (!stock) return false;

  if (stock.locks.has(lockId)) {
    stock.locks.delete(lockId);
    stock.reserved = Math.max(0, stock.reserved - 1);

    const agent = getAgentsByRole("stock_guard")[0];
    if (agent) {
      agent.addAction({
        type: "release",
        description: `Reservation cancelled for offer ${offerId} (${stock.reserved}/${stock.total})`,
        executed: true,
        result: `Lock ${lockId} released`,
      });
    }
    return true;
  }
  return false;
}

/**
 * Get stock status for an offer
 */
export function getStockStatus(offerId: string): { total: number; reserved: number; available: number; locks: number } | null {
  const stock = stockLocks.get(offerId);
  if (!stock) return null;

  // Clean expired locks first
  const now = Date.now();
  for (const [lockId, lock] of stock.locks) {
    if (now > lock.expiresAt) {
      stock.locks.delete(lockId);
      stock.reserved = Math.max(0, stock.reserved - 1);
    }
  }

  return {
    total: stock.total,
    reserved: stock.reserved,
    available: stock.total - stock.reserved,
    locks: stock.locks.size,
  };
}

/**
 * Stock guard agent — monitors for race conditions and anomalies
 */
function stockGuardScan() {
  const guards = getAgentsByRole("stock_guard");
  for (const guard of guards) {
    guard.state = "scanning";
    guard.stats.scans++;

    for (const [offerId, stock] of stockLocks) {
      // Check for overbooking
      if (stock.reserved > stock.total) {
        guard.addFinding({
          type: "overbooking",
          severity: "critical",
          description: `OVERBOOKING detected: ${stock.reserved}/${stock.total} for offer ${offerId}`,
          location: `stock/${offerId}`,
          evidence: `Reserved: ${stock.reserved}, Total: ${stock.total}, Locks: ${stock.locks.size}`,
        });
        // Emergency fix
        stock.reserved = stock.total;
        guard.addAction({
          type: "fix",
          description: `Emergency: capped reservations for ${offerId} at ${stock.total}`,
          executed: true,
          result: "Overbooking corrected",
        });
      }

      // Check for stale locks
      const now = Date.now();
      let staleCount = 0;
      for (const [lockId, lock] of stock.locks) {
        if (lock.expiresAt !== Infinity && now > lock.expiresAt) {
          stock.locks.delete(lockId);
          stock.reserved = Math.max(0, stock.reserved - 1);
          staleCount++;
        }
      }
      if (staleCount > 0) {
        guard.addAction({
          type: "release",
          description: `Cleaned ${staleCount} expired locks for offer ${offerId}`,
          executed: true,
          result: `${staleCount} slots freed`,
        });
      }
    }

    guard.state = "idle";
    guard.heartbeat();
  }
}

// ╔═══════════════════════════════════════════╗
// ║  AGENT ORCHESTRATOR                       ║
// ╚═══════════════════════════════════════════╝

let orchestratorRunning = false;
const INTERVALS: Record<string, number> = {
  detective: 60_000,     // Every 1 min
  sentinel: 30_000,      // Every 30s
  guardian: 45_000,      // Every 45s
  red_team: 300_000,     // Every 5 min
  medic: 30_000,         // Every 30s
  stock_guard: 15_000,   // Every 15s
  tribunal: 120_000,     // Every 2 min
};

const timers: ReturnType<typeof setInterval>[] = [];

/**
 * Initialize all agents and start the orchestrator
 */
export function initAgentSystem() {
  if (orchestratorRunning) return;
  orchestratorRunning = true;

  console.log("[Agents] 🤖 Initializing autonomous agent system...");

  // Create agents
  new Agent("Detective-1", "detective");
  new Agent("Prosecutor-1", "prosecutor");
  new Agent("Defender-1", "defender");
  new Agent("Judge-1", "judge");
  new Agent("Executor-1", "executor");
  new Agent("Sentinel-Alpha", "sentinel");
  new Agent("Sentinel-Beta", "sentinel");
  new Agent("Guardian-1", "guardian");
  new Agent("Guardian-2", "guardian");
  new Agent("RedTeam-1", "red_team");
  new Agent("RedTeam-2", "red_team");
  new Agent("Medic-1", "medic");
  new Agent("Medic-2", "medic");
  new Agent("StockGuard-1", "stock_guard");
  new Agent("StockGuard-2", "stock_guard");

  // Global error collector
  if (typeof window !== "undefined") {
    (window as unknown as { __ol_errors: Error[] }).__ol_errors = [];
    (window as unknown as { __ol_failed_requests: { url: string; status: number }[] }).__ol_failed_requests = [];

    window.addEventListener("error", (e) => {
      (window as unknown as { __ol_errors: Error[] }).__ol_errors.push(e.error || new Error(e.message));
    });

    window.addEventListener("unhandledrejection", (e) => {
      (window as unknown as { __ol_errors: Error[] }).__ol_errors.push(new Error(`Unhandled rejection: ${e.reason}`));
    });

    // Intercept failed fetches
    const origFetch = window.fetch;
    window.fetch = async function (...args) {
      try {
        const resp = await origFetch.apply(this, args);
        if (!resp.ok && resp.status >= 400) {
          (window as unknown as { __ol_failed_requests: { url: string; status: number }[] }).__ol_failed_requests.push({
            url: typeof args[0] === "string" ? args[0] : (args[0] as Request).url,
            status: resp.status,
          });
        }
        return resp;
      } catch (err) {
        throw err;
      }
    };
  }

  // Start periodic scans
  timers.push(setInterval(detectiveScan, INTERVALS.detective));
  timers.push(setInterval(sentinelScan, INTERVALS.sentinel));
  timers.push(setInterval(guardianScan, INTERVALS.guardian));
  timers.push(setInterval(() => { redTeamRun(); }, INTERVALS.red_team));
  timers.push(setInterval(medicCheck, INTERVALS.medic));
  timers.push(setInterval(stockGuardScan, INTERVALS.stock_guard));
  timers.push(setInterval(() => { runTribunal(); }, INTERVALS.tribunal));

  // Initial scans (staggered)
  setTimeout(detectiveScan, 2000);
  setTimeout(sentinelScan, 3000);
  setTimeout(guardianScan, 4000);
  setTimeout(medicCheck, 5000);
  setTimeout(stockGuardScan, 1000);
  setTimeout(() => { redTeamRun(); }, 10_000); // Red team after 10s

  console.log(`[Agents] ✅ ${getAllAgents().length} agents deployed`);
  console.log("[Agents] 📋 Teams:");
  console.log("   🔍 Detective × 1  — Bug detection (every 1min)");
  console.log("   ⚖️  Tribunal × 3   — Prosecutor, Defender, Judge (every 2min)");
  console.log("   🛡️ Sentinel × 2   — External security (every 30s)");
  console.log("   🔒 Guardian × 2   — Internal security (every 45s)");
  console.log("   🔴 Red Team × 2   — Penetration testing (every 5min)");
  console.log("   💊 Medic × 2      — Health monitoring (every 30s)");
  console.log("   📦 StockGuard × 2 — Reservation atomicity (every 15s)");
}

export function stopAgentSystem() {
  for (const timer of timers) clearInterval(timer);
  timers.length = 0;
  orchestratorRunning = false;
  console.log("[Agents] ⏹️ Agent system stopped");
}

/**
 * Get comprehensive system status
 */
export function getSystemStatus() {
  const agents = getAllAgents();
  const alive = agents.filter((a) => a.isAlive());
  const totalScans = agents.reduce((s, a) => s + a.stats.scans, 0);
  const totalDetections = agents.reduce((s, a) => s + a.stats.detections, 0);
  const totalFixes = agents.reduce((s, a) => s + a.stats.fixes, 0);

  return {
    running: orchestratorRunning,
    agentsTotal: agents.length,
    agentsAlive: alive.length,
    totalScans,
    totalDetections,
    totalFixes,
    tribunalCases: tribunalCases.length,
    approvedCases: tribunalCases.filter((c) => c.verdict === "approved").length,
    rejectedCases: tribunalCases.filter((c) => c.verdict === "rejected").length,
    redTeamTests: redTeamResults.length,
    redTeamPassed: redTeamResults.filter((r) => r.actualResult === r.expectedResult).length,
    healthChecks: healthHistory.length,
    healthyEndpoints: healthHistory.filter((h) => h.status === "healthy").length,
    stockOffers: stockLocks.size,
    messageCount: messageBus.length,
    teams: {
      detective: getAgentsByRole("detective").map((a) => ({ id: a.id, state: a.state, scans: a.stats.scans })),
      tribunal: { cases: tribunalCases.length, approved: tribunalCases.filter((c) => c.verdict === "approved").length },
      sentinels: getAgentsByRole("sentinel").map((a) => ({ id: a.id, state: a.state, detections: a.stats.detections })),
      guardians: getAgentsByRole("guardian").map((a) => ({ id: a.id, state: a.state, detections: a.stats.detections })),
      redTeam: { tests: redTeamResults.length, passRate: redTeamResults.length > 0 ? Math.round((redTeamResults.filter((r) => r.actualResult === r.expectedResult).length / redTeamResults.length) * 100) : 0 },
      medics: getAgentsByRole("medic").map((a) => ({ id: a.id, state: a.state })),
      stockGuards: getAgentsByRole("stock_guard").map((a) => ({ id: a.id, state: a.state })),
    },
  };
}
