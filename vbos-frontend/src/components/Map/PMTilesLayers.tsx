import { Layer, Source, LayerProps } from "react-map-gl/maplibre";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { mapColors } from "../colors";
import { useDateStore } from "@/store/date-store";

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
  const layerId = `p${id}`;
  const { getLayerMetadata } = useLayerStore();
  const metadata = getLayerMetadata(layerId);

  const { year } = useDateStore();

  // Get opacity from store (0-100) and convert to 0-1 for MapLibre
  const { getOpacity } = useOpacityStore();
  const opacity = getOpacity(layerId) / 100;

  const lineStyle: LayerProps = {
    type: "line",
    paint: {
      "line-width": 2,
      "line-color": mapColors.red,
      "line-opacity": opacity,
    },
    source: layerId,
    "source-layer": metadata?.source_layer || "",
    filter: ["==", "year", Number(year)],
  };

  if (metadata) {
    return (
      <Source id={layerId} type="vector" url={`pmtiles://${metadata?.url}`}>
        <Layer {...lineStyle} />
      </Source>
    );
  }
}
