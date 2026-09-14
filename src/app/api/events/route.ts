import { NextRequest } from "next/server";
import { onStore, type StoreEvent } from "@/lib/store-events";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Local live transport (SSE). Demo only — no auth.
 * Production: replace clients with Supabase Realtime on the same channels.
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const write = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* closed */
        }
      };

      const send = (event: string, data: unknown) => {
        write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      send("hello", { type: "hello", at: new Date().toISOString() });

      const handle = (payload: StoreEvent) => {
        send(payload.type, payload);
        send("*", payload);
      };

      const off = onStore("*", handle);

      const heartbeat = setInterval(() => {
        write(`: heartbeat ${new Date().toISOString()}\n\n`);
      }, 15_000);

      const close = () => {
        clearInterval(heartbeat);
        off();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
