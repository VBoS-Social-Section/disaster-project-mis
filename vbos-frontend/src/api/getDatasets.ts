import * as HTTP from "./http";
import {
  Dataset,
  ClusterDatasets,
  PaginatedVectorData,
  TabularData,
} from "@/types/api";

interface ClusterDatasetsResponse {
  tabular: Record<string, unknown>[];
  raster: Record<string, unknown>[];
  vector: Record<string, unknown>[];
  pmtiles: Record<string, unknown>[];
}

export async function getDatasets(cluster: string): Promise<ClusterDatasets[]> {
  const response = await HTTP.get(
    `/api/v1/datasets/?cluster=${encodeURIComponent(cluster)}`,
  );
  if (!response.ok)
    throw new Error(`Unable to fetch datasets for cluster ${cluster}`);

  const data: ClusterDatasetsResponse = await response.json();

  const allDatasets: Dataset[] = [
    ...(data.tabular ?? []).map((d) => ({ ...d, dataType: "tabular" as const })),
    ...(data.raster ?? []).map((d) => ({ ...d, dataType: "raster" as const })),
    ...(data.vector ?? []).map((d) => ({ ...d, dataType: "vector" as const })),
    ...(data.pmtiles ?? []).map((d) => ({
      ...d,
      dataType: "pmtiles" as const,
    })),
  ];

  const groupedByType: ClusterDatasets[] = allDatasets.reduce(
    (acc: ClusterDatasets[], item: Dataset) => {
      const existingType = acc.find(
        (group: ClusterDatasets) => group.type === item.type,
      );

      if (existingType) {
        existingType.datasets.push(item);
      } else {
        acc.push({
          type: item.type,
          datasets: [item],
        });
      }

      return acc;
    },
    [],
  );

  return groupedByType;
}

interface ListApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TabularData[];
}

export async function getDatasetData(
  dataType: "tabular" | "vector",
  id: number,
  filters?: URLSearchParams,
) {
  let allResults: PaginatedVectorData | ListApiResponse | null = null;
  const queryString = filters ? new URLSearchParams(filters).toString() : "";
  const url = `/api/v1/${dataType}/${id}/data/?page_size=2000${queryString ? `&${queryString}` : ""}`;

  let currentUrl: string | null = url;

  while (currentUrl) {
    const response = await HTTP.get(currentUrl);
    if (!response.ok)
      throw new Error(`Unable to fetch data from ${currentUrl}`);

    const data = await response.json();

    if (!allResults) {
      allResults = data;
    } else {
      if (dataType === "vector" && "features" in allResults) {
        (allResults as PaginatedVectorData).features.push(...data.features);
      }
      if (dataType === "tabular" && "results" in allResults) {
        (allResults as ListApiResponse).results.push(...data.results);
      }
    }

    // Extract relative path from next URL if it exists
    currentUrl = data.next
      ? new URL(data.next).pathname + new URL(data.next).search
      : null;
  }

  return allResults as PaginatedVectorData | ListApiResponse;
}
