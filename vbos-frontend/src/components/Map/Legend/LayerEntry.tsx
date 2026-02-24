/**
 * LayerEntry component renders a single layer's legend information.
 *
 * Displays layer name, visualization style, and provides controls for
 * toggling visibility or removing the layer from the map.
 */

import { useState } from "react";
import {
  Box,
  Text,
  IconButton,
  HStack,
  VStack,
  Skeleton,
} from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/Tooltip";
import { LuX, LuInfo, LuDroplet } from "react-icons/lu";
import { OpacityControl } from "./OpacityControl";
import { LayerInfoModal } from "./LayerInfoModal";

import type {
  LegendLayer,
  TabularLegendLayer,
  VectorLegendLayer,
  RasterLegendLayer,
} from "./types";
import { mapColors } from "../../colors";
import { abbreviateUnit } from "@/utils/abbreviateUnit";

/**
 * Props for the LayerEntry component.
 */
type LayerEntryProps = LegendLayer & {
  switchLayer: (layerId: string) => void;
  setOpacity: (layerId: string, opacity: number) => void;
};

/**
 * Main LayerEntry component that delegates to specific layer type renderers.
 */
export function LayerEntry(props: LayerEntryProps) {
  const {
    dataType,
    id,
    name,
    switchLayer,
    setOpacity: setOpacityStore,
  } = props;
  const [infoOpen, setInfoOpen] = useState(false);
  const [opacity, setOpacity] = useState(100);

  const layerId = `${dataType.charAt(0)}${id}`;

  const handleRemove = () => {
    switchLayer(layerId);
  };

  const handleOpacityChange = (newOpacity: number) => {
    setOpacity(newOpacity);
    setOpacityStore(layerId, newOpacity);
  };

  return (
    <>
      <VStack w="100%" align="flex-start" gap={2}>
        <HStack w="full">
          <Text fontWeight="medium" fontSize="sm" lineClamp={1} mr="auto">
            {name}
          </Text>
          {/* Control buttons */}
          <HStack gap={0} flexShrink={0}>
            {/* Info button */}
            <Tooltip content="Layer info" positioning={{ placement: "top" }}>
              <IconButton
                aria-label="Layer info"
                size="xs"
                variant="ghost"
                onClick={() => setInfoOpen(true)}
              >
                <LuInfo />
              </IconButton>
            </Tooltip>

            {/* Opacity control */}
            <OpacityControl value={opacity} onValueChange={handleOpacityChange}>
              <IconButton aria-label="Adjust opacity" size="xs" variant="ghost">
                <LuDroplet />
              </IconButton>
            </OpacityControl>

            {/* Remove button */}
            <Tooltip content="Remove layer" positioning={{ placement: "top" }}>
              <IconButton
                aria-label="Remove layer"
                size="xs"
                variant="ghost"
                onClick={handleRemove}
              >
                <LuX />
              </IconButton>
            </Tooltip>
          </HStack>
        </HStack>
        <Box
          flex={1}
          minW={0}
          w="full"
          css={{ "&:empty": { display: "none" } }}
        >
          {dataType === "tabular" && (
            <TabularEntry {...(props as TabularLegendLayer)} />
          )}
          {["vector", "pmtiles"].includes(dataType) && (
            <VectorEntry {...(props as VectorLegendLayer)} />
          )}
          {dataType === "raster" && (
            <RasterEntry {...(props as RasterLegendLayer)} />
          )}
        </Box>
      </VStack>

      {/* Info modal */}
      <LayerInfoModal
        layer={props}
        open={infoOpen}
        onOpenChange={setInfoOpen}
      />
    </>
  );
}

/**
 * Renders legend information for a tabular (choropleth) layer.
 * Shows a color ramp matching the map's choropleth visualization.
 */
function TabularEntry(props: TabularLegendLayer) {
  const { unit, dataRange, isPending, hasData } = props;
  const formattedUnit = unit === "number" ? undefined : abbreviateUnit(unit);
  return (
    <VStack align="stretch" gap={2} w="100%">
      {dataRange && (dataRange.max !== 0 || dataRange.min !== 0) ? (
        <VStack align="stretch" gap={1} w="100%">
          {/* Color ramp bar */}
          <Box
            h="16px"
            w="100%"
            position="relative"
            overflow="hidden"
            bgGradient="to-r"
            gradientFrom="transparent"
            gradientTo={mapColors.purple}
          />
          {/* Min/Max labels */}
          <HStack justify="space-between" fontSize="xs" color="fg.muted">
            <Text>
              {dataRange.min.toLocaleString()}
              {formattedUnit || ""}
            </Text>
            <Text textAlign="right">
              {dataRange.max.toLocaleString()}
              {formattedUnit || ""}
            </Text>
          </HStack>
        </VStack>
      ) : (
        /* Show different messages based on loading vs no data state */
        <VStack align="stretch" gap={1} w="100%">
          <Skeleton loading={isPending}>
            <Box h="16px" w="100%" rounded="sm" bg="gray.100" opacity={0.5} />
          </Skeleton>
          <Text fontSize="xs" color="fg.muted" fontStyle="italic">
            {isPending
              ? "Loading data..."
              : hasData === false
                ? "Data unavailable for the time or area selected."
                : "Loading data..."}
          </Text>
        </VStack>
      )}

      {!dataRange && unit && (
        <Text fontSize="xs" color="fg.muted">
          {formattedUnit}
        </Text>
      )}
    </VStack>
  );
}

/**
 * Renders legend information for a vector layer.
 * Shows line or circle symbology matching the map visualization.
 */
function VectorEntry(props: VectorLegendLayer) {
  const { name, geometryType, color, unit } = props;
  const isPoint = geometryType.includes("Point");
  const isLine = geometryType.includes("Line");
  const formattedUnit = unit === "number" ? undefined : abbreviateUnit(unit);

  return (
    <VStack align="stretch" gap={2} w="100%">
      {/* Symbology */}
      <HStack gap={2} align="center">
        {isPoint && (
          <>
            <Box w="12px" h="12px" rounded="full" bg={color} flexShrink={0} />
            <Text fontSize="xs" color="fg.muted">
              {name}
            </Text>
          </>
        )}
        {isLine && (
          <>
            <Box w="12px" h="3px" bg={color} flexShrink={0} rounded="full" />
            <Text fontSize="xs" color="fg.muted">
              {name}
            </Text>
          </>
        )}
        {!isPoint && !isLine && (
          <>
            <Box
              w="16px"
              h="12px"
              border="2px solid"
              borderColor={color}
              bg={`${color}33`}
              flexShrink={0}
              rounded="sm"
            />
            <Text fontSize="xs" color="fg.muted">
              {geometryType}
            </Text>
          </>
        )}
      </HStack>

      {unit && (
        <Text fontSize="xs" color="fg.muted">
          {formattedUnit}
        </Text>
      )}
    </VStack>
  );
}

/**
 * Renders legend information for a raster layer.
 */
function RasterEntry(props: RasterLegendLayer) {
  const { unit } = props;
  const formattedUnit = unit === "number" ? undefined : abbreviateUnit(unit);
  if (!unit) return null;
  return (
    <VStack align="stretch" gap={1}>
      {unit && (
        <Text fontSize="xs" color="fg.muted" pl={6}>
          {formattedUnit}
        </Text>
      )}
    </VStack>
  );
}
