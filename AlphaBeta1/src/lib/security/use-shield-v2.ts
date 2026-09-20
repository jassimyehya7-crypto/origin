"use client";

/**
 * OffresLocal Shield v2 — React Integration Hook
 * ═══════════════════════════════════════════════
 * Hook principal pour intégrer toutes les couches de sécurité
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  initShield,
  getShieldStatus,
  createSecuredHeaders,
  adaptiveRateLimit,
  checkCanaryAccess,
  type ShieldStatus,
  type ADAPTIVE_LIMITS,
} from "./shield-v2";

import { logAbuseEvent } from "./shield";

export interface UseShieldV2Return {
  /** Statut complet du bouclier */
  status: ShieldStatus;
  /** Effectuer une requête sécurisée (toutes les couches appliquées) */
  securedFetch: (
    url: string,
    options?: RequestInit,
    action?: keyof typeof ADAPTIVE_LIMITS
  ) => Promise<Response>;
  /** Vérifier si l'action est autorisée (rate limit) */
  canPerform: (action: keyof typeof ADAPTIVE_LIMITS) => boolean;
  /** Score d'humanité (0-100) */
  humanScore: number;
  /** Le bouclier est-il initialisé ? */
  ready: boolean;
}

export function useShieldV2(): UseShieldV2Return {
  const [status, setStatus] = useState<ShieldStatus>({
    initialized: false,
    fingerprint: null,
    session: null,
    botAnalysis: null,
    humanScore: null,
    integrityViolations: [],
    canaryTriggered: false,
  });
  const [ready, setReady] = useState(false);
  const initRef = useRef(false);

  // Initialize shield on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    initShield().then((s) => {
      setStatus(s);
      setReady(true);
    });

    // Periodic status updates (every 15s)
    const interval = setInterval(() => {
      const s = getShieldStatus();
      setStatus(s);

      // Alert on critical events
      if (s.canaryTriggered) {
        console.error("[Shield v2] 🚨 Canary triggered! Potential breach.");
      }
      if (s.integrityViolations.length > 0) {
        const latest = s.integrityViolations[s.integrityViolations.length - 1];
        console.warn("[Shield v2] Integrity violation:", latest.type, latest.detail);
      }
    }, 15_000);

    return () => clearInterval(interval);
  }, []);

  // Secured fetch with all layers
  const securedFetch = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      action: keyof typeof ADAPTIVE_LIMITS = "api"
    ): Promise<Response> => {
      const fp = status.fingerprint?.hash || "unknown";

      // Layer 8: Adaptive rate limit
      const rateKey = `${action}:${fp}`;
      const rateResult = adaptiveRateLimit(rateKey, action);
      if (!rateResult.allowed) {
        logAbuseEvent("rate_limited", fp);
        const retrySec = Math.ceil(rateResult.retryAfterMs / 1000);
        return new Response(
          JSON.stringify({
            error: `Trop de requêtes. Réessayez dans ${retrySec}s.`,
            retryAfter: retrySec,
            backoffLevel: rateResult.backoffLevel,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", "Retry-After": String(retrySec) },
          }
        );
      }

      // Generate all security headers
      const secHeaders = await createSecuredHeaders(action);
      const headers = new Headers(options.headers || {});
      for (const [key, value] of Object.entries(secHeaders)) {
        headers.set(key, value);
      }

      try {
        const response = await fetch(url, { ...options, headers });

        // Check for challenge header from server
        const challenge = response.headers.get("X-OL-Challenge");
        if (challenge === "required") {
          console.warn("[Shield v2] Server requires additional challenge");
        }

        return response;
      } catch (err) {
        logAbuseEvent("network_error", fp);
        throw err;
      }
    },
    [status.fingerprint]
  );

  // Check if action is allowed
  const canPerform = useCallback(
    (action: keyof typeof ADAPTIVE_LIMITS): boolean => {
      const fp = status.fingerprint?.hash || "unknown";
      const rateKey = `${action}:${fp}`;
      const result = adaptiveRateLimit(rateKey, action);
      return result.allowed;
    },
    [status.fingerprint]
  );

  return {
    status,
    securedFetch,
    canPerform,
    humanScore: status.humanScore?.score || 50,
    ready,
  };
}
