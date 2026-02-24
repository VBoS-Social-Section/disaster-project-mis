import { useState } from "react";
import {
  Box,
  HStack,
  IconButton,
  Skeleton,
  Stat,
  Text,
} from "@chakra-ui/react";
import {
  LuChartColumnBig,
  LuChartLine,
  LuCircleX,
  LuList,
} from "react-icons/lu";
import { useDateStore } from "@/store/date-store";
import { useLayerStore } from "@/store/layer-store";
import { useUiStore } from "@/store/ui-store";
import { DATASET_TYPES } from "@/utils/datasetTypes";
import { Dataset } from "@/types/api";
import { getAttributes, getAttributeValueSum } from "@/utils/getAttributes";
import { StatsChart } from "./StatsChart";
import { StatsTable } from "./StatsTable";
import { Tooltip } from "../ui";
import { abbreviateUnit } from "@/utils/abbreviateUnit";

export function Stats() {
  const [visMode, setVisMode] = useState<"chart" | "table">("chart");
  const { layers, tabularLayerData, getLayerMetadata, switchLayer } =
    useLayerStore();
  const { year } = useDateStore();
  const { toggleTimeSeries, isTimeSeriesOpen } = useUiStore();
  const filteredData = tabularLayerData.filter((i) => i.date.startsWith(year));
  const tabularLayerId = layers.split(",").find((i) => i.startsWith("t"));
  const layerMetadata: Dataset | undefined = tabularLayerId
    ? getLayerMetadata(tabularLayerId)
    : undefined;
  const attributes = getAttributes(filteredData);
  const unit = layerMetadata
    ? layerMetadata?.unit === "number"
      ? undefined
      : abbreviateUnit(layerMetadata?.unit)
    : undefined;

  // Sort attributes by their total values (highest to lowest)
  const sortedAttributes = attributes
    .map((attr) => ({
      name: attr,
      total: getAttributeValueSum(filteredData, attr),
    }))
    .sort((a, b) => b.total - a.total)
    .map((item) => item.name);

  if (!tabularLayerId) {
    return null;
  }

  // this is not a very reliable way to check if the data is still loading,
  //  but it's what we have now
  if (tabularLayerData.length === 0 && filteredData.length === 0) {
    return (
      <Box mt={4} borderColor="black.700" borderWidth={2} borderRadius={5}>
        <Box
          backgroundColor="gray.100"
          px={2}
          py={3}
          display="flex"
          alignItems="center"
        >
          <Box flex="1">
            <Skeleton height={2} width="80%" mb={2} />
            <Skeleton height={3} />
          </Box>
          <Box display="flex" flexDirection="row">
            <IconButton size="xs" variant="ghost" disabled>
              <LuChartLine />
            </IconButton>
            <IconButton size="xs" variant="ghost" disabled>
              <LuList />
            </IconButton>
            <IconButton size="xs" variant="ghost" disabled>
              <LuCircleX />
            </IconButton>
          </Box>
        </Box>
        <Box p={2}>
          <Skeleton w="50%" h={4} mb={2} />
          <Skeleton h={20} />
        </Box>
      </Box>
    );
  }

  if (!layerMetadata) {
    return (
      <Box display="block" p={2} fontSize="sm">
        No data available for the selected year or administrative area. Please
        select a different time period or area.
      </Box>
    );
  }

  if (layerMetadata) {
    return (
      <Box
        mt={4}
        borderColor="black.700"
        borderWidth={2}
        borderRadius={5}
        overflow="hidden"
      >
        <Box
          backgroundColor="gray.100"
          px={2}
          py={3}
          display="flex"
          alignItems="center"
        >
          <Box flex="1">
            <Text display="block" fontSize="xs" color="gray.600">
              {layerMetadata.cluster} | {DATASET_TYPES[layerMetadata.type]}
            </Text>
            <Text display="block">{layerMetadata.name}</Text>
          </Box>
          <Box display="flex" flexDirection="row">
            <Tooltip content="View time series">
              <IconButton
                size="xs"
                variant={isTimeSeriesOpen ? "solid" : "ghost"}
                colorPalette="blue"
                onClick={toggleTimeSeries}
                disabled={filteredData.length === 0}
              >
                <LuChartLine />
              </IconButton>
            </Tooltip>
            <Tooltip
              content={`Switch to ${
                visMode === "table" ? "chart" : "table"
              } view`}
            >
              <IconButton
                size="xs"
                variant="ghost"
                colorPalette="blue"
                onClick={() =>
                  setVisMode(visMode === "table" ? "chart" : "table")}
                disabled={filteredData.length === 0}
              >
                {visMode === "table" ? <LuChartColumnBig /> : <LuList />}
              </IconButton>
            </Tooltip>
            <Tooltip content="Remove layer from map">
              <IconButton
                size="xs"
                variant="ghost"
                _hover={{ color: "fg.error" }}
                onClick={() => switchLayer(tabularLayerId)}
              >
                <LuCircleX />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        {filteredData.length === 0 ? (
          <Box display="block" p={2} fontSize="sm">
            No data is available for the selected year or administrative area.
            Please select a different time period or area.
          </Box>
        ) : (
          <Box display="block">
            {/* Stats display */}
            <HStack gap="3" width="100%" p={2} overflow="auto">
              {/* Only show top 4 stat items */}
              {sortedAttributes.slice(0, 4).map((attr: string) => (
                <Stat.Root
                  size="sm"
                  gap={0}
                  flex="1"
                  textAlign="right"
                  alignItems="flex-end"
                  pr={2}
                  borderRight="1px solid"
                  borderColor="border.muted"
                  _last={{ borderRight: "none", paddingRight: 0 }}
                >
                  <Stat.Label
                    textTransform="capitalize"
                    fontSize="xs"
                    color="fg.subtle"
                    lineHeight={1.2}
                  >
                    {attr}
                  </Stat.Label>
                  <Stat.ValueText
                    fontSize="md"
                    lineHeight={1.2}
                    fontWeight="500"
                    display="inline-flex"
                    alignItems="baseline"
                  >
                    {getAttributeValueSum(filteredData, attr).toLocaleString()}
                    {unit && (
                      <Box
                        as="span"
                        fontWeight="400"
                        fontSize="sm"
                        color="fg.muted"
                      >
                        {`${unit}`}
                      </Box>
                    )}
                  </Stat.ValueText>
                </Stat.Root>
              ))}
            </HStack>
            {visMode === "chart" && (
              <StatsChart stats={filteredData} unit={unit} />
            )}
            {visMode === "table" && (
              <StatsTable stats={filteredData} unit={unit} />
            )}
          </Box>
        )}
      </Box>
    );
  }
}
