import { useEffect, useCallback } from "react";
import { useUiStore } from "@/store/ui-store";
import { useViewStore } from "@/store/view-store";
import { useComparisonStore } from "@/store/comparison-store";
import { toast } from "@/utils/toast";

/**
 * Global keyboard shortcuts:
 * - Escape: Close panels (time series drawer, etc.)
 * - Alt+C: Switch to Climate mode
 * - Alt+D: Switch to Disaster mode
 */
export function useKeyboardShortcuts() {
  const { isTimeSeriesOpen, setTimeSeriesOpen } = useUiStore();
  const { scenarioId, setScenario } = useViewStore();
  const setComparisonMode = useComparisonStore((s) => s.setComparisonMode);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Alt+C: Climate mode
      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setScenario("climate");
        if (scenarioId !== "climate") {
          toast.success("Switched to Climate mode");
        }
        return;
      }
      // Alt+D: Disaster mode
      if (e.altKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setScenario("disaster");
        setComparisonMode(false);
        if (scenarioId !== "disaster") {
          toast.success("Switched to Disaster mode");
        }
        return;
      }
      // Escape: close open panels/drawers
      if (e.key === "Escape") {
        if (isTimeSeriesOpen) {
          setTimeSeriesOpen(false);
          e.preventDefault();
        }
      }
    },
    [isTimeSeriesOpen, setTimeSeriesOpen, scenarioId, setScenario, setComparisonMode],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
