import { CreateOfferForm } from "./CreateOfferForm";
import { PRO_SHOP_ID } from "@/lib/pro-shop";

export const dynamic = "force-dynamic";

export default function NouvelleOffrePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <h1 className="font-display text-[1.75rem] text-ec-ink">Nouvelle offre</h1>
      <p className="mb-6 text-sm font-semibold text-ec-muted">
        Titre, prix, limite et type — publié tout de suite.
      </p>
      <CreateOfferForm defaultShopId={PRO_SHOP_ID} />
    </div>
  );
}
