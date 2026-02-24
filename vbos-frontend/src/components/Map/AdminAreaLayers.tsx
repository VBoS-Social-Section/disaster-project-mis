import { useEffect } from "react";
import { Layer, Source, LayerProps, MapRef } from "react-map-gl/maplibre";
import { featureCollection } from "@turf/helpers";
import useProvinces from "@/hooks/useProvinces";
import { useAreaStore } from "@/store/area-store";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useAdminAreaStats } from "@/hooks/useAdminAreaStats";
import { mapColors } from "../colors";
import type { AreaCouncilGeoJSON, ProvincesGeoJSON } from "@/types/data";

type AdminAreaMapLayers = {
  fitBounds?: MapRef["fitBounds"];
};

const EMPTY_GEOJSON = featureCollection([]) as ProvincesGeoJSON;

export function AdminAreaMapLayers({ fitBounds }: AdminAreaMapLayers) {
  const { data: provincesGeojson, isPending, error } = useProvinces();
  const { ac, province, acGeoJSON } = useAreaStore();
  const { layers } = useLayerStore();
  const { getOpacity } = useOpacityStore();
  const adminAreaGeoJSON: ProvincesGeoJSON | AreaCouncilGeoJSON =
    province && acGeoJSON ? acGeoJSON : (provincesGeojson ?? EMPTY_GEOJSON);
  const {
    geojson: adminAreaStatsGeojson,
    maxValue,
    minValue,
  } = useAdminAreaStats(adminAreaGeoJSON);

  useEffect(() => {
    if (fitBounds && !province)
      fitBounds([-194.18335, -20.50641, -189.9646, -12.84665]);
  }, [province, fitBounds]);

  if (isPending || error) {
    return null;
  }

  // Get the active tabular layer ID to apply opacity
  const tabularLayers = layers.split(",").filter((i) => i.startsWith("t"));
  const activeTabularLayerId = tabularLayers.length ? tabularLayers[0] : null;

  // Get opacity for the tabular layer (0-100) and convert to 0-1
  const tabularOpacity = activeTabularLayerId
    ? getOpacity(activeTabularLayerId) / 100
    : 1;

  const provinceLayerStyle: LayerProps = {
    type: "line",
    paint: {
      "line-color": mapColors.blueLight,
      "line-width": ac ? 1 : 2,
      "line-opacity": ac ? 0.5 : 1,
    },
    source: "provinces",
    filter: province ? ["==", "name", province.toUpperCase()] : ["all"],
  };
  const areaCouncilLayerStyle: LayerProps = {
    type: "line",
    paint: {
      "line-color": mapColors.blueLight,
      "line-width": ac ? 2 : 1,
      "line-opacity": ac ? 1 : 0.125,
    },
    source: "area-councils",
    filter: ac ? ["==", "name", ac] : ["all"],
  };
  const fillStyle: LayerProps = {
    type: "fill",
    paint: {
      "fill-color": mapColors.purple,
      "fill-opacity": [
        "*",
        tabularOpacity,
        [
          "interpolate",
          ["linear"],
          ["get", "value"],
          minValue,
          0.1,
          maxValue,
          1,
        ],
      ],
    },
    source: "stats",
    filter: ac ? ["==", "name", ac] : ["all"],
  };

  return (
    <>
      {acGeoJSON && (
        <Source id="area-councils" type="geojson" data={acGeoJSON}>
          <Layer {...areaCouncilLayerStyle} id="area-councils" />
        </Source>
      )}
      {provincesGeojson && (
        <Source id="provinces" type="geojson" data={provincesGeojson}>
          <Layer
            {...provinceLayerStyle}
            beforeId="area-councils"
            id="provinces"
          />
        </Source>
      )}
      {adminAreaStatsGeojson.features.length &&
      (maxValue !== 0 || minValue !== 0) && (
        <Source id="stats" type="geojson" data={adminAreaStatsGeojson}>
          <Layer {...fillStyle} beforeId="area-councils" id="stats" />
        </Source>
      )}
    </>
  );
}
