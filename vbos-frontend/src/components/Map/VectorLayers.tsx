import { useMemo } from "react";
import { GeoJSON } from "react-leaflet";
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import { simplify } from "@turf/simplify";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useFocusStore } from "@/store/focus-store";
import { useDataset } from "@/hooks/useDataset";
import { useMapStore } from "@/store/map-store";
import { useMapBbox } from "@/hooks/useMapBbox";
import { Skeleton } from "@/components/ui/skeleton";
import { VECTOR_LAYER_COLORS, VECTOR_CLUSTER_COLORS } from "../colors";
import {
  buildVectorMarkerIcon,
  getVectorIconKey,
} from "./vectorIcons";
import type { PopupInfo } from "./index";
import { useEventIntensity } from "@/hooks/useEventIntensity";
import { categoryStyle } from "@/config/disaster";

type VectorLayersProps = {
  setPopupInfo: (info: PopupInfo | null) => void;
};

export function VectorLayers({ setPopupInfo }: VectorLayersProps) {
  const { layers } = useLayerStore();
  const bbox = useMapBbox();
  const vectorLayers = layers
    .split(",")
    .filter((i) => i.startsWith("v"))
    .map((i) => Number(i.slice(1)));

  return (
    <>
      {vectorLayers.map((layer, colorIndex) => (
        <VectorMapLayer
          key={layer}
          id={layer}
          colorIndex={colorIndex}
          setPopupInfo={setPopupInfo}
          bbox={bbox}
        />
      ))}
    </>
  );
}

type VectorMapLayerProps = {
  id: number;
  colorIndex: number;
  setPopupInfo: (info: PopupInfo | null) => void;
  bbox: string;
};

const CLUSTER_THRESHOLD = 15;
/** From this zoom every point is drawn on its own. */
const UNCLUSTER_ZOOM = 16;
const SIMPLIFY_ZOOM_THRESHOLD = 10;
/** Max features to render; prevents browser freeze on large datasets (e.g. Roads). */
const FEATURE_CAP = 2500;
/** Skip tooltips when feature count exceeds this (reduces DOM load). */
const TOOLTIP_SKIP_THRESHOLD = 500;

