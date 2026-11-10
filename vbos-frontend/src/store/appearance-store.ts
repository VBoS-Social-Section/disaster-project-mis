/**
 * Appearance choices (colour theme, corners, text size), remembered in this browser.
 * Applied as attributes on <html>; the matching rules are at the end of index.css.
 * Light/dark/system mode is handled separately by next-themes (see ui/color-mode).
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const THEME_PRESETS = [
  { id: "drmis-blue", label: "DRMIS Blue", note: "Official default", swatch: ["#0066b3", "#004f8a", "#dbeafe"] },
  { id: "ocean", label: "Ocean", note: "Calm, clear blue", swatch: ["#006699", "#004d80", "#b3c7e6"] },
  { id: "violet", label: "Violet", note: "Deep purple", swatch: ["#7c3aed", "#6d28d9", "#ede9fe"] },
  { id: "emerald", label: "Emerald", note: "Fresh, steady green", swatch: ["#059669", "#047857", "#d1fae5"] },
  { id: "teal", label: "Teal", note: "Cool blue-green", swatch: ["#0f766e", "#115e59", "#ccfbf1"] },
  { id: "amber", label: "Amber", note: "Warm earth tones", swatch: ["#c2410c", "#9a3412", "#ffedd5"] },
  { id: "rose", label: "Rose", note: "Soft crimson", swatch: ["#e11d48", "#be123c", "#ffe4e6"] },
  { id: "graphite", label: "Graphite", note: "Neutral and understated", swatch: ["#334155", "#1e293b", "#e2e8f0"] },
] as const;

export type ThemePresetId = (typeof THEME_PRESETS)[number]["id"];
export type Corners = "sharp" | "default" | "rounded";
export type FontSize = "small" | "default" | "large" | "xlarge";

interface AppearanceState {
  preset: ThemePresetId;
  corners: Corners;
  fontSize: FontSize;
  setPreset: (v: ThemePresetId) => void;
  setCorners: (v: Corners) => void;
  setFontSize: (v: FontSize) => void;
  reset: () => void;
}

const DEFAULTS = { preset: "drmis-blue", corners: "default", fontSize: "default" } as const;

export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setPreset: (preset) => set({ preset }),
      setCorners: (corners) => set({ corners }),
      setFontSize: (fontSize) => set({ fontSize }),
      reset: () => set({ ...DEFAULTS }),
    }),
    { name: "vbos-appearance" },
  ),
);

function apply(s: Pick<AppearanceState, "preset" | "corners" | "fontSize">) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.setAttribute("data-theme", s.preset);
  html.setAttribute("data-corners", s.corners);
  html.setAttribute("data-font-size", s.fontSize);
}

// Apply on load (before first paint of the app) and on every change
apply(useAppearanceStore.getState());
useAppearanceStore.subscribe(apply);
