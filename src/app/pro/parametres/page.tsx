import { InterfaceModule } from "@/components/pro/InterfaceModule";
import { OpenUntilEditor } from "@/components/pro/OpenUntilEditor";
import { ShopInfoEditor } from "@/components/pro/ShopInfoEditor";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import { ensureShopDayClosed, getReservations, getShop } from "@/lib/store";
import { zurichParts } from "@/lib/utils";
import { MapPin, Phone, Package, CreditCard, Monitor } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProParametresPage() {
  await ensureShopDayClosed(PRO_SHOP_ID);
  const shop = (await getShop(PRO_SHOP_ID))!;
  const reservations = await getReservations({ shopId: PRO_SHOP_ID });
  const todayKey = zurichParts().dateKey;
  const pickupsToday = reservations.filter((r) => {
    if (r.status !== "RECUPEREE" || !r.pickedUpAt) return false;
    return zurichParts(new Date(r.pickedUpAt)).dateKey === todayKey;
  }).length;

  const tabletStatus =
    shop.tabletRequestStatus === "installed" || shop.devicePlan === "tablette"
      ? "installed"
      : shop.tabletRequestStatus;

  return (
    <div className="mx-auto max-w-2xl px-5 py-5">
      {/* Header with shop avatar */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ec-yellow text-xl font-black text-ec-ink shadow-sm">
          {shop.name.charAt(0)}
        </div>
        <div>
          <h1 className="font-display text-[1.75rem] leading-tight text-ec-ink">
            {shop.name}
          </h1>
          <p className="text-sm font-semibold text-ec-muted">
            Infos et paramètres du commerce
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Commerce info card — editable */}
        <div className="rounded-2xl border border-ec-rule bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-ec-muted" />
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-ec-muted">
              Commerce
            </h2>
          </div>
          <ShopInfoEditor shop={shop} pickupsToday={pickupsToday} />
        </div>

        {/* Horaires card */}
        <div className="rounded-2xl border border-ec-rule bg-white p-5 shadow-sm">
          <OpenUntilEditor shopId={PRO_SHOP_ID} initial={shop.openUntil} />
        </div>

        {/* Abonnement card */}
        <div className="rounded-2xl border border-ec-rule bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-ec-muted" />
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-ec-muted">
              Abonnement
            </h2>
          </div>
          <p className="text-sm font-semibold text-ec-muted">
            CHF 49.90/mois · 1er mois offert
          </p>
          <div
            className={`mt-3 flex items-center justify-between rounded-xl px-4 py-3 ${
              shop.subscriptionActive
                ? "bg-ec-green/10"
                : "bg-ec-red/10"
            }`}
          >
            <span className="text-sm font-bold text-ec-ink">Statut</span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${shop.subscriptionActive ? "bg-ec-green" : "bg-ec-red"}`} />
              <strong className={`text-sm font-extrabold ${shop.subscriptionActive ? "text-ec-green" : "text-ec-red"}`}>
                {shop.subscriptionActive ? "Actif" : "Inactif"}
              </strong>
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold text-ec-muted">
            Géré par le fondateur — non modifiable ici.
          </p>
        </div>

        {/* Interface card */}
        <div className="rounded-2xl border border-ec-rule bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-ec-muted" />
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-ec-muted">
              Interface
            </h2>
          </div>
          <InterfaceModule status={tabletStatus} />
        </div>
      </div>
    </div>
  );
}