function VectorMapLayer({ id, colorIndex, setPopupInfo, bbox }: VectorMapLayerProps) {
  const layerId = `v${id}`;
  const { getLayerMetadata } = useLayerStore();
  const { getOpacity } = useOpacityStore();
  const { getEffectiveOpacity } = useFocusStore();
  const zoom = useMapStore((s) => s.viewState.zoom);
  // With an event selected, a facility inside a wind zone is ringed in the category colour
  // and badged with the category number
  const { rankOf, hasData: hasIntensity, event } = useEventIntensity();
  const filters = useMemo(() => {
    const p = new URLSearchParams();
    p.set("in_bbox", bbox);
    return p;
  }, [bbox]);
  const { data, isPending, error } = useDataset("vector", id, filters);

  const opacity = getEffectiveOpacity(layerId, getOpacity(layerId) / 100);

  const { displayData, useClustering, featureCount } = useMemo(() => {
    if (!data || !("features" in data)) {
      return { displayData: null, useClustering: false, featureCount: 0 };
    }
    let features = data.features;
    const pointCount = features.filter(
      (f) => f.geometry?.type === "Point" || f.geometry?.type === "MultiPoint",
    ).length;
    
    // Group points whenever there are enough to overlap; the cluster group itself stops
    // grouping at street level (disableClusteringAtZoom) where icons no longer collide.
    const useClustering = pointCount >= CLUSTER_THRESHOLD;

    // Cap features to prevent browser freeze on large datasets (e.g. Roads)
    if (features.length > FEATURE_CAP) {
      features = features.slice(0, FEATURE_CAP);
    }

    const hasPolygons = features.some(
      (f) =>
        f.geometry?.type === "Polygon" ||
        f.geometry?.type === "MultiPolygon",
    );
    const shouldSimplify =
      (zoom < SIMPLIFY_ZOOM_THRESHOLD && features.length > 100) ||
      features.length > 500 ||
      (hasPolygons && features.length > 10); // Always simplify polygon layers (e.g. area councils)
    let displayData: typeof data = { ...data, features };

    if (shouldSimplify) {
      const tolerance =
        features.length > 500
          ? 0.02 * Math.pow(2, Math.max(0, SIMPLIFY_ZOOM_THRESHOLD - zoom))
          : hasPolygons && features.length <= 100
            ? 0.02 * Math.pow(2, Math.max(0, SIMPLIFY_ZOOM_THRESHOLD - zoom))
            : 0.01 * Math.pow(2, SIMPLIFY_ZOOM_THRESHOLD - zoom);
      try {
        displayData = {
          ...data,
          features: features.map((f) => {
            const t = f.geometry?.type;
            if (
              t === "LineString" ||
              t === "Polygon" ||
              t === "MultiLineString" ||
              t === "MultiPolygon"
            ) {
              try {
                return simplify(
                  f as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.LineString>,
                  { tolerance, highQuality: true },
                );
              } catch {
                return f;
              }
            }
            return f;
          }),
        };
      } catch {
        // Fallback to original if simplify fails
      }
    }

    return { displayData, useClustering, featureCount: displayData.features.length };
  }, [data, zoom]);

  const metadata = getLayerMetadata(layerId);
  const cluster = metadata?.cluster;
  const datasetColor =
    metadata && "color" in metadata && metadata.color
      ? metadata.color
      : undefined;
  const layerColor =
    datasetColor ??
    (cluster && VECTOR_CLUSTER_COLORS[cluster.toLowerCase().trim()]) ??
    VECTOR_LAYER_COLORS[colorIndex % VECTOR_LAYER_COLORS.length];
  const iconKey = getVectorIconKey(
    colorIndex,
    cluster,
    metadata && "icon" in metadata ? metadata.icon : undefined,
  );

  const getStyle = (feat?: GeoJSON.Feature) => {
    const geomType = feat?.geometry?.type;
    if (geomType === "Point") return {};
    const props = feat?.properties as Record<string, unknown> | undefined;
    const fillColor =
      (props?.intensity_color as string) || layerColor;
    return {
      color: fillColor,
      fillColor,
      fillOpacity: opacity,
      weight: 1,
      opacity,
      renderer: L.canvas(),
    };
  };

  const pointToLayer = (feature: GeoJSON.Feature, latlng: L.LatLng) => {
    const rank = hasIntensity
      ? (rankOf(feature.properties?.area_council as string | undefined) ?? 0)
      : 0;
    let html = buildVectorMarkerIcon(layerColor, iconKey, opacity);
    if (rank > 0) {
      const { color, text } = categoryStyle(rank);
      html = `<div class="hazard-marker" style="--hazard:${color};--hazard-text:${text}">${html}<span class="hazard-marker__badge">${rank}</span></div>`;
    }
    const icon = L.divIcon({
      html,
      className: "vector-marker-div-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    return L.marker(latlng, { icon });
  };

  const toSentenceCase = (str: string) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  const buildTooltipContent = (
    props: Record<string, unknown>,
    datasetName?: string,
    featureId?: number,
  ) => {
    const lines: string[] = [];
    if (datasetName) lines.push(`<strong>${datasetName}</strong>`);
    if (featureId != null) lines.push(`<strong>ID ${featureId}</strong>`);
    const rank = hasIntensity ? rankOf(props.area_council as string | undefined) : undefined;
    if (rank && event) lines.push(`${event.name}: Category ${rank} zone`);
    Object.entries(props)
      .filter(([key]) => !["id", "ref", "metadata"].includes(key))
      .forEach(([key, value]) => {
        const v = value !== null && value !== undefined ? String(value) : "N/A";
        lines.push(`${toSentenceCase(key)}: ${v}`);
      });
    return lines.join("<br/>");
  };

  const onEachFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const props = feature.properties || {};
    const metadata = getLayerMetadata(layerId);
    const featureId =
      (feature as GeoJSON.Feature & { id?: number }).id ??
      (props.id as number | undefined);
    // Skip tooltips for large layers to reduce DOM load and prevent freeze
    if (featureCount <= TOOLTIP_SKIP_THRESHOLD) {
      const tooltipContent = buildTooltipContent(props, metadata?.name, featureId);
      if (tooltipContent) {
        (layer as L.Marker | L.Path).bindTooltip(tooltipContent, {
          permanent: false,
          direction: "top",
          className: "vector-marker-tooltip",
          offset: [0, -8],
        });
      }
    }
    layer.on({
      click: (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        setPopupInfo({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          properties: props,
          datasetName: metadata?.name,
          datasetId: layerId,
          featureId,
        });
      },
    });
  };

  if (error) return null;
  if (isPending)
    return (
      <div className="absolute left-2 top-2 z-[1000] m-1 rounded-md bg-background p-2 shadow-sm opacity-95" role="status" aria-label="Loading vector layer">
        <Skeleton className="mb-1 h-4 w-[140px]" />
        <p className="text-xs text-muted-foreground">
          Loading dataset layer {id}
        </p>
      </div>
    );

  if (!displayData || !("features" in displayData)) return null;

  const geoJson = (
    <GeoJSON
      // Leaflet builds markers once per GeoJSON layer: re-key when the event changes
      key={`${layerId}-opacity-${Math.round(opacity * 100)}-event-${hasIntensity ? event?.id : "none"}`}
      data={displayData}
      style={getStyle}
      pointToLayer={pointToLayer}
      onEachFeature={onEachFeature}
    />
  );

  if (useClustering) {
    return (
      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={36}
        disableClusteringAtZoom={UNCLUSTER_ZOOM}
        showCoverageOnHover={false}
      >
        {geoJson}
      </MarkerClusterGroup>
    );
  }

  return geoJson;
}
