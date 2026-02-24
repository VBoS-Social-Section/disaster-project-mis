import { useEffect } from "react";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { useDataset } from "@/hooks/useDataset";
import { useAreaStore } from "@/store/area-store";
import { useLayerStore } from "@/store/layer-store";

export function TabularLayers() {
  const { layers } = useLayerStore();
  const tabularLayers = layers
    .split(",")
    .filter((i) => i.startsWith("t"))
    .map((i) => Number(i.slice(1)));

  const layer = tabularLayers.length ? tabularLayers[0] : null;

  if (layer) return <TabularDatasetMapLayer id={layer} />;
}

type TabularDatasetMapLayerProps = {
  id: number;
};

function TabularDatasetMapLayer({ id }: TabularDatasetMapLayerProps) {
  // load ac and province and set filters
  const { ac, province } = useAreaStore();
  const { setTabularLayerData } = useLayerStore();
  const filters = new URLSearchParams();
  if (ac) filters.set("area_council", ac);
  if (province) filters.set("province", province);

  const { data, isPending } = useDataset("tabular", id, filters);

  useEffect(() => {
    if (data && "results" in data && Array.isArray(data.results)) {
      setTabularLayerData(data.results);
    } else {
      setTabularLayerData([]);
    }
  }, [setTabularLayerData, data]);

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

  return null;
}
