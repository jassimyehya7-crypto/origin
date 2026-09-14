import { Suspense } from "react";
import { StaffLoginForm } from "@/components/StaffLoginForm";

export const dynamic = "force-dynamic";

export default function ProLoginPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Chargement…</p>}>
      <StaffLoginForm
        role="pro"
        title="Épicerie Club Pro"
        subtitle="Entrez le code commerçant pour accéder à l’espace Pro."
        defaultNext="/pro"
      />
    </Suspense>
  );
}
