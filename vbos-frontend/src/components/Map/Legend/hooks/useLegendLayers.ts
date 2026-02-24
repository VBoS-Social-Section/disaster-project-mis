/**
 * Hook for preparing legend data from active map layers.
 *
 * This hook reads metadata from the layer store
 * since the metadata is already loaded by the left sidebar.
 *
 * Architecture:
 * - Reads active layer IDs from the layer store (URL-synced)
 * - Gets metadata from the store's allDatasets
 * - Enriches with visualization metadata (colors, data ranges, etc.)
 * - Returns array of LegendLayer objects ready for display
 */

import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { useLayerStore } from "@/store/layer-store";
import { useAreaStore } from "@/store/area-store";
import { useDateStore } from "@/store/date-store";
import { useAdminAreaStats } from "@/hooks/useAdminAreaStats";
import useProvinces from "@/hooks/useProvinces";
import { featureCollection } from "@turf/helpers";
import type {
  LegendLayer,
  VectorLegendLayer,
} from "@/components/Map/Legend/types";
import type { PaginatedVectorData } from "@/types/api";
import { mapColors } from "../../../colors";

/**
 * Hook that provides legend layer data for all currently active map layers.
 *
 * @returns Array of LegendLayer objects, or empty array if no layers active
 *
 * @example
 * ```tsx
 * function MapComponent() {
 *
 *   return (
 *     <Map>
 *       <Legend />
 *     </Map>
 *   );
 * }
 * ```
 */
export function useLegendLayers(): LegendLayer[] {
  const {
    layers: layerString,
    getLayerMetadata,
    tabularLayerData,
  } = useLayerStore();
  const { ac, province, acGeoJSON } = useAreaStore();
  const { year } = useDateStore();
  const { data: provincesGeojson } = useProvinces();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();

  // Get min/max values from the same source as the map rendering
  const { minValue, maxValue } = useAdminAreaStats(
    province ? acGeoJSON : provincesGeojson || featureCollection([]),
  );

  // Parse active layer IDs from the store
  const activeLayerIds = layerString
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  // Build legend layers from the store metadata
  const legendLayers: LegendLayer[] = [];

  activeLayerIds.forEach((layerId) => {
    // Get metadata from the store
    const dataset = getLayerMetadata(layerId);

    // Only include layers that have metadata loaded
    if (dataset) {
      if (dataset.dataType === "tabular") {
        // Check if we're currently fetching data for this dataset
        const filters = new URLSearchParams();
        if (ac) filters.set("area_council", ac);
        if (province) filters.set("province", province);

        const queryKey = ["dataset", "tabular", dataset.id, filters.toString()];

        // Check if this specific query is fetching
        const isPending =
          isFetching > 0 && queryClient.isFetching({ queryKey }) > 0;

        // Filter data for the current year
        const filteredData = tabularLayerData.filter((i) =>
          i.date.startsWith(year),
        );

        legendLayers.push({
          ...dataset,
          colorScheme: "sequential", // Could be made configurable
          dataRange: { min: minValue, max: maxValue },
          isPending,
          hasData: filteredData.length > 0,
        });
      } else if (dataset.dataType === "vector") {
        // Try to get the vector data from the query cache to determine geometry type
        const filters = new URLSearchParams();
        if (ac) filters.set("area_council", ac);
        if (province) filters.set("province", province);

        const vectorDataQueryKey = [
          "dataset",
          "vector",
          dataset.id,
          new URLSearchParams(filters).toString(),
        ];

        const vectorData =
          queryClient.getQueryData<PaginatedVectorData>(vectorDataQueryKey);
        const geometryType: VectorLegendLayer["geometryType"] =
          (vectorData?.features[0]?.geometry
            .type as VectorLegendLayer["geometryType"]) || "LineString";

        legendLayers.push({
          ...dataset,
          geometryType,
          color: geometryType === "Point" ? mapColors.blue : mapColors.orange,
        });
      } else if (dataset.dataType === "raster") {
        legendLayers.push({
          ...dataset,
          opacity: 1.0,
        });
      } else if (dataset.dataType === "pmtiles") {
        legendLayers.push({
          ...dataset,
          geometryType: "LineString",
          color: mapColors.red,
        });
      }
    }
  });

  return legendLayers;
}
