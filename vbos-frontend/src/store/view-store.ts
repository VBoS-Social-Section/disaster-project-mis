/**
 * Scenario-based view store. Replaces hardcoded disaster/climate with scenario engine.
 */
import { create } from "zustand";
import type { ScenarioId } from "@/config/scenarios";

interface ViewState {
  scenarioId: ScenarioId;
  /** @deprecated Use scenarioId and useScenario() instead. Kept for gradual migration. */
  viewMode: "disaster" | "climate";
  setScenario: (id: ScenarioId) => void;
  syncFromUrl: () => void;
}

const VIEW_PARAM = "view";

/** Maps URL view param to scenarioId. Only disaster/climate in URL for now. */
function viewParamToScenario(view: string | null): ScenarioId {
  if (view === "climate") return "climate";
  if (view === "forecast" || view === "risk" || view === "planning") return view;
  return "disaster";
}

/** Maps scenarioId to URL param (only for active scenarios). */
function scenarioToViewParam(id: ScenarioId): string | null {
  if (id === "disaster") return null;
  return id;
}

export const useViewStore = create<ViewState>((set) => ({
  scenarioId: "disaster",
  viewMode: "disaster",

  setScenario: (id) => {
    set({
      scenarioId: id,
      viewMode: id === "climate" ? "climate" : "disaster",
    });
    const params = new URLSearchParams(window.location.search);
    const view = scenarioToViewParam(id);
    if (view) {
      params.set(VIEW_PARAM, view);
    } else {
      params.delete(VIEW_PARAM);
      params.delete("compare");
      params.delete("yearLeft");
      params.delete("yearRight");
    }
    const rest = params.toString();
    const url = rest ? `${window.location.pathname}?${rest}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  },

  syncFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get(VIEW_PARAM);
    const scenarioId = viewParamToScenario(view);
    set({
      scenarioId,
      viewMode: scenarioId === "climate" ? "climate" : "disaster",
    });
  },
}));
