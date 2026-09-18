import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateOfferForm } from "./CreateOfferForm";
import { PRO_SHOP_ID } from "@/lib/pro-shop";

export const dynamic = "force-dynamic";

export default function NouvelleOffrePage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-5">
      {/* Back button */}
      <Link
        href="/pro/offres"
        className="mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ec-muted transition hover:bg-ec-soft hover:text-ec-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux offres
      </Link>

      <h1 className="font-display text-[1.75rem] leading-tight text-ec-ink">Nouvelle offre</h1>
      <p className="mb-6 text-sm font-semibold text-ec-muted">
        Titre, prix, limite et type — publié tout de suite.
      </p>
      <CreateOfferForm defaultShopId={PRO_SHOP_ID} />
    </div>
  );
}
