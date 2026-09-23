import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { LocateFixed, Minus, Plus } from "lucide-react";

const MAP_W = 1792;
const MAP_H = 1008;
const MIN = 1;
const MAX = 4.4;

const VILLENEUVE_MAP = {
  src: "/images/villeneuve-map.jpg",
  west: 6.899,
  east: 6.951,
  north: 46.406,
  south: 46.384,
  focusX: 50.5,
  focusY: 41,
};

function contain(cw: number, ch: number) {
  const s = Math.min(cw / MAP_W, ch / MAP_H);
  return { w: MAP_W * s, h: MAP_H * s };
}

export function TownMap({
  children,
  focusX = VILLENEUVE_MAP.focusX,
  focusY = VILLENEUVE_MAP.focusY,
}: {
  children: ReactNode;
  focusX?: number;
  focusY?: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0, s: 2.05 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(
    null,
  );
  const pinch = useRef<{ dist: number; s: number; cx: number; cy: number } | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  const apply = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    const { x, y, s } = pos.current;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
    el.style.setProperty("--map-zoom", String(s));
  }, []);

  const clamp = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const dw = box.w * pos.current.s;
    const dh = box.h * pos.current.s;
    if (dw <= vp.clientWidth) pos.current.x = (vp.clientWidth - dw) / 2;
    else pos.current.x = Math.min(0, Math.max(vp.clientWidth - dw, pos.current.x));
    if (dh <= vp.clientHeight) pos.current.y = (vp.clientHeight - dh) / 2;
    else pos.current.y = Math.min(0, Math.max(vp.clientHeight - dh, pos.current.y));
  }, [box]);

  const centerOn = useCallback((px: number, py: number, s: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const next = Math.min(MAX, Math.max(MIN, s));
    pos.current.s = next;
    pos.current.x = vp.clientWidth / 2 - (px / 100) * box.w * next;
    pos.current.y = vp.clientHeight / 2 - (py / 100) * box.h * next;
    clamp();
    apply();
  }, [apply, box, clamp]);

  const zoomAt = useCallback((cx: number, cy: number, next: number) => {
    const s = pos.current.s;
    const ns = Math.min(MAX, Math.max(MIN, next));
    if (ns === s) return;
    pos.current.s = ns;
    pos.current.x = cx - ((cx - pos.current.x) / s) * ns;
    pos.current.y = cy - ((cy - pos.current.y) / s) * ns;
    clamp();
    apply();
  }, [apply, clamp]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const layout = () => {
      const next = contain(vp.clientWidth, vp.clientHeight);
      setBox((prev) => (prev.w === next.w && prev.h === next.h ? prev : next));
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(vp);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (box.w === 0) return;
    centerOn(focusX, focusY, 2.05);
  }, [box, centerOn, focusX, focusY]);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = vp.getBoundingClientRect();
      zoomAt(
        e.clientX - rect.left,
        e.clientY - rect.top,
        pos.current.s * (e.deltaY < 0 ? 1.12 : 1 / 1.12),
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      vp.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.current.size === 1) {
        drag.current = {
          x: pos.current.x,
          y: pos.current.y,
          px: e.clientX,
          py: e.clientY,
          moved: false,
        };
        pinch.current = null;
      } else if (pointers.current.size === 2) {
        const pts = [...pointers.current.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const rect = vp.getBoundingClientRect();
        pinch.current = {
          dist,
          s: pos.current.s,
          cx: (pts[0].x + pts[1].x) / 2 - rect.left,
          cy: (pts[0].y + pts[1].y) / 2 - rect.top,
        };
        drag.current = null;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch.current && pointers.current.size >= 2) {
        const pts = [...pointers.current.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (pinch.current.dist > 0) {
          zoomAt(pinch.current.cx, pinch.current.cy, pinch.current.s * (dist / pinch.current.dist));
        }
        return;
      }
      if (!drag.current) return;
      const dx = e.clientX - drag.current.px;
      const dy = e.clientY - drag.current.py;
      if (Math.hypot(dx, dy) > 8) drag.current.moved = true;
      if (!drag.current.moved) return;
      pos.current.x = drag.current.x + dx;
      pos.current.y = drag.current.y + dy;
      clamp();
      apply();
    };

    const onPointerUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
      if (pointers.current.size === 0) {
        if (drag.current?.moved) {
          vp.addEventListener(
            "click",
            (ev) => {
              ev.stopPropagation();
              ev.preventDefault();
            },
            { capture: true, once: true },
          );
        }
        drag.current = null;
      }
    };

    vp.addEventListener("wheel", onWheel, { passive: false });
    vp.addEventListener("pointerdown", onPointerDown);
    vp.addEventListener("pointermove", onPointerMove);
    vp.addEventListener("pointerup", onPointerUp);
    vp.addEventListener("pointercancel", onPointerUp);
    return () => {
      vp.removeEventListener("wheel", onWheel);
      vp.removeEventListener("pointerdown", onPointerDown);
      vp.removeEventListener("pointermove", onPointerMove);
      vp.removeEventListener("pointerup", onPointerUp);
      vp.removeEventListener("pointercancel", onPointerUp);
    };
  }, [apply, box, clamp, zoomAt]);

  return (
    <div className="relative h-[calc(100dvh-11.5rem)] overflow-hidden bg-soft">
      <div
        ref={viewportRef}
        className="absolute inset-0 touch-none select-none overscroll-none"
        style={{ touchAction: "none" }}
      >
        {box.w > 0 ? (
          <div
            ref={stageRef}
            className="absolute left-0 top-0 origin-top-left will-change-transform"
            style={{ width: box.w, height: box.h, ["--map-zoom" as string]: "2.05" }}
          >
            <img
              src={VILLENEUVE_MAP.src}
              alt="Carte aquarelle de Villeneuve VD, d’après le plan de la commune"
              draggable={false}
              className="absolute inset-0 size-full max-w-none outline-none"
            />
            {children}
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute right-3 top-[42%] z-10 flex -translate-y-1/2 flex-col gap-2">
        <button
          type="button"
          aria-label="Recentrer sur Villeneuve"
          onClick={() => centerOn(focusX, focusY, 2.05)}
          className="pointer-events-auto grid size-10 place-items-center rounded-full bg-card shadow-[var(--shadow-float)] press"
        >
          <LocateFixed className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Zoomer"
          onClick={() => {
            const vp = viewportRef.current;
            if (!vp) return;
            zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, pos.current.s * 1.28);
          }}
          className="pointer-events-auto grid size-10 place-items-center rounded-full bg-card shadow-[var(--shadow-float)] press"
        >
          <Plus className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Dézoomer"
          onClick={() => {
            const vp = viewportRef.current;
            if (!vp) return;
            zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, pos.current.s / 1.28);
          }}
          className="pointer-events-auto grid size-10 place-items-center rounded-full bg-card shadow-[var(--shadow-float)] press"
        >
          <Minus className="size-4" />
        </button>
      </div>
    </div>
  );
}
