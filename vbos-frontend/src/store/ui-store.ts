import { create } from "zustand";

interface UiState {
  isTimeSeriesOpen: boolean;
  toggleTimeSeries: () => void;
  setTimeSeriesOpen: (open: boolean) => void;
  mobileOpenPanel: "left" | "right" | null;
  setMobileOpenPanel: (panel: "left" | "right" | null) => void;
  isMobile: boolean;
  setIsMobile: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isTimeSeriesOpen: false,

  toggleTimeSeries: () => {
    set((state) => ({ isTimeSeriesOpen: !state.isTimeSeriesOpen }));
  },

  setTimeSeriesOpen: (open: boolean) => {
    set({ isTimeSeriesOpen: open });
  },

  mobileOpenPanel: null as "left" | "right" | null,
  setMobileOpenPanel: (panel) => set({ mobileOpenPanel: panel }),

  isMobile: typeof window !== "undefined" && window.innerWidth < 768,
  setIsMobile: (v) => set({ isMobile: v, ...(v ? { mobileOpenPanel: null } : {}) }),
}));
