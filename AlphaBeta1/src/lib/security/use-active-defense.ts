"use client";

/**
 * OffresLocal — Active Defense Hook
 * ═══════════════════════════════════
 * Intègre le Threat Intelligence System côté client
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  collectDeviceInfo,
  geolocateIP,
  detectProxyVPN,
  securityGate,
  onSecurityAlert,
  getAlerts,
  getThreatStats,
  isDeceptionEndpoint,
  type SecurityAlert,
  type AttackAction,
  type SecurityGateResult,
} from "./threat-intel";
import { generateAdvancedFingerprint } from "./shield-v2";

export interface UseActiveDefenseReturn {
  /** Vérifier une action et prendre une décision */
  checkAction: (action: string, detail: string, url?: string) => Promise<SecurityGateResult>;
  /** Alertes de sécurité en temps réel */
  alerts: SecurityAlert[];
  /** Statistiques des menaces */
  stats: ReturnType<typeof getThreatStats>;
  /** Le système est prêt */
  ready: boolean;
  /** Nombre d'alertes non lues */
  unreadCount: number;
  /** Marquer toutes les alertes comme lues */
  markAllRead: () => void;
}

export function useActiveDefense(): UseActiveDefenseReturn {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState(getThreatStats());
  const [ready, setReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const fingerprintRef = useRef<string>("anonymous");
  const deviceInfoRef = useRef(collectDeviceInfo());

  // Initialize
  useEffect(() => {
    generateAdvancedFingerprint().then((fp) => {
      fingerprintRef.current = fp.hash;
      setReady(true);
    });

    // Listen for security alerts in real-time
    const unsubscribe = onSecurityAlert((alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 100));
      setUnreadCount((c) => c + 1);
      setStats(getThreatStats());

      // Browser notification for critical alerts
      if (alert.severity === "critical" && "Notification" in window && Notification.permission === "granted") {
        new Notification(`🚨 ${alert.title}`, {
          body: `IP: ${alert.ip} — ${alert.location}`,
          icon: "/favicon.ico",
          tag: alert.id,
        });
      }
    });

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Load existing alerts
    setAlerts(getAlerts(50));
    setStats(getThreatStats());

    return () => {
      unsubscribe();
    };
  }, []);

  const checkAction = useCallback(
    async (action: string, detail: string, url?: string): Promise<SecurityGateResult> => {
      const attackAction: AttackAction = {
        timestamp: Date.now(),
        type: action,
        detail,
        url,
        blocked: false,
      };

      // Get IP (client-side we use fingerprint as proxy)
      const ip = "client-side";

      // Check deception endpoints
      if (url && isDeceptionEndpoint(url)) {
        attackAction.type = "honeypot-triggered";
        attackAction.blocked = true;
      }

      const result = await securityGate(
        ip,
        fingerprintRef.current,
        deviceInfoRef.current,
        attackAction,
        url || window.location.pathname
      );

      return result;
    },
    []
  );

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return {
    checkAction,
    alerts,
    stats,
    ready,
    unreadCount,
    markAllRead,
  };
}
