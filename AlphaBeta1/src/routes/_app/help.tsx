import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/help")({
  component: Help,
});

const FAQS = [
  {
    q: "Comment ça marche ?",
    a: "Les commerces de Villeneuve publient des offres du jour. Vous réservez gratuitement, vous recevez un code EC, vous payez au magasin.",
  },
  {
    q: "Dois-je payer en ligne ?",
    a: "Non. La réservation est gratuite. Vous réglez au commerce, comme d’habitude.",
  },
  {
    q: "C’est quoi le code EC ?",
    a: "Un code de retrait à présenter au commerçant. Il s’affiche dès que la demande est envoyée, et reste valable jusqu’à l’horaire indiqué.",
  },
  {
    q: "Puis-je annuler ?",
    a: "Oui, tant que le commerçant n’a pas marqué la commande récupérée. Le stock redevient disponible.",
  },
  {
    q: "Pourquoi certaines offres disparaissent ?",
    a: "Stock réel, horaires réels. Quand c’est parti, c’est parti — on n’invente pas de compteurs.",
  },
];

function Help() {
  return (
    <div className="px-5 pb-8 pt-6 safe-top">
      <h1 className="font-display text-2xl font-bold tracking-tight">Aide & support</h1>
      <p className="mt-1 text-sm text-mute">Des réponses courtes, sans jargon.</p>
      <ul className="mt-6 space-y-3">
        {FAQS.map((item) => (
          <li key={item.q} className="rounded-[var(--radius-lg)] bg-card p-4 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-base font-semibold">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">{item.a}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-mute">
        Une question ? Écrivez-nous à{" "}
        <a className="font-semibold text-ink underline" href="mailto:bonjour@offreslocal.ch">
          bonjour@offreslocal.ch
        </a>
      </p>
    </div>
  );
}
