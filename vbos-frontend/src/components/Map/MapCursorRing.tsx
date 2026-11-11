"use client";

import { useEffect, useState } from "react";
import { useUiStore } from "@/store/ui-store";

/** Faint accent ring at cursor when hovering over map features */
export function MapCursorRing() {
  const mapHoverFeature = useUiStore((s) => s.mapHoverFeature);
  const [pos, setPos] = useState({ x: -100, y: -100 });
  // A feature's mouseout is missed when the pointer leaves the map quickly, which left the
  // ring following the cursor over the side panels. Only draw it while over the map.
  const [overMap, setOverMap] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setOverMap(e.target instanceof Element && !!e.target.closest(".leaflet-container"));
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  if (!mapHoverFeature || !overMap) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9998]"
      aria-hidden
    >
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/40 transition-opacity duration-150"
        style={{
          left: pos.x,
          top: pos.y,
          width: 32,
          height: 32,
        }}
      />
    </div>
  );
}
