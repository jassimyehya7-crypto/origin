"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PRO_SHOP_ID } from "@/lib/pro-shop";

interface Reservation {
  id: string;
  clientName: string;
  offerTitle?: string;
  status: string;
  createdAt: string;
}

export function ReservationNotifier() {
  const router = useRouter();
  const knownIdsRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const isInitRef = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then(setPermission);
      }
    }
  }, []);

  // Play notification sound using Web Audio API
  const playSound = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      
      // Play 3 ascending "ding" sounds
      const frequencies = [880, 1100, 1320]; // A5, C#6, E6
      const now = ctx.currentTime;
      
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0, now + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.4, now + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.6);
      });
    } catch {
      // Silently fail if audio not available
    }
  }, []);

  // Vibrate the phone
  const vibrate = useCallback(() => {
    try {
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Show browser notification
  const showNotification = useCallback((res: Reservation) => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        const notif = new Notification("Nouvelle réservation", {
          body: `${res.clientName} a réservé${res.offerTitle ? ` : ${res.offerTitle}` : ""}`,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: `reservation-${res.id}`,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
        });
        notif.onclick = () => {
          window.focus();
          router.push("/pro");
          notif.close();
        };
      } catch {
        // Notification not supported
      }
    }
  }, [router]);

  // Poll for new reservations
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function checkReservations() {
      try {
        const res = await fetch(
          `/api/reservations?shopId=${PRO_SHOP_ID}`,
          { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        const reservations: Reservation[] = Array.isArray(data.reservations) ? data.reservations : [];

        // On first load, just record existing IDs without alerting
        if (!isInitRef.current) {
          reservations.forEach((r) => knownIdsRef.current.add(r.id));
          isInitRef.current = true;
          return;
        }

        // Check for new reservations
        const newOnes = reservations.filter(
          (r) => !knownIdsRef.current.has(r.id) && r.status === "en_attente"
        );

        if (newOnes.length > 0) {
          // Play sound + vibrate + show notification for each new reservation
          playSound();
          vibrate();
          
          newOnes.forEach((r) => {
            showNotification(r);
            knownIdsRef.current.add(r.id);
          });

          // Refresh the page to show new reservations
          router.refresh();
        }

        // Update known IDs
        reservations.forEach((r) => knownIdsRef.current.add(r.id));
      } catch {
        // Silently fail
      }
    }

    // Check immediately, then every 10 seconds
    checkReservations();
    interval = setInterval(checkReservations, 10000);

    return () => clearInterval(interval);
  }, [playSound, vibrate, showNotification, router]);

  // Keep audio context alive (browsers suspend it)
  useEffect(() => {
    const resume = () => {
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
    };
    document.addEventListener("click", resume, { once: true });
    document.addEventListener("touchstart", resume, { once: true });
    return () => {
      document.removeEventListener("click", resume);
      document.removeEventListener("touchstart", resume);
    };
  }, []);

  return null;
}
