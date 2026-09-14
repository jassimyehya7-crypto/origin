"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "./ui/Button";

export function ResetDemoButton({
  variant = "outline",
  size = "sm",
  className,
}: {
  variant?: "outline" | "ghost" | "secondary";
  size?: "sm" | "md";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function reset() {
    if (!confirm("Réinitialiser toutes les données de démo ?")) return;
    setLoading(true);
    try {
      await fetch("/api/demo/reset", { method: "POST" });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={reset}
      disabled={loading}
      className={className}
    >
      <RotateCcw className="h-4 w-4" />
      {loading ? "Réinitialisation…" : "Réinitialiser démo"}
    </Button>
  );
}
