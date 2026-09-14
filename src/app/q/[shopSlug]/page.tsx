import { notFound } from "next/navigation";
import { getOffers, getShopBySlug } from "@/lib/store";
import { QrClient } from "./QrClient";

export const dynamic = "force-dynamic";

export default async function QrPage({ params }: { params: { shopSlug: string } }) {
  const shop = await getShopBySlug(params.shopSlug);
  if (!shop) notFound();
  const offers = await getOffers({ shopId: shop.id, publishedOnly: true });
  return <QrClient shop={shop} offers={offers} />;
}
