import { TodayInbox } from "@/components/pro/TodayInbox";
import { PRO_COPY } from "@/lib/labels";
import {
  ensureShopDayClosed,
  getOffer,
  getOffers,
  getReservations,
  getShop,
} from "@/lib/store";
import {
  PRO_SHOP_CITY,
  PRO_SHOP_ID,
  PRO_SHOP_NAME,
} from "@/lib/pro-shop";
import { isPastShopClosing } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function ProDashboard() {
  await ensureShopDayClosed(PRO_SHOP_ID);
  const shop = await getShop(PRO_SHOP_ID);
  const openUntil = shop?.openUntil || "19:00";
  const dayClosed = isPastShopClosing(openUntil);

  const allResas = await getReservations({ shopId: PRO_SHOP_ID });
  const actionable = await Promise.all(
    allResas
      .filter((r) => r.status === "EN_ATTENTE" || r.status === "CONFIRMEE")
      .map(async (r) => ({ ...r, offer: await getOffer(r.offerId) }))
  );
  const toTreat = actionable.length;

  const published = (await getOffers({ shopId: PRO_SHOP_ID })).filter(
    (o) => o.status === "PUBLIEE"
  );
  const stockLive = published.reduce((sum, o) => sum + o.quantityLeft, 0);

  const todayKey = new Date().toDateString();
  const pickupsToday = allResas.filter(
    (r) =>
      (r.status === "CONFIRMEE" || r.status === "RECUPEREE") &&
      new Date(r.createdAt).toDateString() === todayKey
  ).length;

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <div className="mb-5">
        <p className="text-xs font-extrabold uppercase tracking-wide text-ec-muted">
          {PRO_SHOP_NAME} · {PRO_SHOP_CITY}
        </p>
        <h1 className="font-display text-[1.75rem] text-ec-ink">Aujourd&apos;hui</h1>
        <p className="text-sm font-semibold text-ec-muted">
          {toTreat} à traiter
        </p>
        <p className="mt-1 text-xs font-semibold text-ec-muted">
          {dayClosed ? PRO_COPY.dayEnded : PRO_COPY.endsAt(openUntil)}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-ec-rule bg-ec-soft px-2.5 py-1 text-[11px] font-bold text-ec-muted">
            Stock live · {stockLive}
          </span>
          <span className="inline-flex items-center rounded-full border border-ec-rule bg-ec-soft px-2.5 py-1 text-[11px] font-bold text-ec-muted">
            Retraits du jour · {pickupsToday}
          </span>
        </div>
      </div>

      <TodayInbox items={actionable} dayClosed={dayClosed} />
    </div>
  );
}
