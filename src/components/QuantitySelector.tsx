"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  value,
  min = 1,
  max = 99,
  onChange,
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-[12px] border border-ec-rule bg-white",
        className
      )}
    >
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center bg-ec-soft text-ec-ink disabled:opacity-40"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Diminuer"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[2.75rem] text-center text-lg font-bold">{value}</span>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center bg-ec-ink text-white disabled:opacity-40"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Augmenter"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
