import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  demoInbox,
  flagsForType,
  getMerchant,
  getOffer,
} from "@/lib/data/catalog";
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

type AppState = {
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  locationId: LocationId;
  setLocationId: (id: LocationId) => void;
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
          id: `res-${Date.now()}`,
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
          code: pickupCode(),
          mine: true,
          clientName: "Camille",
          unit: offer.unit,
        };
        set((s) => ({
          stockByOffer: { ...s.stockByOffer, [offerId]: stock - qty },
          reservations: [reservation, ...s.reservations],
        }));
        return reservation;
      },
      cancelReservation: (id) =>
        set((s) => {
          const res = s.reservations.find((r) => r.id === id);
          if (!res || (res.status !== "pending" && res.status !== "confirmed")) return s;
          const current = s.stockByOffer[res.offerId];
          const offer = lookupOffer(res.offerId, s.extraOffers, s.hiddenOfferIds);
          const base = current ?? offer?.stock ?? res.qty;
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
          const restore =
            (status === "refused" || status === "cancelled") &&
            (res.status === "pending" || res.status === "confirmed");
          const current = s.stockByOffer[res.offerId];
          const offer = lookupOffer(res.offerId, s.extraOffers, s.hiddenOfferIds);
          const base = current ?? offer?.stock ?? res.qty;
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
          id: `pro_${Date.now()}`,
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
      name: "offreslocal-origin-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        locationId: s.locationId,
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
