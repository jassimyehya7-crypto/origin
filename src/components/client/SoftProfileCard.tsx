"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  clearSoftProfile,
  EC_PHONE_KEY,
  EC_PRENOM_KEY,
  EC_STRIKE_NOTE_KEY,
  ensureSoftUserId,
  readSoftProfile,
  saveSoftProfile,
} from "@/lib/soft-profile";
import { fetchClientRisk } from "@/lib/risk-status";

export function SoftProfileCard() {
  const [prenom, setPrenom] = useState("");
  const [phone, setPhone] = useState("");
  const [strikeNote, setStrikeNote] = useState("");
  const [banned, setBanned] = useState(false);
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  const loadRisk = useCallback(async () => {
    const softUserId = ensureSoftUserId();
    const ph = (localStorage.getItem(EC_PHONE_KEY) || "").trim();
    try {
      const s = await fetchClientRisk({ softUserId, phone: ph || null });
      setBanned(s.banned);
      if (s.message) {
        setStrikeNote(s.message);
        localStorage.setItem(EC_STRIKE_NOTE_KEY, s.message);
      } else {
        setStrikeNote("");
        localStorage.removeItem(EC_STRIKE_NOTE_KEY);
      }
    } catch {
      setStrikeNote(localStorage.getItem(EC_STRIKE_NOTE_KEY) || "");
    }
  }, []);

  useEffect(() => {
    ensureSoftUserId();
    const p = readSoftProfile();
    setPrenom(p?.prenom || localStorage.getItem(EC_PRENOM_KEY) || "");
    setPhone(p?.phone || localStorage.getItem(EC_PHONE_KEY) || "");
    setReady(true);
    void loadRisk();
  }, [loadRisk]);

  function save() {
    saveSoftProfile(prenom, phone);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
    void loadRisk();
  }

  function clear() {
    if (!confirm("Supprimer tes infos (prénom, téléphone) de cet appareil ?")) {
      return;
    }
    clearSoftProfile();
    setPrenom("");
    setPhone("");
    setStrikeNote("");
    setBanned(false);
  }

  if (!ready) {
    return (
      <Card>
        <p className="text-sm font-semibold text-ec-muted">Chargement…</p>
      </Card>
    );
  }

  const initials = (prenom || "?").trim().slice(0, 2).toUpperCase() || "?";

  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ec-ink text-xl font-black text-white">
          {initials}
        </div>
        <div>
          <div className="font-extrabold text-ec-ink">
            {prenom.trim() || "Infos pour le magasin"}
          </div>
          <div className="text-sm font-semibold text-ec-muted">
            {phone.trim() || "Pas de téléphone"}
          </div>
          <div className="text-xs font-extrabold text-ec-blue">
            Villeneuve · Soft profile
          </div>
        </div>
      </div>

      {strikeNote && (
        <p
          className={`mb-3 rounded-[12px] px-3 py-2 text-xs font-bold ${
            banned
              ? "border border-ec-red/40 bg-ec-paper text-ec-red"
              : "bg-ec-soft text-ec-ink"
          }`}
        >
          {strikeNote}
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-extrabold text-ec-ink">
            Prénom
          </label>
          <input
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            placeholder="Marie"
            className="w-full rounded-[12px] border border-ec-rule px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ec-blue"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-extrabold text-ec-ink">
            Téléphone
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="079 000 00 00"
            className="w-full rounded-[12px] border border-ec-rule px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ec-blue"
          />
        </div>
        <Button full variant="primary" onClick={save}>
          {saved ? "Enregistré" : "Enregistrer"}
        </Button>
        <Button full variant="outline" onClick={clear}>
          Supprimer mes infos
        </Button>
        <p className="text-[11px] font-semibold leading-relaxed text-ec-muted">
          Ces infos restent sur cet appareil pour préremplir la prochaine
          réservation. Pas de compte, pas de mot de passe.
        </p>
      </div>
    </Card>
  );
}
