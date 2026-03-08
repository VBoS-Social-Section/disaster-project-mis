import { useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import { leafletLayer, LineSymbolizer } from "protomaps-leaflet";
import type { PaintRule } from "protomaps-leaflet";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useFocusStore } from "@/store/focus-store";
import { useDateStore } from "@/store/date-store";
import { MAP_COLORS } from "../colors";
import { useColorMode } from "../ui/color-mode";

/**
 * Rewrite PMTiles URLs to use the backend proxy for byte-serving (Range requests).
 * Django's default media serving lacks Content-Length/Range support required by PMTiles.
 */
function resolvePmtilesUrl(url: string): string {
  try {
    // If it's already a full URL to the proxy, return it
    if (url.includes("/api/v1/pmtiles-serve/")) return url;

    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.includes("/media/") && parsed.pathname.endsWith(".pmtiles")) {
      const filename = parsed.pathname.split("/media/").pop();
      // Use relative path for the proxy so it works on both localhost and VM
      return `/api/v1/pmtiles-serve/${filename}`;
    }
  } catch {
    /* ignore */
  }
  return url;
}

export function PMTilesLayers() {
  const { layers } = useLayerStore();
  const pmTilesLayers = layers
    .split(",")
    .filter((i) => i.startsWith("p"))
    .map((i) => Number(i.slice(1)));

  return (
    <>
      {pmTilesLayers.map((layer) => (
        <PMTilesMapLayer id={layer} key={layer} />
      ))}
    </>
  );
}

type PMTilesMapLayerProps = {
  id: number;
};

function PMTilesMapLayer({ id }: PMTilesMapLayerProps) {
  const map = useMap();
  const { colorMode } = useColorMode();
  const mapPalette = MAP_COLORS[colorMode === "dark" ? "dark" : "light"];
  const layerId = `p${id}`;
  const { getLayerMetadata } = useLayerStore();
  const metadata = getLayerMetadata(layerId);
  const { year } = useDateStore();
  const { getOpacity } = useOpacityStore();
  const { getEffectiveOpacity } = useFocusStore();
  const opacity = getEffectiveOpacity(layerId, getOpacity(layerId) / 100);

  useEffect(() => {
    if (!map || !metadata?.url) return;

    const sourceLayer = metadata.source_layer || "default";
    const resolvedUrl = resolvePmtilesUrl(metadata.url);

    // Ensure PMTiles render above basemap and overlays (tilePane=200, overlayPane=400)
    const paneName = "pmtiles-pane";
    if (!map.getPane(paneName)) {
      const pane = map.createPane(paneName);
      if (pane) pane.style.zIndex = "450";
    }

    const paintRules: PaintRule[] = [
      {
        dataLayer: sourceLayer,
        symbolizer: new LineSymbolizer({
          color: mapPalette.areaCouncilBorder,
          width: 2,
          opacity,
        }),
        filter: (_z, f) => {
          const featYear = f?.props?.year;
          if (featYear == null || featYear === undefined || featYear === "") return true;
          return featYear === Number(year) || String(featYear) === String(year);
        },
      },
    ];

    const layer = leafletLayer({
      url: resolvedUrl,
      paintRules,
      labelRules: [],
      backgroundColor: "transparent",
      pane: paneName,
    });

    (layer as unknown as L.Layer).addTo(map);

    return () => {
      map.removeLayer(layer as unknown as L.Layer);
    };
  }, [map, metadata, year, opacity, mapPalette]);

  return null;
}
