/**
 * When entering Climate mode: auto-activate land cover raster, clear disaster choropleths,
 * and set year to 2023 if needed.
 */
import { useEffect, useRef } from "react";
import { useViewStore } from "@/store/view-store";
import { useLayerStore } from "@/store/layer-store";
import { useDateStore } from "@/store/date-store";
import { useAuthStore } from "@/store/auth-store";
import { useLandCoverRaster } from "./useLandCoverRaster";

const CLIMATE_YEARS = ["2020", "2023"];

export function useClimateModeEffect() {
  const scenarioId = useViewStore((s) => s.scenarioId);
  const { setLayers, setAllDatasets, layers } = useLayerStore();
  const { setYear, year } = useDateStore();
  const landCover = useLandCoverRaster();
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

    const current = layers.split(",").filter(Boolean);
    const hasLandCoverRaster = landCover && current.includes(landCover.layerId);
    const hasTabular = current.some((l) => l.startsWith("t"));

    // Set year to 2023 if current year isn't a land cover year (only on enter)
    if (justEntered && !CLIMATE_YEARS.includes(year)) {
      setYear("2023");
    }

    // Auto-activate land cover raster when available and not yet active
    if (landCover && !hasLandCoverRaster) {
      setAllDatasets([landCover.dataset]);
      const vectors = current.filter((l) => l.startsWith("v") || l.startsWith("p"));
      const newLayers = [...vectors, landCover.layerId];
      setLayers(newLayers.join(","));
      return;
    }

    // In climate mode: always remove tabular layers (disaster choropleths)
    if (hasTabular) {
      const nonTabular = current.filter((l) => !l.startsWith("t"));
      setLayers(nonTabular.join(","));
    }
  }, [scenarioId, landCover, setLayers, setAllDatasets, setYear, year, layers]);
}
