"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ScrollHideOnDownProps = {
  children: ReactNode;
  className: string;
  hiddenClassName?: string;
};

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

      if (currentScrollY <= 16) {
        setHidden(false);
      } else if (currentScrollY > lastScrollY.current + 4) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY.current - 4) {
        setHidden(false);
      }

      lastScrollY.current = currentScrollY;
    };

    lastScrollY.current = window.scrollY;
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
