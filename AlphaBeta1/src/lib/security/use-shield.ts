"use client";

/**
 * OffresLocal — Client Shield Hook
 * Injecte les protections de sécurité dans les requêtes API
 */

import { useEffect, useCallback, useRef } from "react";
import {
  generateFingerprint,
  generateRequestToken,
  detectBot,
  checkIntegrity,
  logAbuseEvent,
} from "@/lib/security/shield";

let cachedFingerprint: string | null = null;

function getFingerprint(): string {
  if (!cachedFingerprint) {
    cachedFingerprint = generateFingerprint();
  }
  return cachedFingerprint;
}

export function useShield() {
  const initRef = useRef(false);

  // Run security checks on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    // Bot detection
    const botResult = detectBot();
    if (botResult.isBot) {
      logAbuseEvent("bot_detected", getFingerprint());
      console.warn("[Shield] Bot detected:", botResult.reasons);
    }

    // Integrity check (delayed to let DOM settle)
    const timer = setTimeout(() => {
      const integrity = checkIntegrity();
      if (!integrity.valid) {
        logAbuseEvent("tampering", getFingerprint());
        console.warn("[Shield] Integrity violations:", integrity.violations);
      }
    }, 3000);

    // Periodic integrity checks (every 30s)
    const interval = setInterval(() => {
      const integrity = checkIntegrity();
      if (!integrity.valid) {
        logAbuseEvent("tampering", getFingerprint());
      }
    }, 30_000);

    // Detect DevTools opening (heuristic)
    const devtoolsCheck = setInterval(() => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        // DevTools likely open — not necessarily malicious but log it
        // Only log once
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      clearInterval(devtoolsCheck);
    };
  }, []);

  // Create secured fetch wrapper
  const securedFetch = useCallback(
    async (url: string, options: RequestInit = {}, action = "api") => {
      const fingerprint = getFingerprint();
      const token = generateRequestToken(action);
      const headers = new Headers(options.headers || {});

      // Inject security headers
      headers.set("X-OL-FP", fingerprint);
      headers.set("X-OL-Token", token);
      headers.set("X-OL-TS", String(Date.now()));

      const response = await fetch(url, { ...options, headers });

      // Check for challenge header
      const challenge = response.headers.get("X-OL-Challenge");
      if (challenge === "required") {
        // Could trigger a CAPTCHA modal here
        console.warn("[Shield] Challenge required");
      }

      return response;
    },
    []
  );

  return { securedFetch, getFingerprint };
}
