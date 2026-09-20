import { useState } from "react";
import { useAgents } from "@/lib/agents/use-agents";
import { cn } from "@/lib/utils";
import {
  Bot,
  Shield,
  Swords,
  Heart,
  Package,
  Scale,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Eye,
  Lock,
  Radio,
} from "lucide-react";

export function AgentDashboard() {
  const {
    status,
    tribunalCases,
    redTeamResults,
    healthChecks,
    messages,
    agents,
    running,
    triggerTribunal,
  } = useAgents();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"overview" | "tribunal" | "security" | "redteam" | "health" | "logs">("overview");

  if (!running) return null;

  const tabs = [
    { id: "overview" as const, label: "Vue d'ensemble", icon: <Activity className="size-3.5" /> },
    { id: "tribunal" as const, label: "Tribunal", icon: <Scale className="size-3.5" /> },
    { id: "security" as const, label: "Sécurité", icon: <Shield className="size-3.5" /> },
    { id: "redteam" as const, label: "Red Team", icon: <Swords className="size-3.5" /> },
    { id: "health" as const, label: "Santé", icon: <Heart className="size-3.5" /> },
    { id: "logs" as const, label: "Logs", icon: <Radio className="size-3.5" /> },
  ];

  const criticalCount = agents.reduce(
    (sum, a) => sum + a.findings.filter((f) => f.severity === "critical").length, 0
  );

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative flex items-center gap-2 rounded-full px-4 py-2 font-medium shadow-lg transition-all",
          open ? "bg-white text-gray-900" : "bg-indigo-600 text-white",
          criticalCount > 0 && !open && "animate-pulse bg-red-600"
        )}
      >
        <Bot className="size-5" />
        <span className="text-sm">Agents</span>
        <span className="rounded-full bg-white/20 px-1.5 text-xs">{status.agentsAlive}/{status.agentsTotal}</span>
        {criticalCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {criticalCount}
          </span>
        )}
      </button>

      {/* Dashboard */}
      {open && (
        <div className="absolute bottom-14 left-0 w-[500px] max-h-[85vh] overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="size-6" />
                <h3 className="font-display text-lg font-bold">Centre de Commande</h3>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5">
                  <span className="size-2 rounded-full bg-green-400 animate-pulse" />
                  {status.agentsAlive} actifs
                </span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="mt-3 grid grid-cols-5 gap-2 text-center">
              <div className="rounded-lg bg-white/10 p-2">
                <div className="text-lg font-bold">{status.totalScans}</div>
                <div className="text-[10px] opacity-80">Scans</div>
              </div>
              <div className="rounded-lg bg-yellow-500/20 p-2">
                <div className="text-lg font-bold text-yellow-300">{status.totalDetections}</div>
                <div className="text-[10px] opacity-80">Détections</div>
              </div>
              <div className="rounded-lg bg-green-500/20 p-2">
                <div className="text-lg font-bold text-green-300">{status.totalFixes}</div>
                <div className="text-[10px] opacity-80">Corrections</div>
              </div>
              <div className="rounded-lg bg-blue-500/20 p-2">
                <div className="text-lg font-bold text-blue-300">{status.approvedCases}</div>
                <div className="text-[10px] opacity-80">Approuvés</div>
              </div>
              <div className="rounded-lg bg-purple-500/20 p-2">
                <div className="text-lg font-bold text-purple-300">{status.teams.redTeam.passRate}%</div>
                <div className="text-[10px] opacity-80">Red Team</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs font-medium transition-colors",
                  tab === t.id ? "border-b-2 border-indigo-600 text-indigo-700" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-[50vh] overflow-y-auto p-3">
            {tab === "overview" && (
              <div className="space-y-3">
                {/* Teams */}
                {agents.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <AgentIcon role={agent.role} />
                      <div>
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-[10px] text-gray-500">{agent.id} • {agent.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">{agent.stats.scans} scans</span>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 font-medium",
                        agent.state === "scanning" ? "bg-blue-100 text-blue-700" :
                        agent.state === "alert" ? "bg-red-100 text-red-700" :
                        "bg-green-100 text-green-700"
                      )}>
                        {agent.state === "idle" ? "🟢 Prêt" : agent.state === "scanning" ? "🔍 Scan..." : agent.state === "alert" ? "🔴 Alerte" : `⚡ ${agent.state}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "tribunal" && (
              <div className="space-y-3">
                <button
                  onClick={triggerTribunal}
                  className="w-full rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  ⚖️ Lancer un procès manuel
                </button>
                {tribunalCases.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400">Aucun procès en cours</p>
                ) : (
                  tribunalCases.slice(0, 10).map((tc) => (
                    <div key={tc.id} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-700">{tc.id}</span>
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          tc.verdict === "approved" ? "bg-green-100 text-green-700" :
                          tc.verdict === "rejected" ? "bg-red-100 text-red-700" :
                          tc.verdict === "needs_revision" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-600"
                        )}>
                          {tc.verdict === "approved" ? "✅ Approuvé" : tc.verdict === "rejected" ? "❌ Rejeté" : tc.verdict === "needs_revision" ? "🔄 Révision" : "⏳ En cours"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        <strong>Détection:</strong> {tc.finding.description}
                      </p>
                      {tc.judgeReasoning && (
                        <p className="text-[10px] text-gray-500 italic">{tc.judgeReasoning}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === "security" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <Shield className="mx-auto mb-1 size-5 text-blue-600" />
                    <p className="text-lg font-bold text-blue-700">{status.teams.sentinels.length}</p>
                    <p className="text-[10px] text-blue-600">Sentinelles externes</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-3 text-center">
                    <Lock className="mx-auto mb-1 size-5 text-purple-600" />
                    <p className="text-lg font-bold text-purple-700">{status.teams.guardians.length}</p>
                    <p className="text-[10px] text-purple-600">Gardiens internes</p>
                  </div>
                </div>
                {/* Recent findings */}
                {agents
                  .filter((a) => a.role === "sentinel" || a.role === "guardian")
                  .flatMap((a) => a.findings.map((f) => ({ ...f, agentName: a.name })))
                  .slice(-10)
                  .map((f, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
                      <span className={cn(
                        "mt-0.5 size-2 shrink-0 rounded-full",
                        f.severity === "critical" ? "bg-red-500" :
                        f.severity === "error" ? "bg-orange-500" :
                        f.severity === "warning" ? "bg-yellow-500" : "bg-green-500"
                      )} />
                      <div>
                        <p className="text-xs font-medium">{f.description}</p>
                        <p className="text-[10px] text-gray-500">{f.agentName} • {f.type}</p>
                      </div>
                    </div>
                  ))
                }
                {agents.filter((a) => a.role === "sentinel" || a.role === "guardian").every((a) => a.findings.length === 0) && (
                  <p className="py-6 text-center text-sm text-gray-400">🛡️ Aucune menace détectée</p>
                )}
              </div>
            )}

            {tab === "redteam" && (
              <div className="space-y-2">
                <div className="rounded-lg bg-gray-900 p-3 text-green-400 font-mono text-xs">
                  <p>Red Team Pass Rate: <span className="font-bold">{status.teams.redTeam.passRate}%</span></p>
                  <p>Tests Run: {status.teams.redTeam.tests}</p>
                </div>
                {redTeamResults.slice(0, 15).map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div>
                      <p className="text-xs font-medium">{r.name}</p>
                      <p className="text-[10px] text-gray-500">{r.category} • {r.responseTime}ms</p>
                    </div>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      r.actualResult === r.expectedResult ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {r.actualResult === r.expectedResult ? "✅ PASS" : `❌ FAIL (${r.actualResult})`}
                    </span>
                  </div>
                ))}
                {redTeamResults.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">⏳ Tests en attente...</p>
                )}
              </div>
            )}

            {tab === "health" && (
              <div className="space-y-2">
                {healthChecks.slice(0, 15).map((h, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "size-2 rounded-full",
                        h.status === "healthy" ? "bg-green-500" :
                        h.status === "degraded" ? "bg-yellow-500" : "bg-red-500"
                      )} />
                      <div>
                        <p className="text-xs font-medium">{h.endpoint}</p>
                        <p className="text-[10px] text-gray-500">{h.responseTime}ms • {h.statusCode || "error"}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {new Date(h.timestamp).toLocaleTimeString("fr-CH")}
                    </span>
                  </div>
                ))}
                {healthChecks.length === 0 && (
                  <p className="py-6 text-center text-sm text-gray-400">⏳ Premiers checks en cours...</p>
                )}
              </div>
            )}

            {tab === "logs" && (
              <div className="space-y-1 font-mono text-[10px]">
                {messages.slice(0, 30).map((m, i) => (
                  <div key={i} className="flex items-start gap-2 rounded bg-gray-50 px-2 py-1">
                    <span className={cn(
                      "shrink-0 rounded px-1",
                      m.priority === "critical" ? "bg-red-100 text-red-700" :
                      m.priority === "high" ? "bg-orange-100 text-orange-700" :
                      m.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {m.priority.toUpperCase()}
                    </span>
                    <span className="text-gray-500">{m.from}→{m.to}</span>
                    <span className="truncate text-gray-700">{m.type}: {JSON.stringify(m.payload).slice(0, 80)}</span>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="py-6 text-center text-xs text-gray-400 font-sans">En attente de messages...</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AgentIcon({ role }: { role: string }) {
  const icons: Record<string, React.ReactNode> = {
    detective: <Eye className="size-4 text-blue-600" />,
    prosecutor: <XCircle className="size-4 text-red-600" />,
    defender: <CheckCircle2 className="size-4 text-green-600" />,
    judge: <Scale className="size-4 text-purple-600" />,
    executor: <Zap className="size-4 text-yellow-600" />,
    sentinel: <Shield className="size-4 text-blue-600" />,
    guardian: <Lock className="size-4 text-purple-600" />,
    red_team: <Swords className="size-4 text-red-600" />,
    medic: <Heart className="size-4 text-green-600" />,
    stock_guard: <Package className="size-4 text-orange-600" />,
  };
  return <>{icons[role] || <Bot className="size-4 text-gray-600" />}</>;
}
