import { useEffect } from "react";
import { useAreaStore } from "@/store/area-store";
import { useLayerStore } from "@/store/layer-store";
import { useDateStore } from "@/store/date-store";

export const useUrlSync = () => {
  const { syncFromUrl: syncAreaFromUrl } = useAreaStore();
  const { syncFromUrl: syncDateFromUrl } = useDateStore();
  const { syncFromUrl: syncLayersFromUrl } = useLayerStore();

  useEffect(() => {
    // Sync from URL on mount
    syncAreaFromUrl();
    syncDateFromUrl();
    syncLayersFromUrl();

    // Listen for URL changes (browser back/forward)
    const handlePopState = () => {
      syncAreaFromUrl();
      syncDateFromUrl();
      syncLayersFromUrl();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [syncAreaFromUrl, syncLayersFromUrl, syncDateFromUrl]);
};
