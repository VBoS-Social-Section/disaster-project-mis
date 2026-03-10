/**
 * When entering Climate mode: clear all layers (Climate dashboard is placeholder).
 * When in Disaster mode: remove raster layers (Land cover was Climate-only).
 */
import { useEffect, useRef } from "react";
import { useViewStore } from "@/store/view-store";
import { useLayerStore } from "@/store/layer-store";
import { useAuthStore } from "@/store/auth-store";

export function useClimateModeEffect() {
  const scenarioId = useViewStore((s) => s.scenarioId);
  const { setLayers, layers } = useLayerStore();
  const prevModeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!useAuthStore.getState().token) return;

    // In Disaster mode: remove raster layers (Land cover is Climate-only)
    if (scenarioId === "disaster") {
      const current = layers.split(",").filter(Boolean);
      const hasRaster = current.some((l) => l.startsWith("r"));
      if (hasRaster) {
        const nonRaster = current.filter((l) => !l.startsWith("r"));
        setLayers(nonRaster.join(","));
      }
      prevModeRef.current = scenarioId;
      return;
    }

    if (scenarioId !== "climate") {
      prevModeRef.current = scenarioId;
      return;
    }

    const justEntered = prevModeRef.current !== "climate";
    prevModeRef.current = scenarioId;

    // Climate dashboard is placeholder: clear all layers for blank map
    if (justEntered && layers.split(",").filter(Boolean).length > 0) {
      setLayers("");
    }
  }, [scenarioId, setLayers, layers]);
}
