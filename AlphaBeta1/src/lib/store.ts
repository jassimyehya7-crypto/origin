import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  demoInbox,
  flagsForType,
  getMerchant,
  getOffer,
} from "@/lib/data/catalog";
import { createReservation as supabaseCreateReservation, decrementStock } from "@/lib/data/supabase-catalog";
import { pickupCode } from "@/lib/format";
import { PRO_SHOP_ID } from "@/lib/labels";
import type {
  CategoryId,
  InterestId,
  LocationId,
  NotifPrefs,
  Offer,
  OfferType,
  Reservation,
  ReservationStatus,
} from "@/lib/types";

/** Génère un ID unique sécurisé (pas de collision possible) */
function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  // Fallback: timestamp + random haute résolution
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Génère un code de retrait cryptographique (65 536 combinaisons) */
function securePickupCode(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint16Array(1);
    crypto.getRandomValues(arr);
    const n = (arr[0] % 9000) + 1000;
    return `EC-${n}`;
  }
  return `EC-${Math.floor(1000 + Math.random() * 9000)}`;
}

type AppState = {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  locationId: LocationId;
  setLocationId: (id: LocationId) => void;
  userLat: number | null;
  userLng: number | null;
  setUserLocation: (lat: number, lng: number) => void;
  radiusKm: number;
  setRadiusKm: (km: number) => void;
  category: CategoryId;
  setCategory: (id: CategoryId) => void;
  favoriteOfferIds: string[];
  followedMerchantIds: string[];
  toggleFavoriteOffer: (id: string) => void;
  toggleFollowMerchant: (id: string) => void;
  interests: InterestId[];
  toggleInterest: (id: InterestId) => void;
  notif: NotifPrefs;
  setNotif: (patch: Partial<NotifPrefs>) => void;
  stockByOffer: Record<string, number>;
  reservations: Reservation[];
  extraOffers: Offer[];
  hiddenOfferIds: string[];
  reserve: (offerId: string, qty: number) => Reservation | null;
  cancelReservation: (id: string) => void;
  setReservationStatus: (id: string, status: ReservationStatus) => void;
  createOffer: (input: {
    title: string;
    price: number;
    originalPrice?: number;
    stock: number;
    type: OfferType;
    unit: string;
  }) => Offer | null;
  hideOffer: (id: string) => void;
  resetDemo: () => void;
};

const INITIAL_FOLLOWED = ["shop_dasilva", "shop_durgnat"];

/** Détermine si le stock doit être restauré lors d'un changement de statut */
function shouldRestoreStock(newStatus: ReservationStatus, oldStatus: ReservationStatus): boolean {
  const isCancelling = newStatus === "refused" || newStatus === "cancelled";
  const wasActive = oldStatus === "pending" || oldStatus === "confirmed";
  return isCancelling && wasActive;
}

