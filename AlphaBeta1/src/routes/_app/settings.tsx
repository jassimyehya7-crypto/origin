import { createFileRoute } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/store";

export const Route = createFileRoute("/_app/settings")({
  component: Settings,
});

function Settings() {
  const notif = useAppStore((s) => s.notif);
  const setNotif = useAppStore((s) => s.setNotif);

  const rows = [
    {
      key: "nearby" as const,
      label: "Offres à proximité",
      example: "4 menus disponibles à −35 % à 700 m jusqu’à 19h.",
    },
    {
      key: "favorites" as const,
      label: "Nouvelles offres de mes commerces favoris",
      example: "Votre boulangerie favorite vient d’ajouter une offre à −30 %, à 350 m.",
    },
    {
      key: "flash" as const,
      label: "Offres Flash",
      example: "Sushi Box à −42 %, 4 disponibles, expire à 19:00.",
    },
    {
      key: "weekly" as const,
      label: "Bons plans de la semaine",
      example: "Un digest le lundi, uniquement s’il y a vraiment matière.",
    },
  ];

  return (
    <div className="px-5 pb-8 pt-6 safe-top">
      <h1 className="font-display text-2xl font-bold tracking-tight">Paramètres</h1>
      <p className="mt-1 text-sm text-mute">
        Les notifications restent rares et précises — jamais un rappel générique.
      </p>

      <h2 className="mt-8 font-display text-lg font-semibold">Notifications</h2>
      <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[var(--radius-lg)] bg-card shadow-[var(--shadow-card)]">
        {rows.map((row) => (
          <li key={row.key} className="flex items-start gap-3 px-4 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{row.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-mute">{row.example}</p>
            </div>
            <Switch
              checked={notif[row.key]}
              onCheckedChange={(v) => setNotif({ [row.key]: v })}
              label={row.label}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
