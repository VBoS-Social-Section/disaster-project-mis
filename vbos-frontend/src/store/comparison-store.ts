import { create } from "zustand";

const MIN_YEAR = 2004;
const MAX_YEAR = new Date().getFullYear();

function getDefaultYearRight() {
  return String(MAX_YEAR - 1);
}

function getDefaultYearLeft() {
  return String(MAX_YEAR - 2);
}

export type ComparisonView = "swipe" | "delta";

interface ComparisonState {
  comparisonMode: boolean;
  comparisonView: ComparisonView;
  yearLeft: string;
  yearRight: string;
  setComparisonMode: (enabled: boolean) => void;
  setComparisonView: (view: ComparisonView) => void;
  setYearLeft: (year: string) => void;
  setYearRight: (year: string) => void;
  syncFromUrl: () => void;
  minYear: number;
  maxYear: number;
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  comparisonMode: false,
  comparisonView: "swipe",
  yearLeft: getDefaultYearLeft(),
  yearRight: getDefaultYearRight(),
  setComparisonView: (view) => set({ comparisonView: view }),
  minYear: MIN_YEAR,
  maxYear: MAX_YEAR,

  setComparisonMode: (enabled) => {
    set({ comparisonMode: enabled });
    if (enabled) {
      const params = new URLSearchParams(window.location.search);
      params.set("compare", "1");
      params.set("yearLeft", get().yearLeft);
      params.set("yearRight", get().yearRight);
      window.history.replaceState(null, "", `?${params.toString()}`);
    } else {
      const params = new URLSearchParams(window.location.search);
      params.delete("compare");
      params.delete("yearLeft");
      params.delete("yearRight");
      const rest = params.toString();
      window.history.replaceState(null, "", rest ? `?${rest}` : window.location.pathname);
    }
  },

  setYearLeft: (year) => {
    set({ yearLeft: year });
    if (get().comparisonMode) {
      const params = new URLSearchParams(window.location.search);
      params.set("yearLeft", year);
      window.history.replaceState(null, "", `?${params.toString()}`);
    }
  },

  setYearRight: (year) => {
    set({ yearRight: year });
    if (get().comparisonMode) {
      const params = new URLSearchParams(window.location.search);
      params.set("yearRight", year);
      window.history.replaceState(null, "", `?${params.toString()}`);
    }
  },

  syncFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const compare = params.get("compare");
    const yearLeft = params.get("yearLeft");
    const yearRight = params.get("yearRight");
    if (compare === "1") {
      set({
        comparisonMode: true,
        yearLeft: yearLeft || getDefaultYearLeft(),
        yearRight: yearRight || getDefaultYearRight(),
      });
    }
    // Don't auto-disable comparison when disaster - allow tabular comparison
  },
}));