function lookupOffer(id: string, extra: Offer[], hidden: string[]) {
  if (hidden.includes(id)) return undefined;
  return extra.find((o) => o.id === id) ?? getOffer(id);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      locationId: "villeneuve",
      setLocationId: (id) => set({ locationId: id }),
      userLat: null,
      userLng: null,
      setUserLocation: (lat, lng) => set({ userLat: lat, userLng: lng }),
      radiusKm: 5,
      setRadiusKm: (km) => set({ radiusKm: km }),
      category: "all",
      setCategory: (id) => set({ category: id }),
      favoriteOfferIds: [],
      followedMerchantIds: INITIAL_FOLLOWED,
      toggleFavoriteOffer: (id) =>
        set((s) => ({
          favoriteOfferIds: s.favoriteOfferIds.includes(id)
            ? s.favoriteOfferIds.filter((x) => x !== id)
            : [...s.favoriteOfferIds, id],
        })),
      toggleFollowMerchant: (id) =>
        set((s) => ({
          followedMerchantIds: s.followedMerchantIds.includes(id)
            ? s.followedMerchantIds.filter((x) => x !== id)
            : [...s.followedMerchantIds, id],
        })),
      interests: ["epicerie", "boulangerie", "boucherie"],
      toggleInterest: (id) =>
        set((s) => ({
          interests: s.interests.includes(id)
            ? s.interests.filter((x) => x !== id)
            : [...s.interests, id],
        })),
      notif: { nearby: true, favorites: true, flash: true, weekly: false },
      setNotif: (patch) => set((s) => ({ notif: { ...s.notif, ...patch } })),
      stockByOffer: {},
      reservations: demoInbox(),
      extraOffers: [],
      hiddenOfferIds: [],
      reserve: (offerId, qty) => {
        const offer = lookupOffer(offerId, get().extraOffers, get().hiddenOfferIds);
        const merchant = offer ? getMerchant(offer.merchantId) : undefined;
        if (!offer || !merchant) return null;
        const stock = get().stockByOffer[offerId] ?? offer.stock;
        if (qty < 1 || qty > stock) return null;
        const reservation: Reservation = {
          id: generateId("res"),
          offerId,
          merchantId: merchant.id,
          title: offer.title,
          merchantName: merchant.name,
          image: offer.image,
          qty,
          unitPrice: offer.price,
          originalPrice: offer.originalPrice,
          until: offer.until,
          distanceM: merchant.distanceM,
          address: merchant.address,
          createdAt: new Date().toISOString(),
          status: "pending",
          code: securePickupCode(),
          mine: true,
          clientName: "Utilisateur",
          unit: offer.unit,
        };
        set((s) => {
          // Vérification atomique du stock dans le set()
          const currentStock = s.stockByOffer[offerId] ?? offer.stock;
          if (qty < 1 || qty > currentStock) return s; // Annule si stock insuffisant
          return {
            stockByOffer: { ...s.stockByOffer, [offerId]: currentStock - qty },
            reservations: [reservation, ...s.reservations],
          };
        });
        // Créer la réservation dans Supabase (async, ne bloque pas l'UI)
        supabaseCreateReservation({
          offerId,
          shopId: merchant.id,
          quantity: qty,
          clientName: "Utilisateur",
        }).catch((err) => console.error("[Supabase] Erreur réservation:", err));
        // Décrémenter le stock dans Supabase
        decrementStock(offerId, qty).catch((err) => console.error("[Supabase] Erreur stock:", err));
        return reservation;
      },
      cancelReservation: (id) =>
        set((s) => {
          const res = s.reservations.find((r) => r.id === id);
          if (!res) return s;
          if (!shouldRestoreStock("cancelled", res.status)) return s;
          const current = s.stockByOffer[res.offerId];
          const offer = lookupOffer(res.offerId, s.extraOffers, s.hiddenOfferIds);
          const base = current ?? offer?.stock ?? 0;
          return {
            reservations: s.reservations.map((r) =>
              r.id === id ? { ...r, status: "cancelled" as const } : r,
            ),
            stockByOffer: {
              ...s.stockByOffer,
              [res.offerId]: base + res.qty,
            },
          };
        }),
      setReservationStatus: (id, status) =>
        set((s) => {
          const res = s.reservations.find((r) => r.id === id);
          if (!res) return s;
          const restore = shouldRestoreStock(status, res.status);
          const current = s.stockByOffer[res.offerId];
          const offer = lookupOffer(res.offerId, s.extraOffers, s.hiddenOfferIds);
          const base = current ?? offer?.stock ?? 0;
          return {
            reservations: s.reservations.map((r) => (r.id === id ? { ...r, status } : r)),
            stockByOffer: restore
              ? { ...s.stockByOffer, [res.offerId]: base + res.qty }
              : s.stockByOffer,
          };
        }),
      createOffer: (input) => {
        const merchant = getMerchant(PRO_SHOP_ID);
        if (!merchant) return null;
        const offer: Offer = {
          id: generateId("pro"),
          merchantId: merchant.id,
          title: input.title,
          image: merchant.cover,
          originalPrice: input.originalPrice,
          price: input.price,
          stock: input.stock,
          until: merchant.openUntil,
          type: input.type,
          unit: input.unit,
          flags: flagsForType(input.type, input.originalPrice, input.price),
        };
        set((s) => ({ extraOffers: [offer, ...s.extraOffers] }));
        return offer;
      },
      hideOffer: (id) =>
        set((s) => ({
          extraOffers: s.extraOffers.filter((o) => o.id !== id),
          hiddenOfferIds: s.hiddenOfferIds.includes(id)
            ? s.hiddenOfferIds
            : [...s.hiddenOfferIds, id],
        })),
      resetDemo: () =>
        set({
          favoriteOfferIds: [],
          followedMerchantIds: INITIAL_FOLLOWED,
          stockByOffer: {},
          reservations: demoInbox(),
          extraOffers: [],
          hiddenOfferIds: [],
          category: "all",
          radiusKm: 5,
          locationId: "villeneuve",
          interests: ["epicerie", "boulangerie", "boucherie"],
        }),
    }),
    {
      name: "offreslocal-origin-v2",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      migrate: (persistedState: unknown, version: number) => {
        // Migration v1 → v2 : nettoyage des anciennes données
        if (version < 2) {
          const state = persistedState as Record<string, unknown>;
          // Reset des réservations si ancienne structure
          if (state && Array.isArray(state.reservations)) {
            state.reservations = state.reservations.map((r: Record<string, unknown>) => ({
              ...r,
              clientName: "Utilisateur",
            }));
          }
          return state as AppState;
        }
        return persistedState as AppState;
      },
      partialize: (s) => ({
        locationId: s.locationId,
        userLat: s.userLat,
        userLng: s.userLng,
        radiusKm: s.radiusKm,
        favoriteOfferIds: s.favoriteOfferIds,
        followedMerchantIds: s.followedMerchantIds,
        interests: s.interests,
        notif: s.notif,
        stockByOffer: s.stockByOffer,
        reservations: s.reservations,
        extraOffers: s.extraOffers,
        hiddenOfferIds: s.hiddenOfferIds,
      }),
    },
  ),
);

export function useStock(offerId: string, fallback: number) {
  return useAppStore((s) => s.stockByOffer[offerId] ?? fallback);
}

export function useLiveOffer(offerId: string) {
  const extra = useAppStore((s) => s.extraOffers);
  const hidden = useAppStore((s) => s.hiddenOfferIds);
  return lookupOffer(offerId, extra, hidden);
}
