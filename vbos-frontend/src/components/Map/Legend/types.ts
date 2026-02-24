/**
 * Types for the Map Legend component system.
 *
 * The legend displays metadata about currently active layers on the map,
 * allowing users to understand what data is being visualized.
 */

import { Dataset } from "@/types/api";

/**
 * Legend entry for tabular (statistical) layers.
 * Tabular layers are visualized as choropleth maps on admin boundaries.
 */
export type TabularLegendLayer = Dataset & {
  dataType: "tabular";
  /** Color scheme used for choropleth visualization */
  colorScheme: "sequential" | "diverging" | "categorical";
  /** Optional min/max values for the current data range */
  dataRange?: {
    min: number;
    max: number;
  };
  /** Whether the data is currently being loaded */
  isPending?: boolean;
  /** Whether there is data available for current filters (time/place) */
  hasData?: boolean;
};

/**
 * Legend entry for vector (geometry) layers.
 * Vector layers display points, lines, or polygons loaded from GeoJSON.
 */
export type VectorLegendLayer = Dataset & {
  dataType: "vector" | "pmtiles";
  /** Primary geometry type in this layer */
  geometryType:
    | "Point"
    | "LineString"
    | "Polygon"
    | "MultiPoint"
    | "MultiLineString"
    | "MultiPolygon";
  /** Color used to render this layer */
  color: string;
};

/**
 * Legend entry for raster (imagery/grid) layers.
 * Raster layers display continuous data like satellite imagery or elevation.
 */
export type RasterLegendLayer = Dataset & {
  dataType: "raster";
  /** Color scheme or palette description */
  colorScheme?: string;
  /** Optional opacity/transparency level */
  opacity?: number;
};

/**
 * Union type representing any type of legend layer.
 */
export type LegendLayer =
  | TabularLegendLayer
  | VectorLegendLayer
  | RasterLegendLayer;

/**
 * Action types that can be performed on legend layers.
 */
export type LayerActionType = "toggle" | "remove" | "opacity";

/**
 * Details about a layer action event.
 */
export type LayerActionDetails =
  | {
      action: "remove" | "toggle";
      payload: {
        layer: LegendLayer;
      };
    }
  | {
      action: "opacity";
      payload: {
        layer: LegendLayer;
        opacity: number;
      };
    };
