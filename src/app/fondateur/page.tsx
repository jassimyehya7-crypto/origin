import Link from "next/link";
import { ResetDemoButton } from "@/components/ResetDemoButton";
import { FounderMessagesSection } from "@/components/fondateur/FounderMessagesSection";
import { ShopOpsControls } from "@/components/fondateur/ShopOpsControls";
import { ShopsDropdown, type ShopListItem, type ShopStatus } from "@/components/fondateur/ShopsDropdown";
import { CATEGORY_LABELS } from "@/lib/labels";
import { getFounderMessages, getFounderStats, getShops, getOffers } from "@/lib/store";
import { formatDateTime, formatCHF } from "@/lib/utils";
import { LiveCounter } from "./LiveCounter";
import { PlusCircle, Store, ShoppingBag, MessageCircle, Tablet, TrendingUp, Users, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

function getShopStatus(shop: { subscriptionActive: boolean; published: boolean; createdAt?: string }, offersCount: number): ShopStatus {
  if (shop.subscriptionActive) return "active";
  // If published but no subscription active → check if trial (recent) or unpaid
  if (shop.published && offersCount > 0) {
    // Consider shops with activity but no active sub as unpaid (after trial)
    // For now, default to trial for all since it's launch phase
    return "trial";
  }
  return "trial";
}

export default async function FondateurPage() {
  const [stats, shops, founderMessages, allOffers] = await Promise.all([
    getFounderStats(),
    getShops(),
    getFounderMessages(),
    getOffers(),
  ]);

  const activeOffers = allOffers.filter(o => o.status === "PUBLIEE").length;
  const publishedShops = shops.filter(s => s.published).length;

  // Build shop list with status
  const shopList: ShopListItem[] = shops.map((s) => {
    const offersCount = allOffers.filter(o => o.shopId === s.id).length;
    return {
      id: s.id,
      name: s.name,
      status: getShopStatus(s, offersCount),
    };
  });

  const tabletRequests = shops
    .filter(
      (s) =>
        s.tabletRequestStatus === "pending" ||
        s.tabletRequestStatus === "approved"
    )
    .sort((a, b) => {
      const ta = a.tabletRequestedAt || "";
      const tb = b.tabletRequestedAt || "";
      return tb.localeCompare(ta);
    });

  return (
    <div className="mx-auto max-w-lg px-4 py-5 lg:max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.75rem] text-ec-ink">
            Tableau de bord
          </h1>
          <p className="text-sm font-semibold text-ec-muted">
            OffresLocal · Villeneuve
          </p>
        </div>
        <ResetDemoButton />
      </div>

      {/* KPIs principaux */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-ec-rule bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-ec-blue" />
            <span className="text-[10px] font-extrabold uppercase text-ec-muted">
              Clients connectés
            </span>
          </div>
          <div className="mt-2">
            <LiveCounter initial={stats.liveClients} />
          </div>
        </div>

        <ShopsDropdown shops={shopList} published={publishedShops} total={shops.length} />

        <div className="rounded-2xl border border-ec-rule bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-ec-yellow" />
            <span className="text-[10px] font-extrabold uppercase text-ec-muted">
              Offres actives
            </span>
          </div>
          <div className="mt-2 text-3xl font-black text-ec-ink">
            {activeOffers}
          </div>
          <p className="mt-1 text-[11px] font-semibold text-ec-muted">
            en ligne maintenant
          </p>
        </div>

        <div className="rounded-2xl border border-ec-rule bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-ec-ink" />
            <span className="text-[10px] font-extrabold uppercase text-ec-muted">
              Réservations J
            </span>
          </div>
          <div className="mt-2 text-3xl font-black text-ec-ink">
            {stats.reservationsToday}
          </div>
          <p className="mt-1 text-[11px] font-semibold text-ec-muted">
            aujourd'hui
          </p>
        </div>
      </div>

      {/* Créer un profil commerçant */}
      <div className="mb-6">
        <div className="rounded-2xl border-2 border-dashed border-ec-blue bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <PlusCircle className="mt-0.5 h-5 w-5 text-ec-blue" />
            <div className="flex-1">
              <h2 className="text-sm font-extrabold text-ec-ink">
                Inscrire un nouveau commerce
              </h2>
              <p className="mt-1 text-xs font-semibold text-ec-muted">
                Crée le profil d'un commerçant et configure son abonnement
              </p>
              <button
                type="button"
                disabled
                className="mt-3 flex h-10 items-center gap-2 rounded-xl bg-ec-blue px-4 text-sm font-extrabold text-white opacity-50"
              >
                <PlusCircle className="h-4 w-4" />
                Créer un profil (bientôt disponible)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages des commerçants */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-ec-ink" />
          <h2 className="text-sm font-extrabold text-ec-ink">
            Messages des commerçants
          </h2>
        </div>
        <FounderMessagesSection messages={founderMessages} />
      </div>

      {/* Demandes tablette */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <Tablet className="h-4 w-4 text-ec-ink" />
          <h2 className="text-sm font-extrabold text-ec-ink">
            Demandes de tablette
          </h2>
        </div>
        {tabletRequests.length === 0 ? (
          <div className="rounded-2xl border border-ec-rule bg-white p-4 text-sm font-semibold text-ec-muted shadow-sm">
            Aucune demande en cours
          </div>
        ) : (
          <div className="space-y-3">
            {tabletRequests.map((shop) => (
              <div
                key={shop.id}
                className="rounded-2xl border border-ec-rule bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-ec-ink">
                      {shop.name}
                    </p>
                    <p className="text-[11px] font-semibold text-ec-muted">
                      {shop.address} · {shop.city}
                    </p>
                    {shop.tabletRequestedAt && (
                      <p className="mt-1 text-[11px] font-semibold text-ec-muted">
                        Demandée {formatDateTime(shop.tabletRequestedAt)}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-ec-soft px-2 py-0.5 text-[10px] font-extrabold uppercase text-ec-muted">
                    {shop.tabletRequestStatus === "approved"
                      ? "Validée"
                      : "En attente"}
                  </span>
                </div>
                <ShopOpsControls shop={shop} />
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Alertes */}
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-ec-ink" />
          <h2 className="text-sm font-extrabold text-ec-ink">Alertes</h2>
        </div>
        <div className="space-y-2">
          {stats.alerts.length === 0 ? (
            <div className="rounded-2xl border border-ec-rule bg-white p-4 text-sm font-semibold text-ec-muted shadow-sm">
              Aucune alerte
            </div>
          ) : (
            stats.alerts.map((a) => (
              <div
                key={a.id}
                className={`rounded-2xl border p-3 text-sm shadow-sm ${
                  a.type === "warning"
                    ? "border-amber-200 bg-amber-50"
                    : a.type === "success"
                      ? "border-green-200 bg-ec-soft"
                      : "border-ec-rule bg-white"
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
