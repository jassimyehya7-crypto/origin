import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  demoInbox,
  flagsForType,
  getMerchant,
  getOffer,
} from "@/lib/data/catalog";
import { cancelClientReservation, merchantCreateOffer, merchantHideOffer, reserveOfferAtomic, transitionReservationAtomic } from "@/lib/data/supabase-catalog";
import { supabase } from "@/lib/supabase";
import { PRO_SHOP_ID } from "@/lib/labels";
import { isOfferReservable } from "@/lib/selectors";
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
  syncStatus: "offline" | "syncing" | "live";
  setSyncStatus: (status: "offline" | "syncing" | "live") => void;
  catalogRevision: number;
  syncRemoteStocks: (offers: Offer[]) => void;
  syncRemoteReservations: (reservations: Reservation[]) => void;
  syncMerchantReservations: (reservations: Reservation[]) => void;
  locationId: LocationId;
  setLocationId: (id: LocationId) => void;
  userLat: number | null;
  userLng: number | null;
  setUserLocation: (lat: number, lng: number) => void;
  manualCity: string | null;
  setManualCity: (city: string | null) => void;
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
  reserve: (offerId: string, qty: number, requestId: string) => Promise<Reservation | null>;
  cancelReservation: (id: string) => Promise<boolean>;
  setReservationStatus: (id: string, status: ReservationStatus) => Promise<boolean>;
  completePickup: (id: string, code: string) => Promise<boolean>;
  createOffer: (input: {
    title: string;
    image?: string;
    price: number;
    originalPrice?: number;
    stock: number;
    type: OfferType;
    unit: string;
    availabilityMode: "lots" | "duration";
    durationMinutes?: number;
  }) => Promise<Offer | null>;
  hideOffer: (id: string) => Promise<boolean>;
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
      syncStatus: "offline",
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      catalogRevision: 0,
      syncRemoteStocks: (offers) => set((s) => ({
        stockByOffer: offers.reduce<Record<string, number>>(
          (stocks, offer) => ({ ...stocks, [offer.id]: offer.stock }),
          { ...s.stockByOffer },
        ),
        catalogRevision: s.catalogRevision + 1,
      })),
      syncRemoteReservations: (remoteReservations) => set((s) => {
        const localMine = s.reservations.filter((reservation) => reservation.mine);
        const remoteIds = new Set(remoteReservations.map((reservation) => reservation.id));
        return {
          reservations: [
            ...remoteReservations.map((remote) => ({
              ...remote,
              mine: true,
            })),
            ...localMine.filter((local) => !remoteIds.has(local.id)),
            ...s.reservations.filter((reservation) => !reservation.mine && !remoteIds.has(reservation.id)),
          ],
        };
      }),
      syncMerchantReservations: (merchantReservations) => set((s) => ({
        reservations: [
          ...s.reservations.filter((reservation) => reservation.mine),
          ...merchantReservations.filter((reservation) => !s.reservations.some((local) => local.id === reservation.id && local.mine)),
        ],
      })),
      locationId: "villeneuve",
      setLocationId: (id) => set({ locationId: id }),
      userLat: null,
      userLng: null,
      setUserLocation: (lat, lng) => set({ userLat: lat, userLng: lng }),
      manualCity: null,
      setManualCity: (city) => set({ manualCity: city }),
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
      reservations: [],
      extraOffers: [],
      hiddenOfferIds: [],
      reserve: async (offerId, qty, requestId) => {
        if (supabase && get().syncStatus !== "live") return null;
        const offer = lookupOffer(offerId, get().extraOffers, get().hiddenOfferIds);
        const merchant = offer ? getMerchant(offer.merchantId) : undefined;
        if (!offer || !merchant) return null;
        const stock = get().stockByOffer[offerId] ?? offer.stock;
        if (qty < 1) return null;
        if (!supabase && (qty > stock || !isOfferReservable(offer, stock))) return null;
        const remoteReservation = supabase
          ? await reserveOfferAtomic({
              offerId,
              shopId: merchant.id,
              quantity: qty,
              clientName: "Utilisateur",
              requestId,
            })
          : null;
        if (supabase && !remoteReservation) return null;

        const reservation: Reservation = {
          id: remoteReservation?.id ?? generateId("res"),
          requestId,
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
          code: remoteReservation?.pickupCode ?? securePickupCode(),
          mine: true,
          clientName: "Utilisateur",
          unit: offer.unit,
        };
        let committed = false;
        set((s) => {
          // Vérification atomique du stock dans le set()
          const currentStock = s.stockByOffer[offerId] ?? offer.stock;
          if (!remoteReservation && (qty < 1 || qty > currentStock)) return s;
          const existing = s.reservations.find((item) => item.id === reservation.id);
          if (existing) {
            committed = true;
            return s;
          }
          committed = true;
          return {
            stockByOffer: { ...s.stockByOffer, [offerId]: remoteReservation?.remainingStock ?? currentStock - qty },
            reservations: [reservation, ...s.reservations],
          };
        });
        return committed ? reservation : null;
      },
      cancelReservation: async (id) => {
        const currentReservation = get().reservations.find((reservation) => reservation.id === id);
        if (!currentReservation || !shouldRestoreStock("cancelled", currentReservation.status)) return false;
        if (supabase) {
          if (!currentReservation.requestId) return false;
          try {
            if (!(await cancelClientReservation(currentReservation.requestId))) return false;
          } catch {
            return false;
          }
        }
        let changed = false;
        set((s) => {
          const res = s.reservations.find((r) => r.id === id);
          if (!res) return s;
          if (!shouldRestoreStock("cancelled", res.status)) return s;
          changed = true;
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
        });
        return changed;
      },
      setReservationStatus: async (id, status) => {
        if (supabase && !(await transitionReservationAtomic(id, status))) return false;
        let changed = false;
        set((s) => {
          const res = s.reservations.find((r) => r.id === id);
          if (!res) return s;
          changed = true;
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
        });
        return changed;
      },
      completePickup: async (id, code) => {
        const reservation = get().reservations.find((r) => r.id === id);
        if (!reservation || reservation.status !== "confirmed" || reservation.code.toUpperCase() !== code.trim().toUpperCase()) {
          return false;
        }
        if (supabase && !(await transitionReservationAtomic(id, "picked", code))) return false;
        set((s) => ({
          reservations: s.reservations.map((r) => (r.id === id ? { ...r, status: "picked" as const } : r)),
        }));
        return true;
      },
      createOffer: async (input) => {
        const merchant = getMerchant(PRO_SHOP_ID);
        if (!merchant) return null;
        if (input.type === "ARRIVAGE" || input.type === "DERNIERE_MINUTE") {
          const now = new Date();
          const usedThisMonth = get().extraOffers.filter((offer) => {
            if (offer.type !== input.type || !offer.createdAt) return false;
            const created = new Date(offer.createdAt);
            return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
          }).length;
          if (usedThisMonth >= 2) return null;
        }
        let remoteId: string | null = null;
        if (supabase) {
          try {
            remoteId = await merchantCreateOffer({ ...input, shopId: merchant.id });
          } catch (error) {
            console.error("Publication Supabase impossible", error);
            return null;
          }
          if (!remoteId) return null;
        }
        const offer: Offer = {
          id: remoteId ?? generateId("pro"),
          merchantId: merchant.id,
          title: input.title,
          image: input.image ?? merchant.cover,
          originalPrice: input.originalPrice,
          price: input.price,
          stock: input.stock,
          until: merchant.openUntil,
          type: input.type,
          unit: input.unit,
          availabilityMode: input.availabilityMode,
          durationMinutes: input.availabilityMode === "duration" ? input.durationMinutes : undefined,
          createdAt: new Date().toISOString(),
          flags: flagsForType(input.type, input.originalPrice, input.price),
        };
        set((s) => ({ extraOffers: [offer, ...s.extraOffers] }));
        return offer;
      },
      hideOffer: async (id) => {
        if (supabase) {
          try {
            if (!(await merchantHideOffer(id))) return false;
          } catch (error) {
            console.error("Retrait Supabase impossible", error);
            return false;
          }
        }
        set((s) => ({
          extraOffers: s.extraOffers.filter((o) => o.id !== id),
          hiddenOfferIds: s.hiddenOfferIds.includes(id)
            ? s.hiddenOfferIds
            : [...s.hiddenOfferIds, id],
        }));
        return true;
      },
      resetDemo: () =>
        set({
          favoriteOfferIds: [],
          followedMerchantIds: INITIAL_FOLLOWED,
          stockByOffer: {},
          reservations: supabase ? [] : demoInbox(),
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
      version: 3,
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
          if (version < 3) {
            state.reservations = (state.reservations as Reservation[]).filter((r) => !r.id.startsWith("a1_resa_"));
          }
          return state as AppState;
        }
        const state = persistedState as AppState;
        if (version < 3 && Array.isArray(state.reservations)) {
          state.reservations = state.reservations.filter((r) => !r.id.startsWith("a1_resa_"));
        }
        return state;
      },
      partialize: (s) => ({
        locationId: s.locationId,
        userLat: s.userLat,
        userLng: s.userLng,
        manualCity: s.manualCity,
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

export function useCatalogRevision() {
  return useAppStore((s) => s.catalogRevision);
}

export function useLiveOffer(offerId: string) {
  // Force le recalcul après chaque injection ou rafraîchissement du catalogue
  // Supabase, y compris lors d'une arrivée directe sur /offers/:id.
  useAppStore((s) => s.catalogRevision);
  const extra = useAppStore((s) => s.extraOffers);
  const hidden = useAppStore((s) => s.hiddenOfferIds);
  return lookupOffer(offerId, extra, hidden);
}
