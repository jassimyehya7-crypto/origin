import { notFound } from "next/navigation";
import { getFavorites, getOffer, getShop, incrementOfferViews } from "@/lib/store";
import { OfferDetailClient } from "./OfferDetailClient";

export const dynamic = "force-dynamic";

export default async function OfferPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { reserver?: string };
}) {
  const offer = await getOffer(params.id);
  if (!offer) notFound();
  const shop = await getShop(offer.shopId);
  if (!shop) notFound();
  await incrementOfferViews(params.id);
  const favorites = await getFavorites();
  const fav = favorites.some((f) => f.shopId === shop.id);
  const fresh = (await getOffer(params.id))!;
  const openReserve = searchParams?.reserver === "1";
  return (
    <OfferDetailClient
      offer={fresh}
      shop={shop}
      initialFavorite={fav}
      openReserve={openReserve}
    />
  );
}
