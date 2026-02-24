import { useEffect } from "react";
import { useAreaStore } from "@/store/area-store";
import { useLayerStore } from "@/store/layer-store";
import { useDateStore } from "@/store/date-store";
import { useMapStore } from "@/store/map-store";

export const useUrlSync = () => {
  const { syncFromUrl: syncAreaFromUrl } = useAreaStore();
  const { syncFromUrl: syncDateFromUrl } = useDateStore();
  const { syncFromUrl: syncLayersFromUrl } = useLayerStore();
  const { syncFromUrl: syncMapFromUrl } = useMapStore();

  useEffect(() => {
    // Sync from URL on mount and on popstate (shareable links restore full view state)
    // Map view state is read at store init for initial render
    syncAreaFromUrl();
    syncDateFromUrl();
    syncLayersFromUrl();
    syncMapFromUrl();

    // Listen for URL changes (browser back/forward)
    const handlePopState = () => {
      syncAreaFromUrl();
      syncDateFromUrl();
      syncLayersFromUrl();
      syncMapFromUrl();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [syncAreaFromUrl, syncLayersFromUrl, syncDateFromUrl, syncMapFromUrl]);
};
