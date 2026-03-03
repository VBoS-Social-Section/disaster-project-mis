/**
 * Smart default views: restore last session OR load recommended datasets.
 * Runs after useUrlSync when URL has no params.
 */
import { useEffect, useRef } from "react";
import { useLayerStore } from "@/store/layer-store";
import { useViewStore } from "@/store/view-store";
import { useDateStore } from "@/store/date-store";
import { useAreaStore } from "@/store/area-store";
import { useComparisonStore } from "@/store/comparison-store";
import { useSessionStore } from "@/store/session-store";
import { useAuthStore } from "@/store/auth-store";
import { useLandCoverRaster } from "./useLandCoverRaster";
import { findRecommendedDisasterLayer } from "@/api/findRecommendedDataset";
import {
  CLIMATE_DEFAULT_YEAR,
  CLIMATE_COMPARISON_YEARS,
} from "@/config/recommendedDefaults";

function hasUrlParams(): boolean {
  const params = new URLSearchParams(window.location.search);
  return (
    params.has("layers") ||
    params.has("view") ||
    params.has("year") ||
    params.has("province") ||
    params.has("ac")
  );
}

export function useSmartDefaults() {
  const { layers, setLayers, setAllDatasets } = useLayerStore();
  const { scenarioId, setScenario } = useViewStore();
  const { setYear } = useDateStore();
  const { setProvince } = useAreaStore();
  const { setComparisonMode, setYearLeft, setYearRight } = useComparisonStore();
  const { layers: sessionLayers, scenarioId: sessionScenario, year: sessionYear, province: sessionProvince } = useSessionStore();
  const landCover = useLandCoverRaster();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!useAuthStore.getState().token) return;
    if (appliedRef.current) return;
    if (hasUrlParams()) return;

    if (sessionLayers && sessionLayers.split(",").filter(Boolean).length > 0) {
      appliedRef.current = true;
      setLayers(sessionLayers);
      if (sessionScenario === "disaster" || sessionScenario === "climate") {
        setScenario(sessionScenario);
      }
      if (sessionYear) setYear(sessionYear);
      if (sessionProvince) setProvince(sessionProvince);
      if (sessionScenario === "climate") {
        setYearLeft(CLIMATE_COMPARISON_YEARS.left);
        setYearRight(CLIMATE_COMPARISON_YEARS.right);
        setComparisonMode(true);
      }
      return;
    }

    appliedRef.current = true;

    if (scenarioId === "climate") {
      if (landCover) {
        setAllDatasets([landCover.dataset]);
        setLayers(landCover.layerId);
        setYear(CLIMATE_DEFAULT_YEAR);
        setYearLeft(CLIMATE_COMPARISON_YEARS.left);
        setYearRight(CLIMATE_COMPARISON_YEARS.right);
        setComparisonMode(true);
      }
      return;
    }

    findRecommendedDisasterLayer().then((layerId) => {
      if (layerId) {
        setLayers(layerId);
      }
    });
  }, [
    layers,
    scenarioId,
    sessionLayers,
    sessionScenario,
    sessionYear,
    sessionProvince,
    landCover,
    setLayers,
    setScenario,
    setYear,
    setProvince,
    setAllDatasets,
    setComparisonMode,
    setYearLeft,
    setYearRight,
  ]);
}
