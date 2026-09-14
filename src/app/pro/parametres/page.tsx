import { ResetDemoButton } from "@/components/ResetDemoButton";
import { OpenUntilEditor } from "@/components/pro/OpenUntilEditor";
import { Card } from "@/components/ui/Card";
import { VisualMark } from "@/components/VisualMark";
import { CATEGORY_LABELS, PRICING_NOTE } from "@/lib/labels";
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
        {PRO_SHOP_NAME}
      </p>

      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-3">
            <VisualMark label={shop.name} stored={shop.emoji} size="xl" />
            <div>
              <div className="text-lg font-bold">{shop.name}</div>
              <div className="text-sm text-ec-muted">
                {CATEGORY_LABELS[shop.category]} · {shop.address}, {shop.zip}{" "}
                {shop.city}
              </div>
              <div className="text-sm text-ec-muted">{shop.phone}</div>
            </div>
          </div>
        </Card>

        <Card>
          <OpenUntilEditor shopId={PRO_SHOP_ID} initial={shop.openUntil} />
        </Card>

        <Card>
          <h2 className="mb-2 font-bold">Abonnement</h2>
          <p className="text-sm text-ec-muted">{PRICING_NOTE}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between rounded-xl bg-ec-soft px-3 py-2">
              <span>Téléphone (outil sur votre mobile)</span>
              <strong className="text-ec-green">Gratuit</strong>
            </li>
            <li className="flex justify-between rounded-xl bg-gray-50 px-3 py-2">
              <span>Tablette installée</span>
              <strong>Option payante</strong>
            </li>
          </ul>
        </Card>

        <div className="flex justify-center pt-2 opacity-40">
          <ResetDemoButton />
        </div>
      </div>
    </div>
  );
}
