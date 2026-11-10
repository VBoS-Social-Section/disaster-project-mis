/**
 * Smart default views: restore last session OR load recommended datasets.
 * Runs after useUrlSync when URL has no params.
 */
import { useEffect, useRef } from "react";
import { useLayerStore } from "@/store/layer-store";
import { useDateStore } from "@/store/date-store";
import { useAreaStore } from "@/store/area-store";
import { useSessionStore } from "@/store/session-store";
import { useAuthStore } from "@/store/auth-store";
import { findRecommendedDisasterLayer } from "@/api/findRecommendedDataset";

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
  const { layers, setLayers } = useLayerStore();
  const { setYear } = useDateStore();
  const { setProvinces } = useAreaStore();
  const { layers: sessionLayers, year: sessionYear, province: sessionProvince } = useSessionStore();
  const appliedRef = useRef(false);

  useEffect(() => {
    if (!useAuthStore.getState().token) return;
    if (appliedRef.current) return;
    if (hasUrlParams()) return;

    if (sessionLayers && sessionLayers.split(",").filter(Boolean).length > 0) {
      appliedRef.current = true;
      setLayers(sessionLayers);
      if (sessionYear) setYear(sessionYear);
      if (sessionProvince) setProvinces([sessionProvince]);
      return;
    }

    appliedRef.current = true;

    findRecommendedDisasterLayer().then((layerId) => {
      if (layerId) {
        setLayers(layerId);
      }
    });
  }, [
    layers,
    sessionLayers,
    sessionYear,
    sessionProvince,
    setLayers,
    setYear,
    setProvinces,
  ]);
}
