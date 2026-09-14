import { TodayInbox } from "@/components/pro/TodayInbox";
import {
  ensureShopDayClosed,
  getOffer,
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
          Se termine à {openUntil}
        </p>
      </div>

      <TodayInbox items={actionable} dayClosed={dayClosed} />
    </div>
  );
}
