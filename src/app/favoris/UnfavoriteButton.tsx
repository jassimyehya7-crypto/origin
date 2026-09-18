"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export function UnfavoriteButton({ shopId }: { shopId: string }) {
  const [removing, setRemoving] = useState(false);

  async function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (removing) return;
    setRemoving(true);
    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId }),
      });
      // Remove from DOM
      const card = (e.target as HTMLElement).closest("[class*='relative flex']");
      if (card) {
        card.style.transition = "opacity 0.3s, transform 0.3s";
        card.style.opacity = "0";
        card.style.transform = "translateX(100%)";
        setTimeout(() => card.remove(), 300);
      }
    } catch {
      setRemoving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={removing}
      className="absolute -right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ec-red transition hover:bg-red-50 disabled:opacity-50"
      aria-label="Retirer des favoris"
    >
      <Heart className="h-4 w-4 fill-ec-red" />
    </button>
  );
}
