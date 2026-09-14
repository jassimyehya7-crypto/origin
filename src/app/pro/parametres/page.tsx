import { OpenUntilEditor } from "@/components/pro/OpenUntilEditor";
import { Card } from "@/components/ui/Card";
import { PRICING_NOTE } from "@/lib/labels";
import { PRO_SHOP_ID, PRO_SHOP_NAME } from "@/lib/pro-shop";
import { ensureShopDayClosed, getShop } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ProParametresPage() {
  await ensureShopDayClosed(PRO_SHOP_ID);
  const shop = (await getShop(PRO_SHOP_ID))!;

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <h1 className="mb-1 font-display text-[1.75rem] text-ec-ink">Magasin</h1>
      <p className="mb-6 text-sm font-semibold text-ec-muted">
        Infos et horaires · {PRO_SHOP_NAME}
      </p>

      <div className="space-y-4">
        <Card>
          <div className="space-y-1">
            <div className="text-xl font-extrabold text-ec-ink">{shop.name}</div>
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
        </Card>

        <Card>
          <OpenUntilEditor shopId={PRO_SHOP_ID} initial={shop.openUntil} />
        </Card>

        <Card>
          <h2 className="mb-2 text-base font-extrabold text-ec-ink">
            Abonnement
          </h2>
          <p className="text-sm font-semibold leading-relaxed text-ec-muted">
            {PRICING_NOTE}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-center justify-between gap-3 rounded-[12px] bg-ec-soft px-4 py-3">
              <span className="font-semibold text-ec-ink">Sur votre téléphone</span>
              <strong className="text-ec-green">Gratuit</strong>
            </li>
            <li className="flex items-center justify-between gap-3 rounded-[12px] bg-ec-soft px-4 py-3">
              <span className="font-semibold text-ec-ink">Tablette installée</span>
              <strong className="text-ec-muted">Option</strong>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
