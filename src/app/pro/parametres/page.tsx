import { FounderContactModule } from "@/components/pro/FounderContactModule";
import { InterfaceModule } from "@/components/pro/InterfaceModule";
import { OpenUntilEditor } from "@/components/pro/OpenUntilEditor";
import { Card } from "@/components/ui/Card";
import { PRO_SHOP_ID } from "@/lib/pro-shop";
import { ensureShopDayClosed, getReservations, getShop } from "@/lib/store";
import { zurichParts } from "@/lib/utils";

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
    <div className="mx-auto max-w-lg px-4 py-4">
      <h1 className="mb-1 min-w-0 truncate font-display text-[1.75rem] text-ec-ink">
        {shop.name}
      </h1>
      <p className="mb-6 text-sm font-semibold text-ec-muted">
        Infos et horaires · compte Pro Villeneuve
      </p>

      <div className="space-y-4">
        <Card className="min-w-0 overflow-hidden">
          <h2 className="mb-3 text-base font-extrabold text-ec-ink">
            Commerce
          </h2>
          <div className="flex min-w-0 items-stretch gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-base font-semibold text-ec-ink">
                {shop.address}
              </div>
              <div className="text-sm font-semibold text-ec-muted">
                {shop.zip} {shop.city}
              </div>
              <a
                href={`tel:${shop.phone}`}
                className="mt-2 inline-block text-base font-extrabold text-ec-blue"
              >
                {shop.phone}
              </a>
            </div>
            <div className="flex w-28 shrink-0 flex-col items-center justify-center rounded-[12px] bg-ec-soft px-2 py-3 text-center">
              <span className="text-[11px] font-extrabold leading-tight text-ec-muted">
                Retraits
              </span>
              <span className="text-[11px] font-semibold leading-tight text-ec-muted">
                aujourd’hui
              </span>
              <strong className="mt-1 text-2xl font-black tabular-nums text-ec-ink">
                {pickupsToday}
              </strong>
            </div>
          </div>
        </Card>

        <Card className="box-border min-w-0 overflow-hidden">
          <OpenUntilEditor shopId={PRO_SHOP_ID} initial={shop.openUntil} />
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <h2 className="mb-2 text-base font-extrabold text-ec-ink">
            Abonnement
          </h2>
          <p className="text-sm font-semibold leading-relaxed text-ec-muted">
            CHF 49.90/mois · 1er mois offert
          </p>
          <div
            className={`mt-3 flex min-h-14 items-center justify-between gap-3 rounded-[12px] px-4 py-3 ${
              shop.subscriptionActive
                ? "bg-ec-soft"
                : "border-2 border-ec-red/30 bg-[#FDECEA]"
            }`}
          >
            <span className="min-w-0 font-semibold text-ec-ink">Statut</span>
            <strong
              className={
                shop.subscriptionActive ? "text-ec-green" : "text-ec-red"
              }
            >
              {shop.subscriptionActive ? "Actif" : "Inactif"}
            </strong>
          </div>
          <p className="mt-2 text-xs font-semibold text-ec-muted">
            Géré par le fondateur — non modifiable ici.
          </p>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <InterfaceModule status={tabletStatus} />
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <FounderContactModule shopId={PRO_SHOP_ID} />
        </Card>
      </div>
    </div>
  );
}
