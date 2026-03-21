/**
 * Header segmented control: Disaster | Climate | Compare.
 * Shared labels for accessibility, toasts, and subtitles.
 */
import type { ScenarioId } from "@/config/scenarios";

export type HeaderModeId = Extract<ScenarioId, "disaster" | "climate" | "compare">;

export const HEADER_MODE_IDS: readonly HeaderModeId[] = [
  "disaster",
  "climate",
  "compare",
] as const;

export function isHeaderModeId(id: ScenarioId): id is HeaderModeId {
  return HEADER_MODE_IDS.includes(id as HeaderModeId);
}

export const HEADER_MODE_META: Record<
  HeaderModeId,
  {
    label: string;
    subtitle: string;
    toastTitle: string;
    toastDescription: string;
  }
> = {
  disaster: {
    label: "Disaster",
    subtitle: "Hazard layers & response data",
    toastTitle: "Disaster mode",
    toastDescription: "Showing hazard layers and response data.",
  },
  climate: {
    label: "Climate",
    subtitle: "Trends & projections",
    toastTitle: "Climate mode",
    toastDescription: "Showing climate trends and projections.",
  },
  compare: {
    label: "Compare",
    subtitle:
      "Drag the handle to compare · Change years in the context panel →",
    toastTitle: "Compare mode",
    toastDescription:
      "Drag the map handle to compare years. Adjust years in the context panel (right).",
  },
};
