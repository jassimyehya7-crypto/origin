import Link from "next/link";
import { Plus } from "lucide-react";
import { PendingInbox } from "@/components/pro/PendingInbox";
import { ResetDemoButton } from "@/components/ResetDemoButton";
import {
  getMerchantKPIs,
  getOffer,
  getReservations,
} from "@/lib/store";
import {
  PRO_SHOP_CITY,
  PRO_SHOP_ID,
  PRO_SHOP_NAME,
} from "@/lib/pro-shop";

export const dynamic = "force-dynamic";

export default async function ProDashboard() {
  const kpis = await getMerchantKPIs(PRO_SHOP_ID);
  const allResas = await getReservations({ shopId: PRO_SHOP_ID });
  const pending = await Promise.all(
    allResas
      .filter((r) => r.status === "EN_ATTENTE")
      .map(async (r) => ({ ...r, offer: await getOffer(r.offerId) }))
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <div className="mb-5">
        <p className="text-xs font-extrabold uppercase tracking-wide text-ec-muted">
          {PRO_SHOP_NAME} · {PRO_SHOP_CITY}
        </p>
        <h1 className="font-display text-[1.75rem] text-ec-ink">À traiter</h1>
        <p className="text-sm font-semibold text-ec-muted">
          {pending.length} demande{pending.length !== 1 ? "s" : ""} en attente
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {[
          { label: "Offres", value: kpis.active },
          { label: "Aujourd'hui", value: kpis.todayResas },
          { label: "Retraits", value: kpis.picked },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-[16px] border border-ec-rule bg-ec-surface px-3 py-3"
          >
            <div className="text-[10px] font-extrabold uppercase text-ec-muted">
              {k.label}
            </div>
            <div className="mt-0.5 text-2xl font-black text-ec-ink">
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/pro/offres/nouvelle"
        className="mb-6 flex h-14 w-full items-center justify-center gap-2 rounded-[12px] bg-ec-yellow text-base font-extrabold text-ec-ink"
      >
        <Plus className="h-5 w-5" />
        Publier une offre
      </Link>

      <h2 className="mb-3 text-sm font-extrabold text-ec-ink">Demandes</h2>
      <PendingInbox items={pending} />

      <div className="mt-5 flex flex-col gap-2 text-center">
        <Link
          href="/pro/cloture"
          className="rounded-[12px] border border-ec-rule bg-ec-surface px-4 py-3 text-sm font-extrabold text-ec-ink"
        >
          Clôture du soir →
        </Link>
        <Link
          href="/pro/reservations"
          className="text-sm font-extrabold text-ec-blue"
        >
          Toutes les réservations →
        </Link>
      </div>

      <div className="mt-8 flex justify-center opacity-40">
        <ResetDemoButton />
      </div>
    </div>
  );
}
