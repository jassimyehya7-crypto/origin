import { useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { LOCATIONS } from "@/lib/data/catalog";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LocationButton() {
  const [open, setOpen] = useState(false);
  const locationId = useAppStore((s) => s.locationId);
  const setLocationId = useAppStore((s) => s.setLocationId);
  const current = LOCATIONS.find((l) => l.id === locationId) ?? LOCATIONS[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-ink press"
      >
        <MapPin className="size-4 text-mute" />
        {current.name} ({current.canton})
        <ChevronDown className="size-4 text-faint" />
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="Votre localisation">
        <ul className="space-y-1">
          {LOCATIONS.map((loc) => {
            const active = loc.id === locationId;
            return (
              <li key={loc.id}>
                <button
                  type="button"
                  onClick={() => {
                    setLocationId(loc.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-12 w-full items-center justify-between rounded-[var(--radius-md)] px-3 text-left text-sm font-medium",
                    active ? "bg-lime" : "hover:bg-soft",
                  )}
                >
                  <span>
                    {loc.name} <span className="text-mute">({loc.canton})</span>
                  </span>
                  {active ? <Check className="size-4" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </Sheet>
    </>
  );
}
