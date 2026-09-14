import { EventEmitter } from "events";

/**
 * Store pub/sub interface.
 *
 * Local adapter (this file): in-process EventEmitter → GET /api/events (SSE).
 * Production swap: same channel names on Supabase Realtime
 *   (`offers`, `reservations`, `shops`, `presence`, `scans`).
 * UI must only depend on `StoreChannel` / `StoreEvent` — never on SSE or JSON.
 */
export type StoreChannel =
  | "offers"
  | "reservations"
  | "shops"
  | "presence"
  | "scans";

export type StoreEvent = {
  type: StoreChannel;
  at: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __epicerieClubBus: EventEmitter | undefined;
}

export function getBus(): EventEmitter {
  if (!global.__epicerieClubBus) {
    const bus = new EventEmitter();
    bus.setMaxListeners(200);
    global.__epicerieClubBus = bus;
  }
  return global.__epicerieClubBus;
}

export function emitStore(type: StoreChannel): StoreEvent {
  const payload: StoreEvent = { type, at: new Date().toISOString() };
  const bus = getBus();
  bus.emit(type, payload);
  bus.emit("*", payload);
  return payload;
}

export function onStore(
  type: StoreChannel | "*",
  handler: (event: StoreEvent) => void
): () => void {
  const bus = getBus();
  bus.on(type, handler);
  return () => {
    bus.off(type, handler);
  };
}
