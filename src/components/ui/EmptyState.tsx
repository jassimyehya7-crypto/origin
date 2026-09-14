import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  mark,
}: {
  /** @deprecated emoji removed — use mark letter if needed */
  emoji?: string;
  mark?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="ec-corner-cut flex flex-col items-center justify-center border border-ec-rule bg-ec-surface px-6 py-12 text-center">
      {mark ? (
        <div
          aria-hidden
          className="mb-3 flex h-12 w-12 items-center justify-center bg-ec-ink text-lg font-black uppercase text-ec-yellow"
        >
          {mark}
        </div>
      ) : null}
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
