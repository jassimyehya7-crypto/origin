import { Suspense } from "react";
import { StaffLoginForm } from "@/components/StaffLoginForm";

export const dynamic = "force-dynamic";

export default function FondateurLoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Chargement…</p>}>
      <StaffLoginForm
        role="fondateur"
        title="Espace fondateur"
        subtitle="Entrez le code fondateur pour le pilotage Villeneuve."
        defaultNext="/fondateur"
      />
    </Suspense>
  );
}
