/**
 * Coordinated Disaster | Climate | Compare switches: per-mode layer memory,
 * comparison URL state, toast feedback, and brief layer-panel skeleton.
 */
import { useCallback } from "react";
import { useViewStore, headerModeFromScenario } from "@/store/view-store";
import { useLayerStore } from "@/store/layer-store";
import { useComparisonStore } from "@/store/comparison-store";
import { toast } from "@/utils/toast";
import type { ScenarioId } from "@/config/scenarios";
import {
  HEADER_MODE_META,
  isHeaderModeId,
  type HeaderModeId,
} from "@/config/modes";

const PANEL_SWITCH_MS = 320;

export function useModeTransition() {
  const scenarioId = useViewStore((s) => s.scenarioId);
  const setScenario = useViewStore((s) => s.setScenario);
  const saveLayersForMode = useViewStore((s) => s.saveLayersForMode);
  const getLayersForMode = useViewStore((s) => s.getLayersForMode);
  const setLayerPanelSwitching = useViewStore((s) => s.setLayerPanelSwitching);
  const layers = useLayerStore((s) => s.layers);
  const setLayers = useLayerStore((s) => s.setLayers);
  const setComparisonMode = useComparisonStore((s) => s.setComparisonMode);

  const switchToMode = useCallback(
    (targetId: ScenarioId) => {
      if (!isHeaderModeId(targetId)) return;
      if (targetId === scenarioId) return;

      const fromKey = headerModeFromScenario(scenarioId) ?? "disaster";
      saveLayersForMode(fromKey, layers);
      setLayerPanelSwitching(true);

      setScenario(targetId);

      let nextLayers = getLayersForMode(targetId);
      if (
        (nextLayers === undefined || nextLayers === "") &&
        targetId === "compare"
      ) {
        nextLayers = layers;
      }
      setLayers(nextLayers ?? "");

      if (targetId === "compare") {
        setComparisonMode(true);
      } else {
        setComparisonMode(false);
      }

      const meta = HEADER_MODE_META[targetId as HeaderModeId];
      toast.info(meta.toastTitle, meta.toastDescription);

      window.setTimeout(() => {
        setLayerPanelSwitching(false);
      }, PANEL_SWITCH_MS);
    },
    [
      scenarioId,
      layers,
      saveLayersForMode,
      setScenario,
      getLayersForMode,
      setLayers,
      setComparisonMode,
      setLayerPanelSwitching,
    ],
  );

  return { switchToMode, scenarioId };
}
