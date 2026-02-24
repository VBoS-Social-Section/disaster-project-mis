import { AreaCouncilGeoJSON } from "@/types/data";
import { featureCollection } from "@turf/helpers";
import { create } from "zustand";

interface AreaState {
  ac: string;
  acGeoJSON: AreaCouncilGeoJSON;
  setAc: (area: string) => void;
  setAcGeoJSON: (acGeoJSON: AreaCouncilGeoJSON) => void;
  province: string;
  setProvince: (province: string) => void;
  syncFromUrl: () => void;
}

export const useAreaStore = create<AreaState>((set) => ({
  ac: "",
  acGeoJSON: featureCollection([]),
  province: "",

  setAcGeoJSON: (acGeoJSON: AreaCouncilGeoJSON) => set({ acGeoJSON }),

  setAc: (ac: string) => {
    set({ ac });
    const params = new URLSearchParams(window.location.search);
    if (ac) {
      params.set("ac", ac);
    } else {
      params.delete("ac");
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  },

  setProvince: (province: string) => {
    set({ province, ac: "" });
    const params = new URLSearchParams(window.location.search);
    params.delete("ac");
    if (province) {
      params.set("province", province);
    } else {
      params.delete("province");
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  },

  syncFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const ac = params.get("ac");
    const province = params.get("province");
    if (ac) {
      set({ ac });
    }
    if (province) {
      set({ province });
    }
  },
}));
