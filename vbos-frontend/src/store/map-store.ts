import { create } from "zustand";
import { ViewState } from "react-map-gl/maplibre";

interface MapState {
  viewState: ViewState;
  setViewState: (viewState: Partial<ViewState>) => void;
}

export const useMapStore = create<MapState>((set) => ({
  viewState: {
    longitude: 167.5997,
    latitude: -16.7087,
    zoom: 6,
    pitch: 0,
    bearing: 0,
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
  },

  setViewState: (updates) => {
    set((state) => ({
      viewState: { ...state.viewState, ...updates },
    }));
  },
}));
