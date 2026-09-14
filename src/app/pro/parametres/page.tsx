import { ResetDemoButton } from "@/components/ResetDemoButton";
import { Card } from "@/components/ui/Card";
import { CATEGORY_LABELS, PRICING_NOTE } from "@/lib/labels";
import { PRO_SHOP_ID, PRO_SHOP_NAME } from "@/lib/pro-shop";
import { getShop } from "@/lib/store";
import { VisualMark } from "@/components/VisualMark";

export const dynamic = "force-dynamic";

export default async function ProParametresPage() {
  const shop = (await getShop(PRO_SHOP_ID))!;

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <h1 className="mb-1 text-2xl font-extrabold">Paramètres boutique</h1>
      <p className="mb-6 text-sm text-ec-muted">
        Configuration magasin ({PRO_SHOP_NAME})
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
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-ec-muted">Fermeture</dt>
              <dd className="font-semibold">{shop.openUntil}</dd>
            </div>
            <div>
              <dt className="text-ec-muted">Publié</dt>
              <dd className="font-semibold">{shop.published ? "Oui" : "Non"}</dd>
            </div>
            <div>
              <dt className="text-ec-muted">Support</dt>
              <dd className="font-semibold capitalize">{shop.devicePlan}</dd>
            </div>
            <div>
              <dt className="text-ec-muted">Slug QR</dt>
              <dd className="font-mono text-xs">/q/{shop.slug}</dd>
            </div>
          </dl>
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
