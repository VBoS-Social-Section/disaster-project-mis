import { Layer, Source, LayerProps } from "react-map-gl/maplibre";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useDataset } from "@/hooks/useDataset";
import { PaginatedVectorData } from "@/types/api";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { useAreaStore } from "@/store/area-store";
import { mapColors } from "../colors";

export function VectorLayers() {
  const { layers } = useLayerStore();
  const vectorLayers = layers
    .split(",")
    .filter((i) => i.startsWith("v"))
    .map((i) => Number(i.slice(1)));

  return (
    <>
      {vectorLayers.map((layer) => (
        <VectorMapLayer id={layer} key={layer} />
      ))}
    </>
  );
}

type VectorMapLayerProps = {
  id: number;
};

function VectorMapLayer({ id }: VectorMapLayerProps) {
  const layerId = `v${id}`;
  const { getOpacity } = useOpacityStore();

  // load ac and province and set filters
  const { ac, province } = useAreaStore();
  const filters = new URLSearchParams();
  if (ac) filters.set("area_council", ac);
  if (province) filters.set("province", province);

  const { data, isPending, error } = useDataset("vector", id, filters);

  if (error) return null;
  if (isPending)
    return (
      <Box
        position="relative"
        display="inline-block"
        p={2}
        m={1}
        opacity={0.8}
        bgColor="white"
      >
        <Spinner size="sm" />
        <Text display="inline" pl={1}>
          Loading dataset layer {id}
        </Text>
      </Box>
    );

  // Get opacity from store (0-100) and convert to 0-1 for MapLibre
  const opacity = getOpacity(layerId) / 100;

  const lineStyle: LayerProps = {
    type: "line",
    paint: {
      "line-color": mapColors.orange,
      "line-opacity": opacity,
    },
    source: layerId,
  };
  const pointStyle: LayerProps = {
    type: "circle",
    paint: {
      "circle-color": mapColors.blue,
      "circle-opacity": opacity,
    },
    source: layerId,
    filter: ["==", ["geometry-type"], "Point"],
  };

  if (data) {
    return (
      <Source id={layerId} type="geojson" data={data as PaginatedVectorData}>
        <Layer {...lineStyle} />
        <Layer {...pointStyle} />
      </Source>
    );
  }
}
