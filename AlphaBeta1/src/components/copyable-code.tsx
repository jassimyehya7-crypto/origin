import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="mt-6 inline-flex w-full max-w-sm cursor-pointer flex-col items-center rounded-[var(--radius-md)] border-2 border-dashed border-line bg-paper px-6 py-5 press"
      title="Copier le code"
    >
      <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-mute">
        Code de retrait
      </span>
      <span className="mt-2 font-mono text-4xl font-black tracking-wider text-ink">
        {code}
      </span>
      <span className="mt-2 flex items-center gap-1 text-xs font-bold text-mute">
        {copied ? (
          <>
            <Check className="size-3.5 text-ok" />
            <span className="text-ok">Copié</span>
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            Appuyer pour copier
          </>
        )}
      </span>
    </button>
  );
}
