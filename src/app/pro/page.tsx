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
import { Clock, Tag, ShoppingBag, TrendingUp, Plus } from "lucide-react";
import Link from "next/link";

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
  const pendingCount = actionable.filter((r) => r.status === "EN_ATTENTE").length;
  const confirmedCount = actionable.filter((r) => r.status === "CONFIRMEE").length;

  const published = (await getOffers({ shopId: PRO_SHOP_ID })).filter(
    (o) => o.status === "PUBLIEE"
  );
  const offersLive = published.length;

  const todayKey = new Date().toDateString();
  const pickupsToday = allResas.filter(
    (r) =>
      (r.status === "CONFIRMEE" || r.status === "RECUPEREE") &&
      new Date(r.createdAt).toDateString() === todayKey
  ).length;

  return (
    <div className="mx-auto max-w-2xl px-5 py-5">
      {/* Greeting + quick create */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.75rem] leading-tight text-ec-ink">
            Bonjour 👋
          </h1>
          <p className="mt-1 text-sm font-semibold text-ec-muted">
            {dayClosed ? PRO_COPY.dayEnded : PRO_COPY.endsAt(openUntil)}
          </p>
        </div>
        <Link
          href="/pro/offres/nouvelle"
          className="mt-1 flex h-10 items-center gap-1.5 rounded-full bg-ec-yellow px-4 text-sm font-extrabold text-ec-ink shadow-sm transition-all hover:shadow-md active:scale-[0.97]"
          title="Créer une offre"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          <span className="hidden sm:inline">Nouvelle offre</span>
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-ec-rule bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-ec-yellow/30">
            <Clock className="h-4 w-4 text-ec-ink" strokeWidth={2.5} />
          </div>
          <p className="text-2xl font-black tabular-nums text-ec-ink">{pendingCount}</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ec-muted">À traiter</p>
        </div>
        <div className="rounded-2xl border border-ec-rule bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-ec-green/15">
            <ShoppingBag className="h-4 w-4 text-ec-green" strokeWidth={2.5} />
          </div>
          <p className="text-2xl font-black tabular-nums text-ec-ink">{confirmedCount}</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ec-muted">Confirmées</p>
        </div>
        <div className="rounded-2xl border border-ec-rule bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-ec-blue/10">
            <Tag className="h-4 w-4 text-ec-blue" strokeWidth={2.5} />
          </div>
          <p className="text-2xl font-black tabular-nums text-ec-ink">{offersLive}</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ec-muted">Offres live</p>
        </div>
        <div className="rounded-2xl border border-ec-rule bg-white p-4 shadow-sm transition hover:shadow-md">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-ec-soft">
            <TrendingUp className="h-4 w-4 text-ec-muted" strokeWidth={2.5} />
          </div>
          <p className="text-2xl font-black tabular-nums text-ec-ink">{pickupsToday}</p>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ec-muted">Retraits</p>
        </div>
      </div>

      {/* Inbox */}
      <TodayInbox items={actionable} dayClosed={dayClosed} />
    </div>
  );
}
