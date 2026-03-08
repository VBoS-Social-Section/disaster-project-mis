import { useCallback } from "react";
import { PaginatedVectorData } from "@/types/api";
import { BlobType } from "@/types/data";
import { useQueryClient } from "@tanstack/react-query";

/** Find cached vector data for a dataset (any query key variant). */
function findCachedVectorData(
  queryClient: ReturnType<typeof import("@tanstack/react-query").useQueryClient>,
  id: number,
): PaginatedVectorData | null {
  const cache = queryClient.getQueryCache();
  const queries = cache.findAll({ queryKey: ["dataset", "vector", id] });
  for (const q of queries) {
    const data = queryClient.getQueryData<PaginatedVectorData>(q.queryKey);
    if (data && "features" in data) return data;
  }
  return null;
}

export function useVectorDatasetFromCache() {
  const queryClient = useQueryClient();

  return useCallback(
    (id: number, areaFilters: URLSearchParams): BlobType => {
      const cachedData = findCachedVectorData(queryClient, id);

      if (!cachedData) {
        throw new Error(
          "Vector data not available. Please ensure the layer is loaded on the map first.",
        );
      }

      let features = cachedData.features;
      const province = areaFilters.get("province");
      const areaCouncil = areaFilters.get("area_council");

      if (province || areaCouncil) {
        features = features.filter((f) => {
          const props = f.properties ?? {};
          const p = (props.province ?? "").toString().toLowerCase();
          const ac = (props.area_council ?? "").toString().toLowerCase();
          if (areaCouncil && province) {
            return p === province.toLowerCase() && ac === areaCouncil.toLowerCase();
          }
          if (province) return p === province.toLowerCase();
          if (areaCouncil) return ac === areaCouncil.toLowerCase();
          return true;
        });
      }

      const geoJSON = {
        type: "FeatureCollection" as const,
        features,
      };

      const geoJSONString = JSON.stringify(geoJSON, null, 2);
      return {
        blob: new Blob([geoJSONString], { type: "application/geo+json" }),
        extension: "geojson",
        mimeType: "application/geo+json",
      };
    },
    [queryClient],
  );
}
