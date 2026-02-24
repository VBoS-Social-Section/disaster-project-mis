import { create } from "zustand";
import { ViewState } from "react-map-gl/maplibre";

const DEFAULT_VIEW: ViewState = {
  longitude: 167.5997,
  latitude: -16.7087,
  zoom: 6,
  pitch: 0,
  bearing: 0,
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

function getInitialViewState(): ViewState {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  const params = new URLSearchParams(window.location.search);
  const lng = params.get("lng");
  const lat = params.get("lat");
  const zoom = params.get("zoom");
  if (lng != null && lat != null && !Number.isNaN(parseFloat(lng)) && !Number.isNaN(parseFloat(lat))) {
    return {
      ...DEFAULT_VIEW,
      longitude: parseFloat(lng),
      latitude: parseFloat(lat),
      zoom: zoom != null && !Number.isNaN(parseFloat(zoom)) ? parseFloat(zoom) : DEFAULT_VIEW.zoom,
    };
  }
  return DEFAULT_VIEW;
}

interface MapState {
  viewState: ViewState;
  setViewState: (viewState: Partial<ViewState>) => void;
  syncFromUrl: () => void;
  syncToUrl: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  viewState: getInitialViewState(),

  setViewState: (updates) => {
    set((state) => ({
      viewState: { ...state.viewState, ...updates },
    }));
  },

  syncFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const lng = params.get("lng");
    const lat = params.get("lat");
    const zoom = params.get("zoom");
    if (lng != null && lat != null && !Number.isNaN(parseFloat(lng)) && !Number.isNaN(parseFloat(lat))) {
      set((state) => ({
        viewState: {
          ...state.viewState,
          longitude: parseFloat(lng),
          latitude: parseFloat(lat),
          zoom: zoom != null && !Number.isNaN(parseFloat(zoom))
            ? parseFloat(zoom)
            : state.viewState.zoom,
        },
      }));
    }
  },

  syncToUrl: () => {
    const { viewState } = get();
    const params = new URLSearchParams(window.location.search);
    params.set("lng", viewState.longitude.toFixed(4));
    params.set("lat", viewState.latitude.toFixed(4));
    params.set("zoom", viewState.zoom.toFixed(1));
    const rest = params.toString();
    window.history.replaceState(null, "", rest ? `?${rest}` : window.location.pathname);
  },
}));
