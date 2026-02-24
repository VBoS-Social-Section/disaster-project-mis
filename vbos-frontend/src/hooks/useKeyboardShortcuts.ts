import { useEffect, useCallback } from "react";
import { useUiStore } from "@/store/ui-store";

/**
 * Global keyboard shortcuts:
 * - Escape: Close panels (time series drawer, etc.)
 * - Ctrl/Cmd + L: Focus layer sidebar (if implemented)
 */
export function useKeyboardShortcuts() {
  const { isTimeSeriesOpen, setTimeSeriesOpen } = useUiStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Escape: close open panels/drawers
      if (e.key === "Escape") {
        if (isTimeSeriesOpen) {
          setTimeSeriesOpen(false);
          e.preventDefault();
        }
      }
    },
    [isTimeSeriesOpen, setTimeSeriesOpen],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
