import { useCallback } from "react";
import { PaginatedVectorData } from "@/types/api";
import { BlobType } from "@/types/data";
import { useQueryClient } from "@tanstack/react-query";

export function useVectorDatasetFromCache() {
  const queryClient = useQueryClient();

  return useCallback(
    (id: number, areaFilters: URLSearchParams): BlobType => {
      const queryKey = ["dataset", "vector", id, areaFilters.toString()];
      const cachedData =
        queryClient.getQueryData<PaginatedVectorData>(queryKey);

      if (!cachedData) {
        throw new Error(
          "Vector data not available. Please ensure the layer is loaded on the map first.",
        );
      }
      // Convert to GeoJSON FeatureCollection
      const geoJSON = {
        type: "FeatureCollection" as const,
        features: cachedData.features,
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
