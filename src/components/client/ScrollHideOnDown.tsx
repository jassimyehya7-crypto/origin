"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ScrollHideOnDownProps = {
  children: ReactNode;
  className?: string;
};

/** Visible uniquement en haut de page ; disparaît au scroll bas et reste cachée. */
export function ScrollHideOnDown({ children, className = "" }: ScrollHideOnDownProps) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y <= 8) {
        setHidden(false);
      } else if (y > lastScrollY.current + 2) {
        setHidden(true);
      }
      lastScrollY.current = y;
    };

    lastScrollY.current = window.scrollY;
    if (window.scrollY > 8) setHidden(true);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      aria-hidden={hidden}
      className={
        hidden
          ? "pointer-events-none max-h-0 overflow-hidden border-0 opacity-0"
          : `${className} max-h-24 overflow-hidden opacity-100 transition-[max-height,opacity] duration-200 ease-out`
      }
    >
      {children}
    </div>
  );
}
