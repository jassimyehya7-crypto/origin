"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  EC_PHONE_KEY,
  EC_SOFT_ID_KEY,
  EC_STRIKE_NOTE_KEY,
  EC_PHONE_RISK_KEY,
  EC_RISK_DISMISS_KEY,
  ensureSoftUserId,
} from "@/lib/soft-profile";
import {
  fetchClientRisk,
  type ClientRiskStatus,
} from "@/lib/risk-status";

/**
 * In-app strike / ban notice for client home & profil.
 * Ban stays visible while active; strike 1/2 can be dismissed for the session key.
 */
export function RiskBanner() {
  const [status, setStatus] = useState<ClientRiskStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined") return;
    const softUserId = ensureSoftUserId();
    const phone = (localStorage.getItem(EC_PHONE_KEY) || "").trim();
    try {
      const s = await fetchClientRisk({ softUserId, phone: phone || null });
      setStatus(s);
      if (s.message) {
        localStorage.setItem(EC_STRIKE_NOTE_KEY, s.message);
      } else {
        localStorage.removeItem(EC_STRIKE_NOTE_KEY);
      }
      if (s.risk) localStorage.setItem(EC_PHONE_RISK_KEY, "1");
      else localStorage.removeItem(EC_PHONE_RISK_KEY);

      if (s.banned) {
        setDismissed(false);
        localStorage.removeItem(EC_RISK_DISMISS_KEY);
      } else if (s.strikeCount > 0) {
        const d = localStorage.getItem(EC_RISK_DISMISS_KEY);
        // Dismiss only matches current strike count
        setDismissed(d === String(s.strikeCount));
      } else {
        setDismissed(false);
        localStorage.removeItem(EC_RISK_DISMISS_KEY);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    ensureSoftUserId();
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  if (!status?.message || (!status.banned && status.strikeCount <= 0)) {
    return null;
  }
  if (!status.banned && dismissed) return null;

  function dismiss() {
    if (status?.banned) return;
    if (status) {
      localStorage.setItem(EC_RISK_DISMISS_KEY, String(status.strikeCount));
      setDismissed(true);
    }
  }

  return (
    <div
      role="status"
      className={`mb-3 flex items-start gap-2 rounded-[14px] border px-3 py-2.5 text-sm font-bold ${
        status.banned
          ? "border-ec-red/40 bg-ec-paper text-ec-red"
          : "border-ec-rule bg-ec-soft text-ec-ink"
      }`}
    >
      <p className="flex-1 leading-snug">{status.message}</p>
      {!status.banned && (
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-ec-muted hover:bg-white"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Prefetch soft id so banner / reserve share the same key. */
export function ensureRiskIdentity(): { softUserId: string; phone: string } {
  const softUserId =
    typeof window !== "undefined"
      ? ensureSoftUserId() || localStorage.getItem(EC_SOFT_ID_KEY) || ""
      : "";
  const phone =
    typeof window !== "undefined"
      ? (localStorage.getItem(EC_PHONE_KEY) || "").trim()
      : "";
  return { softUserId, phone };
}
