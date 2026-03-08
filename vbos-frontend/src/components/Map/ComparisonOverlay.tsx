/**
 * Side-by-side year comparison overlay using leaflet-side-by-side.
 * Renders when comparison mode is on and a tabular layer is active.
 * Adds floating year labels on the split divider.
 */
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-side-by-side";
import { useComparisonStore } from "@/store/comparison-store";
import { useLayerStore } from "@/store/layer-store";
import { useAreaStore } from "@/store/area-store";
import useProvinces from "@/hooks/useProvinces";
import { useAdminAreaStatsForYear } from "@/hooks/useAdminAreaStatsForYear";
import { useOpacityStore } from "@/store/opacity-store";
import { MAP_COLORS, getChoroplethColor } from "../colors";
import { useColorMode } from "../ui/color-mode";
import { featureCollection } from "@turf/helpers";
import type { AreaCouncilGeoJSON, ProvincesGeoJSON } from "@/types/data";

// leaflet-side-by-side adds L.control.sideBySide when imported
const sideBySide = (L.control as unknown as { sideBySide?: (left: L.Layer, right: L.Layer, opts?: { padding?: number }) => L.Control }).sideBySide;

type SideBySideControl = L.Control & { _divider?: HTMLDivElement };

function addSwipeLabels(
  map: L.Map,
  yearLeft: string,
  yearRight: string,
  control: SideBySideControl,
): () => void {
  const container = map.getContainer();
  const hint = document.createElement("div");
  hint.style.cssText =
    "position:absolute;top:12px;left:0;right:0;pointer-events:none;z-index:1000;display:flex;justify-content:space-between;align-items:center;padding:0 16px;gap:8px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.95);text-shadow:0 1px 2px rgba(0,0,0,0.5)";
  const leftSpan = document.createElement("span");
  leftSpan.textContent = `${yearLeft} (Baseline)`;
  leftSpan.style.cssText = "padding:4px 10px;border-radius:6px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px)";
  const centerSpan = document.createElement("span");
  centerSpan.textContent = "Drag handle to compare";
  centerSpan.style.cssText = "opacity:0.85";
  const rightSpan = document.createElement("span");
  rightSpan.textContent = `${yearRight} (Compare)`;
  rightSpan.style.cssText = "padding:4px 10px;border-radius:6px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px)";
  hint.appendChild(leftSpan);
  hint.appendChild(centerSpan);
  hint.appendChild(rightSpan);
  container.style.position = "relative";
  container.appendChild(hint);

  const divider = control._divider;
  if (divider) {
    const yearDiv = document.createElement("div");
    yearDiv.className = "leaflet-sbs-year-divider";
    yearDiv.innerHTML = `<span>${yearLeft}</span><span>${yearRight}</span>`;
    divider.style.position = "relative";
    divider.appendChild(yearDiv);
  }

  return () => {
    hint.remove();
    const yd = divider?.querySelector(".leaflet-sbs-year-divider");
    if (yd) yd.remove();
  };
}

export function ComparisonOverlay() {
  const map = useMap();
  const { colorMode } = useColorMode();
  const mapPalette = MAP_COLORS[colorMode === "dark" ? "dark" : "light"];
  const controlRef = useRef<L.Control | null>(null);
  const leftLayerRef = useRef<L.GeoJSON | null>(null);
  const rightLayerRef = useRef<L.GeoJSON | null>(null);

  const { comparisonMode, comparisonView, yearLeft, yearRight } = useComparisonStore();
  const { layers } = useLayerStore();
  const { acList, provinces, acGeoJSON } = useAreaStore();
  const { data: provincesGeojson } = useProvinces();
  const { getOpacity } = useOpacityStore();

  const adminAreaGeoJSON: ProvincesGeoJSON | AreaCouncilGeoJSON =
    provinces.length > 0 && acGeoJSON.features.length > 0
      ? acGeoJSON
      : (provincesGeojson ?? featureCollection([]) as ProvincesGeoJSON);

  const { geojson: geojsonLeft, minValue: minLeft, maxValue: maxLeft } =
    useAdminAreaStatsForYear(adminAreaGeoJSON, yearLeft);
  const { geojson: geojsonRight, minValue: minRight, maxValue: maxRight } =
    useAdminAreaStatsForYear(adminAreaGeoJSON, yearRight);

  const tabularLayers = layers.split(",").filter((i) => i.startsWith("t"));
  const hasTabularLayer = tabularLayers.length > 0;
  const tabularOpacity = hasTabularLayer
    ? (getOpacity(tabularLayers[0]) ?? 100) / 100
    : 1;

  useEffect(() => {
    if (!comparisonMode || comparisonView !== "swipe" || !hasTabularLayer || !sideBySide) return;
    if (!geojsonLeft.features.length && !geojsonRight.features.length) return;

    const getStyle = (
      minVal: number,
      maxVal: number,
    ): ((feature?: GeoJSON.Feature) => L.PathOptions) => {
      return (feature?: GeoJSON.Feature) => {
        const value = feature?.properties?.value as number | undefined;
        const name = feature?.properties?.name as string | undefined;
        const nameInAcList =
          !name ||
          acList.length === 0 ||
          acList.some((a) => name.toLowerCase() === a.toLowerCase());
        if (typeof value !== "number" || !isFinite(value) || !nameInAcList) {
          return { fillOpacity: 0, stroke: false };
        }
        const t =
          maxVal !== minVal ? (value - minVal) / (maxVal - minVal) : 1;
        const fillColor = getChoroplethColor(t, mapPalette);
        const opacity = maxVal !== minVal ? 0.15 + t * 0.85 : 1;
        return {
          fillColor,
          fillOpacity: tabularOpacity * opacity,
          color: fillColor,
          weight: 1,
          opacity: 0.7,
        };
      };
    };

    // leaflet-side-by-side requires getContainer(); GeoJSON lacks it. Use separate panes
    // and attach getContainer so the plugin can clip each side.
    if (!map.getPane("sbs-left")) map.createPane("sbs-left");
    if (!map.getPane("sbs-right")) map.createPane("sbs-right");

    const leftLayer = L.geoJSON(geojsonLeft as GeoJSON.GeoJSON, {
      style: getStyle(minLeft, maxLeft),
      pane: "sbs-left",
    });
    const rightLayer = L.geoJSON(geojsonRight as GeoJSON.GeoJSON, {
      style: getStyle(minRight, maxRight),
      pane: "sbs-right",
    });

    (leftLayer as L.Layer & { getContainer?: () => HTMLElement }).getContainer = () =>
      map.getPane("sbs-left")!;
    (rightLayer as L.Layer & { getContainer?: () => HTMLElement }).getContainer = () =>
      map.getPane("sbs-right")!;

    leftLayer.addTo(map);
    rightLayer.addTo(map);

    const control = sideBySide(leftLayer, rightLayer, { padding: 44 });
    control.addTo(map);

    const cleanupLabels = addSwipeLabels(map, yearLeft, yearRight, control as SideBySideControl);

    controlRef.current = control;
    leftLayerRef.current = leftLayer;
    rightLayerRef.current = rightLayer;

    return () => {
      cleanupLabels?.();
      control.remove();
      map.removeLayer(leftLayer);
      map.removeLayer(rightLayer);
      controlRef.current = null;
      leftLayerRef.current = null;
      rightLayerRef.current = null;
    };
  }, [
    comparisonMode,
    comparisonView,
    hasTabularLayer,
    map,
    geojsonLeft,
    geojsonRight,
    minLeft,
    maxLeft,
    minRight,
    maxRight,
    tabularOpacity,
    acList,
    mapPalette,
  ]);

  return null;
}
