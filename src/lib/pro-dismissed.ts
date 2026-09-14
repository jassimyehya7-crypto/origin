/**
 * Session-scoped dismissed reservation ids for Pro pending lists.
 * Survives client remount after router.refresh() when the server payload
 * is still briefly stale (EN_ATTENTE). Cleared on rollback if PATCH fails.
 */

const STORAGE_KEY = "ec_pro_dismissed_pending";

const memory = new Set<string>();
let hydrated = false;

function hydrateFromSession(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const ids = JSON.parse(raw) as unknown;
    if (!Array.isArray(ids)) return;
    for (const id of ids) {
      if (typeof id === "string" && id) memory.add(id);
    }
  } catch {
    /* ignore quota / parse */
  }
}

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(memory)));
  } catch {
    /* ignore quota */
  }
}

export function dismissPendingId(id: string): void {
  hydrateFromSession();
  memory.add(id);
  persist();
}

export function undismissPendingId(id: string): void {
  hydrateFromSession();
  memory.delete(id);
  persist();
}

export function isPendingDismissed(id: string): boolean {
  hydrateFromSession();
  return memory.has(id);
}

export function filterOutDismissed<T extends { id: string }>(items: T[]): T[] {
  hydrateFromSession();
  if (memory.size === 0) return items;
  return items.filter((r) => !memory.has(r.id));
}

/** Drop dismissed ids once the server no longer lists them as pending. */
export function pruneDismissedAgainst(pendingIds: Iterable<string>): void {
  hydrateFromSession();
  if (memory.size === 0) return;
  const live = new Set(pendingIds);
  let changed = false;
  for (const id of Array.from(memory)) {
    if (!live.has(id)) {
      memory.delete(id);
      changed = true;
    }
  }
  if (changed) persist();
}
