import { GeoJSON } from "react-leaflet";
import { useUiStore } from "@/store/ui-store";
import { featureCollection } from "@turf/helpers";
import L from "leaflet";
import useProvinces from "@/hooks/useProvinces";
import { useAreaStore } from "@/store/area-store";
import { useDeferredArea } from "@/hooks/useDeferredArea";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useFocusStore } from "@/store/focus-store";
import { useAdminAreaStats } from "@/hooks/useAdminAreaStats";
import { useComparisonStore } from "@/store/comparison-store";
import { MAP_COLORS, getChoroplethColor } from "../colors";
import { useColorMode } from "../ui/color-mode";
import type { AreaCouncilGeoJSON, ProvincesGeoJSON } from "@/types/data";
import type { PopupInfo } from "./index";

type AdminAreaMapLayersProps = {
  setPopupInfo: (info: PopupInfo | null) => void;
  activeFeatureName?: string;
};

const EMPTY_GEOJSON = featureCollection([]) as ProvincesGeoJSON;

export function AdminAreaMapLayers({
  setPopupInfo,
  activeFeatureName,
}: AdminAreaMapLayersProps) {
  const { colorMode } = useColorMode();
  const mapPalette = MAP_COLORS[colorMode === "dark" ? "dark" : "light"];
  const setMapHoverFeature = useUiStore((s) => s.setMapHoverFeature);
  const { comparisonMode } = useComparisonStore();
  const { data: provincesGeojson, isPending, error } = useProvinces();
  const { provinces, acList } = useDeferredArea();
  const acGeoJSON = useAreaStore((s) => s.acGeoJSON);
  const { layers, getLayerMetadata } = useLayerStore();
  const { getOpacity } = useOpacityStore();
  const { getEffectiveOpacity } = useFocusStore();
  const adminAreaGeoJSON: ProvincesGeoJSON | AreaCouncilGeoJSON =
    provinces.length > 0 && acGeoJSON.features.length > 0
      ? acGeoJSON
      : (provincesGeojson ?? EMPTY_GEOJSON);
  const {
    geojson: adminAreaStatsGeojson,
    maxValue,
    minValue,
  } = useAdminAreaStats(adminAreaGeoJSON);

  if (isPending || error) {
    return null;
  }

  const tabularLayers = layers.split(",").filter((i) => i.startsWith("t"));
  const activeTabularLayerId = tabularLayers.length ? tabularLayers[0] : null;
  const tabularOpacity = activeTabularLayerId
    ? getEffectiveOpacity(activeTabularLayerId, getOpacity(activeTabularLayerId) / 100)
    : 1;

  const getProvinceStyle = (feature?: GeoJSON.Feature) => {
    const name = feature?.properties?.name as string | undefined;
    const show =
      provinces.length === 0 ||
      (name && provinces.some((p) => name.toUpperCase() === p.toUpperCase()));
    return {
      color: mapPalette.provinceBorder,
      weight: acList.length > 0 ? 1 : 2,
      opacity: acList.length > 0 ? 0.5 : show ? 1 : 0,
      fill: false,
      fillOpacity: 0,
    };
  };

  const getAreaCouncilStyle = (feature?: GeoJSON.Feature) => {
    const name = feature?.properties?.name as string | undefined;
    const show =
      acList.length === 0 ||
      (name && acList.some((a) => name.toLowerCase() === a.toLowerCase()));
    return {
      color: mapPalette.areaCouncilBorder,
      weight: acList.length > 0 ? 2 : 1.5,
      opacity: acList.length > 0 ? 1 : show ? 0.5 : 0,
      fill: false,
      fillOpacity: 0,
    };
  };

  const getStatsStyle = (feature?: GeoJSON.Feature) => {
    const value = feature?.properties?.value as number | undefined;
    const name = feature?.properties?.name as string | undefined;
    const nameInAcList =
      !name ||
      acList.length === 0 ||
      acList.some((a) => name.toLowerCase() === a.toLowerCase());
    if (typeof value !== "number" || !isFinite(value) || !nameInAcList) {
      return { fillOpacity: 0, stroke: false };
    }
    const t = maxValue !== minValue
      ? (value - minValue) / (maxValue - minValue)
      : 1;
    const fillColor = getChoroplethColor(t, mapPalette);
    const opacity = maxValue !== minValue ? 0.15 + t * 0.85 : 1;
    const isActive = activeFeatureName && name?.toLowerCase() === activeFeatureName.toLowerCase();
    return {
      fillColor,
      fillOpacity: tabularOpacity * opacity,
      color: isActive ? mapPalette.choroplethLow : fillColor,
      weight: isActive ? 4 : 1,
      opacity: isActive ? 1 : 0.7,
      className: isActive ? "selected-map-feature" : undefined,
    };
  };

  const hoverHandlers = {
    mouseover: () => setMapHoverFeature(true),
    mouseout: () => setMapHoverFeature(false),
  };

  const buildStatsTooltip = (props: Record<string, unknown>) => {
    const name = props.name as string | undefined;
    const value = props.value as number | undefined;
    const lines: string[] = [];
    if (name) lines.push(`<strong>${name}</strong>`);
    if (typeof value === "number" && isFinite(value)) {
      lines.push(value.toLocaleString(undefined, { maximumFractionDigits: 1 }));
    }
    return lines.length ? lines.join("<br/>") : null;
  };

  const onEachStatsFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const tooltipContent = buildStatsTooltip(feature.properties || {});
    if (tooltipContent) {
      (layer as L.Path).bindTooltip(tooltipContent, {
        permanent: false,
        direction: "top",
        className: "admin-area-tooltip",
        offset: [0, -4],
        opacity: 0.95,
        interactive: false,
      });
    }
    layer.on({
      ...hoverHandlers,
      click: (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        const tabularLayers = layers.split(",").filter((i) => i.startsWith("t"));
        const metadata = tabularLayers.length ? getLayerMetadata(tabularLayers[0]) : undefined;
        setPopupInfo({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          properties: feature.properties || {},
          datasetName: metadata?.name,
          datasetId: tabularLayers[0] || "",
        });
      },
    });
  };

  const onEachBoundaryFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const name = (feature.properties?.name as string) || "Area";
    (layer as L.Path).bindTooltip(`<strong>${name}</strong>`, {
      permanent: false,
      direction: "top",
      className: "admin-area-tooltip",
      offset: [0, -4],
      opacity: 0.95,
      interactive: false,
    });
    layer.on(hoverHandlers);
  };

  return (
    <>
      {acGeoJSON && (
        <GeoJSON
          key="area-councils"
          data={acGeoJSON}
          style={getAreaCouncilStyle}
          onEachFeature={(feat, layer) => onEachBoundaryFeature(feat, layer)}
        />
      )}
      {provincesGeojson && (
        <GeoJSON
          key="provinces"
          data={provincesGeojson}
          style={getProvinceStyle}
          onEachFeature={(feat, layer) => onEachBoundaryFeature(feat, layer)}
        />
      )}
      {!comparisonMode &&
      adminAreaStatsGeojson.features.length > 0 &&
      (maxValue !== 0 || minValue !== 0) && (
        <GeoJSON
          key="stats"
          data={adminAreaStatsGeojson}
          style={getStatsStyle}
          onEachFeature={onEachStatsFeature}
        />
      )}
    </>
  );
}
