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
  cluster: string; // Cluster name, not ID
  type: DatasetType;
  source: string | null;
  unit?: string | null;
  filename_id?: string;
  titiler_url_params?: string;
  url?: string;
  source_layer?: string;
}

export interface TabularDataset extends BaseDataset {
  dataType: "tabular";
}

export interface RasterDataset extends BaseDataset {
  dataType: "raster";
}

export interface VectorDataset extends BaseDataset {
  dataType: "vector";
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

export interface PaginatedVectorData {
  count: number;
  next: string | null;
  previous: string | null;
  type: "FeatureCollection";
  features: Feature[];
}
