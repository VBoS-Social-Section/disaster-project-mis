/**
 * Legend component displays active map layers with their visualization metadata.
 *
 * The legend automatically shows/hides based on whether any layers are active,
 * and provides controls for removing layers from the map.
 *
 * Design Notes:
 * - Uses Chakra UI for styling consistency
 * - Positioned absolutely on the map (bottom-right by default)
 * - Responsive positioning for mobile vs desktop
 * - No drag-and-drop reordering (layers managed via LayerSwitch UI)
 * - Connects to layer store for remove actions
 */

import {
  Flex,
  Heading,
  VisuallyHidden,
  VStack,
} from "@chakra-ui/react";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useLegendLayers } from "@/components/Map/Legend/hooks/useLegendLayers";
import { LayerEntry } from "./LayerEntry";

/**
 * Legend component displaying a list of active map layers with legend details.
 *
 * The legend automatically hides when no layers are active. Each layer entry
 * shows the layer name, type, visualization style, and controls for opacity and removal.
 */
export function Legend() {
  const { switchLayer } = useLayerStore();
  const { setOpacity } = useOpacityStore();
  const legendLayers = useLegendLayers();

  // Hide legend when no layers are active
  if (!legendLayers.length) return null;
  return (
    <Flex
      position="absolute"
      left={2}
      bottom={{ base: "4.5rem", md: 28 }}
      zIndex={100}
      width={{ base: "280px", md: "320px" }}
      bg="bg"
      overflow="hidden"
      rounded="sm"
      shadow="sm"
      border="1px solid"
      borderColor="border"
      fontFamily="body"
    >
      <VisuallyHidden>
        <Heading as="h2">Map Legend</Heading>
      </VisuallyHidden>

      <VStack
        as="ul"
        listStyleType="none"
        fontSize="xs"
        p={0}
        m={0}
        w="100%"
        gap={0}
        align="stretch"
      >
        {legendLayers.map((layer) => (
          <Flex
            as="li"
            key={`${layer.dataType}-${layer.id}`}
            p={2}
            px={3}
            borderBottom="1px solid"
            borderColor="border"
            _last={{ borderBottom: "none" }}
          >
            <LayerEntry
              {...layer}
              switchLayer={switchLayer}
              setOpacity={setOpacity}
            />
          </Flex>
        ))}
      </VStack>
    </Flex>
  );
}
