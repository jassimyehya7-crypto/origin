import { useState } from "react";
import { useActiveDefense } from "@/lib/security/use-active-defense";
import {
  Shield,
  AlertTriangle,
  MapPin,
  Monitor,
  Globe,
  Ban,
  Eye,
  ChevronDown,
  ChevronUp,
  Bell,
  X,
  Activity,
  Zap,
  Skull,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SecurityDashboard() {
  const { alerts, stats, ready, unreadCount, markAllRead } = useActiveDefense();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  if (!ready) return null;

  const severityColors = {
    critical: "bg-red-100 text-red-800 border-red-300",
    high: "bg-orange-100 text-orange-800 border-orange-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    low: "bg-green-100 text-green-800 border-green-300",
  };

  const severityIcons = {
    critical: <Skull className="size-4" />,
    high: <AlertTriangle className="size-4" />,
    medium: <Eye className="size-4" />,
    low: <Shield className="size-4" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) markAllRead();
        }}
        className={cn(
          "relative flex items-center gap-2 rounded-full px-4 py-2 font-medium shadow-lg transition-all",
          isOpen
            ? "bg-white text-gray-900"
            : unreadCount > 0
            ? "bg-red-600 text-white animate-pulse"
            : "bg-gray-900 text-white"
        )}
      >
        <Shield className="size-5" />
        <span className="text-sm">Sécurité</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dashboard panel */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-[420px] max-h-[80vh] overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-6" />
                <h3 className="font-display text-lg font-bold">Centre de Sécurité</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 hover:bg-white/20">
                <X className="size-5" />
              </button>
            </div>
            {/* Stats */}
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div className="rounded-lg bg-white/10 p-2">
                <div className="text-lg font-bold">{stats.total}</div>
                <div className="text-xs opacity-80">Total</div>
              </div>
              <div className="rounded-lg bg-red-500/20 p-2">
                <div className="text-lg font-bold text-red-300">{stats.critical}</div>
                <div className="text-xs opacity-80">Critiques</div>
              </div>
              <div className="rounded-lg bg-orange-500/20 p-2">
                <div className="text-lg font-bold text-orange-300">{stats.high}</div>
                <div className="text-xs opacity-80">Élevées</div>
              </div>
              <div className="rounded-lg bg-green-500/20 p-2">
                <div className="text-lg font-bold text-green-300">{stats.banned}</div>
                <div className="text-xs opacity-80">Bannis</div>
              </div>
            </div>
          </div>

          {/* Attack types */}
          {stats.topAttackTypes.length > 0 && (
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
              <div className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                <Activity className="size-3" />
                Types d'attaques détectées
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.topAttackTypes.map(([type, count]) => (
                  <span key={type} className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs">
                    <Zap className="size-3" />
                    {type}
                    <span className="font-bold">({count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Countries */}
          {stats.topCountries.length > 0 && (
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
              <div className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                <Globe className="size-3" />
                Pays d'origine
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.topCountries.map(([country, count]) => (
                  <span key={country} className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs">
                    {country} ({count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Alert list */}
          <div className="max-h-[40vh] overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Shield className="mx-auto mb-2 size-8 opacity-50" />
                <p className="text-sm">Aucune alerte de sécurité</p>
                <p className="text-xs text-gray-400">Le système surveille en continu</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="border-b border-gray-100">
                  <button
                    onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border", severityColors[alert.severity])}>
                          {severityIcons[alert.severity]}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{alert.title}</p>
                          <p className="truncate text-xs text-gray-500">
                            {alert.ip} — {alert.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                        <Clock className="size-3" />
                        {new Date(alert.timestamp).toLocaleTimeString("fr-CH")}
                        {expanded === alert.id ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                      </div>
                    </div>
                  </button>

                  {expanded === alert.id && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-2">
                      <pre className="whitespace-pre-wrap text-xs text-gray-700 font-mono leading-relaxed">
                        {alert.message}
                      </pre>
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-2">
                        <p className="text-xs font-medium text-blue-800">💡 Recommandation</p>
                        <p className="text-xs text-blue-700">{alert.recommendation}</p>
                      </div>
                      {alert.threat?.banned && (
                        <div className="flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2 py-1.5">
                          <Ban className="size-3 text-red-600" />
                          <span className="text-xs font-medium text-red-800">
                            IP bannie {alert.threat.banExpiry ? `jusqu'au ${new Date(alert.threat.banExpiry).toLocaleDateString("fr-CH")}` : "définitivement"}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
