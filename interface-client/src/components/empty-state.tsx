import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-soft text-ink">
        <Icon className="size-6" strokeWidth={1.6} />
      </span>
      <h2 className="mt-5 font-display text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-mute">{body}</p>
      {action ? (
        <Button className="mt-6" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyWithSlot({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-soft text-ink">
        <Icon className="size-6" strokeWidth={1.6} />
      </span>
      <h2 className="mt-5 font-display text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-mute">{body}</p>
      {children}
    </div>
  );
}
