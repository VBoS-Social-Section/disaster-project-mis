/**
 * Returns the current panel context based on user selection.
 * Drives context-aware panel content.
 */
import { useMemo } from "react";
import { useLayerStore } from "@/store/layer-store";
import { useScenario } from "@/hooks/useScenario";
import { usePanelStore } from "@/store/panel-store";

export type PanelContextType =
  | "feature"   // Feature selected → drill-down insights
  | "tabular"  // Tabular layer → charts + KPIs
  | "raster"    // Raster layer → legend + opacity
  | "climate"   // Climate mode → land accounts
  | "empty";    // No relevant content

export function usePanelContext() {
  const { layers } = useLayerStore();
  const scenario = useScenario();
  const selectedFeatureInfo = usePanelStore((s) => s.selectedFeatureInfo);

  const layerIds = layers.split(",").filter(Boolean);
  const hasRaster = layerIds.some((id) => id.startsWith("r"));
  const hasTabular = layerIds.some((id) => id.startsWith("t"));
  const hasVector = layerIds.some((id) => id.startsWith("v") || id.startsWith("p"));
  const isClimate = scenario.uiConfig.sidebarLayout === "climate";

  const context = useMemo((): PanelContextType => {
    if (selectedFeatureInfo) return "feature";
    if (isClimate) return "climate";
    if (hasTabular) return "tabular";
    if (hasRaster || hasVector) return "raster";
    return "empty";
  }, [selectedFeatureInfo, isClimate, hasTabular, hasRaster, hasVector]);

  return {
    context,
    hasRaster,
    hasTabular,
    hasVector,
    hasActiveLayers: layerIds.length > 0,
    isClimate,
    selectedFeatureInfo,
  };
}
