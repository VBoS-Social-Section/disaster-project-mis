import { create } from "zustand";
import { Dataset, TabularData } from "@/types/api";

interface LayersState {
  layers: string; // used to store only the layerIds, ex: t1,v34,r54
  tabularLayerData: TabularData[];
  allDatasets: Dataset[]; // used to store the metadata of all dataset layers
  setLayers: (layers: string) => void;
  switchLayer: (layer: string) => void;
  setTabularLayerData: (data: TabularData[]) => void;
  setAllDatasets: (datasets: Dataset[]) => void;
  getLayerMetadata: (layer: string) => Dataset | undefined;
  syncFromUrl: () => void;
}

export const useLayerStore = create<LayersState>((set, get) => ({
  layers: "",
  tabularLayerData: [],
  allDatasets: [],

  setLayers: (layers: string) => {
    set({ layers });
    const params = new URLSearchParams(window.location.search);
    if (layers) {
      params.set("layers", layers);
    } else {
      params.delete("layers");
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  },

  switchLayer: (layer: string) => {
    const { layers } = get();
    let layerArray = layers ? layers.split(",") : [];
    // We can only have one tabular layer and one raster layer enabled at once.
    // So, we need to remove other enabled tabular/raster layers, before adding a new one.
    const isTabularLayer = layer.startsWith("t");
    const isRasterLayer = layer.startsWith("r");
    if (layerArray.includes(layer)) {
      layerArray = layerArray.filter((l) => l !== layer);
      if (isTabularLayer) get().setTabularLayerData([]);
    } else {
      if (isTabularLayer) {
        layerArray = layerArray.filter((l) => !l.startsWith("t"));
      }
      if (isRasterLayer) {
        layerArray = layerArray.filter((l) => !l.startsWith("r"));
      }
      // Add new enabled layer
      layerArray.push(layer);
    }
    get().setLayers(layerArray.join());
  },

  setAllDatasets: (datasets: Dataset[]) => {
    const { allDatasets } = get();
    set({ allDatasets: [...allDatasets, ...datasets] });
  },

  setTabularLayerData: (data: TabularData[]) => {
    set({ tabularLayerData: data });
  },

  syncFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const layers = params.get("layers");
    if (layers) {
      set({ layers });
    }
  },

  getLayerMetadata: (layer: string) => {
    const { allDatasets } = get();
    const id = Number(layer.slice(1));

    return allDatasets.find(
      (i) => i.id === id && i.dataType.startsWith(layer.slice(0, 1)),
    );
  },
}));
