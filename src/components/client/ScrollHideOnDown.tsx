"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ScrollHideOnDownProps = {
  children: ReactNode;
  className: string;
  hiddenClassName?: string;
};

/** Cache au scroll down ; ne réapparaît qu’en haut de page (pas au scroll up). */
export function ScrollHideOnDown({
  children,
  className,
  hiddenClassName = "-translate-y-full",
}: ScrollHideOnDownProps) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 8) {
        setHidden(false);
      } else if (currentScrollY > lastScrollY.current + 2) {
        setHidden(true);
      }
      // scroll up au milieu : ne rien faire — reste cachée jusqu’en haut

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
    if (window.scrollY > 8) setHidden(true);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`${className} transition-[transform,opacity] duration-200 ease-out ${
        hidden
          ? `${hiddenClassName} pointer-events-none opacity-0`
          : "translate-y-0 opacity-100"
      }`}
    >
      {children}
    </div>
  );
}
