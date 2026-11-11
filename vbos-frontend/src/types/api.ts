import { Feature } from "geojson";

export interface IListApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ICluster {
  id: number;
  name: string;
  description?: string;
}

export interface BaseDataset {
  id: number;
  name: string;
  description: string;
  created: string;
  updated: string;
  cluster?: string | null; // Cluster name; null for Climate-only rasters
  type: DatasetType;
  source: string | null;
  unit?: string | null;
  filename_id?: string;
  titiler_url_params?: string;
  /**
   * Optional URL template for precomputed tiles (raster + tabular joins).
   * Placeholders: {z}, {x}, {y}, {year}. When set, used instead of TiTiler.
   */
  precomputed_tile_url?: string | null;
  url?: string;
  source_layer?: string;
  /** Name of cyclone/event (e.g. Cyclone Lola). Shown when layer is active. */
  cyclone_name?: string | null;
  /** Id of the disaster event this dataset belongs to; null/undefined for baseline data. */
  event?: number | null;
}

export type HazardType =
  | "cyclone"
  | "volcano"
  | "flood"
  | "earthquake"
  | "tsunami"
  | "landslide"
  | "drought"
  | "wildfire";

/** A disaster (dated) or a modelled scenario (undated, offered in every year). */
export interface DisasterEvent {
  id: number;
  name: string;
  hazard_type: HazardType;
  hazard_type_label: string;
  start_date: string | null;
  end_date: string | null;
  year: number | null;
  is_scenario: boolean;
  description: string;
  source: string;
  /** Hazard footprint layers, ids in layer-store format (e.g. "p12", "v3"). */
  layers: { id: string; name: string }[];
}

export interface TabularDataset extends BaseDataset {
  dataType: "tabular";
}

export interface RasterDataset extends BaseDataset {
  dataType: "raster";
  /** When true, treated as categorical land cover; frontend auto-activates in Climate mode. */
  is_land_cover?: boolean;
}

export interface VectorDataset extends BaseDataset {
  dataType: "vector";
  /** Icon key for map display (e.g. mapPin, cross). Empty = auto from cluster/index. */
  icon?: string | null;
  /** Hex color for map markers (e.g. #3d4aff). Empty = auto from cluster/index. */
  color?: string | null;
}

export interface PMTilesDataset extends BaseDataset {
  dataType: "pmtiles";
}

export type Dataset =
  | TabularDataset
  | RasterDataset
  | VectorDataset
  | PMTilesDataset;

export interface ClusterDatasets {
  type: DatasetType;
  datasets: Dataset[];
}

export type DatasetType =
  | "baseline"
  | "estimated_damage"
  | "aid_resources_needed"
  | "estimate_financial_damage";

export interface TabularData {
  id: number;
  attribute: string;
  date: string;
  value: number;
  province?: string;
  area_council?: string;
  Unit?: string;
  [key: string]: string | number | undefined; // Allow other API fields
}

/** Response from tabular aggregate endpoint (group_by=province or area_council). */
export interface TabularAggregateResult {
  group_by: "province" | "area_council";
  year: string | null;
  attribute: string | null;
  agg: "sum" | "count" | "avg";
  results: Array<
    | { province: string; attribute: string; value: number }
    | { area_council: string; attribute: string; value: number }
  >;
}

export interface PaginatedVectorData {
  count: number;
  next: string | null;
  previous: string | null;
  type: "FeatureCollection";
  features: Feature[];
}
