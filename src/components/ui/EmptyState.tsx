import { Button } from "./Button";

export function EmptyState({
  emoji = "🧺",
  title,
  description,
  actionLabel,
  onAction,
}: {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-ec-rule bg-ec-surface px-6 py-12 text-center">
      <div className="mb-3 text-4xl">{emoji}</div>
      <h3 className="font-display text-xl text-ec-ink">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-ec-muted">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
