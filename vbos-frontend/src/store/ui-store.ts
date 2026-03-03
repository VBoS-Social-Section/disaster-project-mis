import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ColorModeOption = "light" | "dark";

interface UiState {
  isTimeSeriesOpen: boolean;
  toggleTimeSeries: () => void;
  setTimeSeriesOpen: (open: boolean) => void;
  mobileOpenPanel: "left" | "right" | null;
  setMobileOpenPanel: (panel: "left" | "right" | null) => void;
  isMobile: boolean;
  setIsMobile: (v: boolean) => void;
  leftSidebarIconMode: boolean;
  setLeftSidebarIconMode: (v: boolean) => void;
  rightSidebarIconMode: boolean;
  setRightSidebarIconMode: (v: boolean) => void;
  mapHoverFeature: boolean;
  setMapHoverFeature: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
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

      leftSidebarIconMode: false,
      setLeftSidebarIconMode: (v) => set({ leftSidebarIconMode: v }),

      rightSidebarIconMode: false,
      setRightSidebarIconMode: (v) => set({ rightSidebarIconMode: v }),

      mapHoverFeature: false,
      setMapHoverFeature: (v) => set({ mapHoverFeature: v }),
    }),
    {
      name: "vbos-ui",
      partialize: (s) => ({
        leftSidebarIconMode: s.leftSidebarIconMode,
        rightSidebarIconMode: s.rightSidebarIconMode,
      }),
    },
  ),
);
