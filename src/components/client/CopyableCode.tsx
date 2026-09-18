"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-6 inline-flex w-full max-w-sm cursor-pointer flex-col items-center border-2 border-dashed border-ec-rule bg-ec-paper px-6 py-5 transition active:scale-[0.98] hover:border-ec-blue"
      title="Copier le code"
    >
      <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-ec-muted">
        Code de retrait
      </span>
      <span className="mt-2 font-mono text-4xl font-black tracking-wider text-ec-ink sm:text-5xl">
        {code}
      </span>
      <span className="mt-2 flex items-center gap-1 text-xs font-bold text-ec-muted">
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-ec-green" />
            <span className="text-ec-green">Copié !</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Appuyer pour copier
          </>
        )}
      </span>
    </button>
  );
}
