import Link from "next/link";
import { ResetDemoButton } from "@/components/ResetDemoButton";
import { OfferTypeBadge } from "@/components/StatusBadge";
import { CATEGORY_LABELS } from "@/lib/labels";
import { getFounderStats } from "@/lib/store";
import { formatDateTime, formatCHF } from "@/lib/utils";
import { LiveCounter } from "./LiveCounter";

export const dynamic = "force-dynamic";

export default async function FondateurPage() {
  const stats = await getFounderStats();

  return (
    <div className="mx-auto max-w-lg px-4 py-5 lg:max-w-4xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.75rem] text-ec-ink">
            Pilotage
          </h1>
          <p className="text-sm font-semibold text-ec-muted">
            Villeneuve · live technique
          </p>
        </div>
        <ResetDemoButton />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <LiveCounter initial={stats.liveClients} />
        </div>
        <div className="rounded-[20px] border border-ec-rule bg-ec-surface p-4">
          <div className="text-[10px] font-extrabold uppercase text-ec-muted">
            Commerces
          </div>
          <div className="mt-1 text-3xl font-black text-ec-ink">
            {stats.publishedShops}
            <span className="text-base font-bold text-ec-muted">
              /{stats.shopsCount}
            </span>
          </div>
          <div className="text-[11px] font-semibold text-ec-muted">
            publiés / total
          </div>
        </div>
        <div className="rounded-[20px] border border-ec-rule bg-ec-surface p-4">
          <div className="text-[10px] font-extrabold uppercase text-ec-muted">
            Offres / résas J
          </div>
          <div className="mt-1 text-3xl font-black text-ec-ink">
            {stats.offersToday}
            <span className="text-base font-bold text-ec-muted">
              {" "}
              / {stats.reservationsToday}
            </span>
          </div>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-extrabold text-ec-ink">
          Funnel QR
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Scans", value: stats.funnel.scans },
            { label: "Sans réserver", value: stats.funnel.browsedNoReserve },
            { label: "Résas", value: stats.funnel.reservations },
            { label: "Retraits", value: stats.funnel.pickups },
          ].map((s, i) => (
            <div
              key={s.label}
              className="rounded-[16px] border border-ec-rule bg-ec-surface p-3"
            >
              <div className="text-[10px] font-extrabold uppercase text-ec-muted">
                {i + 1}. {s.label}
              </div>
              <div className="text-2xl font-black text-ec-ink">{s.value}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 font-mono text-[11px] font-semibold text-ec-muted">
          {stats.funnel.scans} → {stats.funnel.browsedNoReserve} →{" "}
          {stats.funnel.reservations} → {stats.funnel.pickups}
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-extrabold text-ec-ink">
          Commerces · statut publication
        </h2>
        <div className="space-y-3">
          {stats.perShop.map((row) => (
            <div
              key={row.shop.id}
              className="rounded-[20px] border border-ec-rule bg-ec-surface p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-extrabold text-ec-ink">
                    {row.shop.emoji} {row.shop.name}
                  </p>
                  <p className="text-[11px] font-semibold text-ec-muted">
                    {CATEGORY_LABELS[row.shop.category]} · {row.shop.devicePlan}
                  </p>
                </div>
                {row.published ? (
                  <span className="rounded-full bg-ec-soft px-2 py-0.5 text-[10px] font-extrabold text-ec-green">
                    Publié
                  </span>
                ) : (
                  <span className="rounded-full bg-ec-paper px-2 py-0.5 text-[10px] font-extrabold text-ec-muted">
                    Non publié
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                {[
                  ["offres/sem", row.offersWeek],
                  ["résas", row.reservations],
                  ["conf", `${row.confirmationRate}%`],
                  ["retrait", `${row.pickupRate}%`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-sm font-black text-ec-ink">{v}</div>
                    <div className="text-[9px] font-bold uppercase text-ec-muted">
                      {k}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 font-mono text-[10px] font-semibold text-ec-muted">
                QR {row.funnel.scans} → {row.funnel.browsedNoReserve} →{" "}
                {row.funnel.reservations} → {row.funnel.pickups}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-extrabold text-ec-ink">Alertes</h2>
        <div className="space-y-2">
          {stats.alerts.map((a) => (
            <div
              key={a.id}
              className={`rounded-[16px] border p-3 text-sm ${
                a.type === "warning"
                  ? "border-amber-200 bg-amber-50"
                  : a.type === "success"
                    ? "border-green-200 bg-ec-soft"
                    : "border-ec-rule bg-ec-surface"
              }`}
            >
              <div className="font-extrabold text-ec-ink">{a.title}</div>
              <div className="text-xs font-semibold text-ec-muted">
                {a.message}
              </div>
              <div className="mt-1 text-[10px] font-semibold text-ec-muted">
                {formatDateTime(a.createdAt)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-extrabold text-ec-ink">
          Publications récentes
        </h2>
        <div className="space-y-3">
          {stats.recentPublications.map((o) => (
            <Link
              key={o.id}
              href={`/offre/${o.id}`}
              className="flex gap-3 rounded-[20px] border border-ec-rule bg-ec-surface p-3"
            >
              <div className="text-3xl">{o.emoji}</div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate font-extrabold text-ec-ink">
                    {o.title}
                  </span>
                  <OfferTypeBadge type={o.type} />
                </div>
                <div className="text-xs font-semibold text-ec-muted">
                  {o.shopName}
                </div>
                <div className="text-xs font-semibold text-ec-muted">
                  {formatCHF(o.price)} · {o.quantityLeft}/{o.quantityTotal} ·{" "}
                  {o.publishedAt ? formatDateTime(o.publishedAt) : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
