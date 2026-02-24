import { create } from "zustand";

interface UiState {
  isTimeSeriesOpen: boolean;
  toggleTimeSeries: () => void;
  setTimeSeriesOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isTimeSeriesOpen: false,

  toggleTimeSeries: () => {
    set((state) => ({ isTimeSeriesOpen: !state.isTimeSeriesOpen }));
  },

  setTimeSeriesOpen: (open: boolean) => {
    set({ isTimeSeriesOpen: open });
  },
}));
