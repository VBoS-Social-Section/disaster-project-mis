import { Layer, Source, LayerProps } from "react-map-gl/maplibre";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useDateStore } from "@/store/date-store";
import { useCheckRasterLayer } from "@/hooks/useCheckRasterLayer";

export function RasterLayers() {
  const { layers } = useLayerStore();
  const vectorLayers = layers
    .split(",")
    .filter((i) => i.startsWith("r"))
    .map((i) => Number(i.slice(1)));

  return (
    <>
      {vectorLayers.map((layer) => (
        <RasterMapLayer id={layer} key={layer} />
      ))}
    </>
  );
}

type RasterMapLayerProps = {
  id: number;
};

function RasterMapLayer({ id }: RasterMapLayerProps) {
  const layerId = `r${id}`;
  const { year } = useDateStore();
  const { getLayerMetadata } = useLayerStore();
  const metadata = getLayerMetadata(layerId);
  const datasetUrlId = metadata?.filename_id || "";
  const urlParams = metadata?.titiler_url_params
    ? `?${metadata.titiler_url_params}`
    : "";

  // Get opacity from store (0-100) and convert to 0-1 for MapLibre
  const { getOpacity } = useOpacityStore();
  const opacity = getOpacity(layerId) / 100;

  // Check if there is a raster layer for the selected year
  const { error } = useCheckRasterLayer(datasetUrlId, year);
  if (error) return null;

  const layerStyle: LayerProps = {
    type: "raster",
    paint: {
      "raster-opacity": opacity,
    },
  };

  return (
    <Source
      id={layerId}
      type="raster"
      tileSize={256}
      tiles={[
        `${import.meta.env.VITE_TITILER_API}/dataset/${datasetUrlId}/years/${year}/tiles/WebMercatorQuad/{z}/{x}/{y}.png${urlParams}`,
      ]}
    >
      <Layer id={layerId} source={layerId} {...layerStyle} />
    </Source>
  );
}
