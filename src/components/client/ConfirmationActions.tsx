"use client";

import { useState } from "react";
import { CalendarPlus, Share2, Check } from "lucide-react";

export function CalendarButton({
  title,
  shopName,
  shopAddress,
  validUntil,
  code,
}: {
  title: string;
  shopName: string;
  shopAddress: string;
  validUntil: string;
  code: string;
}) {
  function handleClick() {
    const end = new Date(validUntil);
    const start = new Date(end.getTime() - 30 * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const calUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Retrait: ${title}`)}&dates=${fmt(start)}/${fmt(end)}&location=${encodeURIComponent(`${shopName}, ${shopAddress}, Villeneuve`)}&details=${encodeURIComponent(`Code de retrait: ${code}\nÀ présenter chez ${shopName}`)}`;
    window.open(calUrl, "_blank");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2 rounded-xl border border-ec-rule bg-white px-4 py-2.5 text-xs font-extrabold text-ec-ink transition active:scale-95 hover:bg-ec-soft"
    >
      <CalendarPlus className="h-4 w-4 text-ec-blue" />
      Ajouter au calendrier
    </button>
  );
}

export function ShareCodeButton({
  code,
  shopName,
}: {
  code: string;
  shopName: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const text = `Mon code de retrait OffresLocal: ${code}\nÀ présenter chez ${shopName}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "Code de retrait", text });
        return;
      } catch { /* cancelled */ }
    }
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2 rounded-xl border border-ec-rule bg-white px-4 py-2.5 text-xs font-extrabold text-ec-ink transition active:scale-95 hover:bg-ec-soft"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-ec-green" />
          Copié !
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 text-ec-green" />
          Partager mon code
        </>
      )}
    </button>
  );
}
