/**
 * LayerInfoModal displays detailed metadata about a map layer.
 *
 * Shows information like layer name, type, source, unit of measurement,
 * creation/update dates, and other metadata in a modal dialog.
 */

import {
  Dialog,
  Stack,
  CloseButton,
  Text,
  Heading,
  Separator,
  Badge,
} from "@chakra-ui/react";
import type { LegendLayer } from "./types";

/**
 * Props for the LayerInfoModal component.
 */
interface LayerInfoModalProps {
  /** The layer to display info for */
  layer: LegendLayer | null;
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal should close */
  onOpenChange: (open: boolean) => void;
}

/**
 * Modal dialog displaying detailed metadata about a map layer.
 *
 * @example
 * ```tsx
 * const [selectedLayer, setSelectedLayer] = useState<LegendLayer | null>(null);
 *
 * <LayerInfoModal
 *   layer={selectedLayer}
 *   open={!!selectedLayer}
 *   onOpenChange={(open) => !open && setSelectedLayer(null)}
 * />
 * ```
 */
export function LayerInfoModal(props: LayerInfoModalProps) {
  const { layer, open, onOpenChange } = props;

  if (!layer) return null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      size="md"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
          <Dialog.Header>
            <Dialog.Title>Layer Information</Dialog.Title>
          </Dialog.Header>

          <Dialog.CloseTrigger />

          <Dialog.Body>
            <Stack gap={4}>
              {/* Layer Name */}
              <Stack gap={1}>
                <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                  Name
                </Text>
                <Heading size="md">{layer.name}</Heading>
              </Stack>

              {/* Layer Description */}
              {layer.description && (
                <Stack gap={1}>
                  <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                    Description
                  </Text>
                  <Text>{layer.description}</Text>
                </Stack>
              )}

              {/* Layer Type */}
              <Stack gap={1} alignItems="start">
                <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                  Type
                </Text>
                <Badge colorPalette="blue" size="sm">
                  {layer.dataType}
                </Badge>
              </Stack>

              {/* ID */}
              <Stack gap={1}>
                <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                  Dataset ID
                </Text>
                <Text>{layer.id}</Text>
              </Stack>

              {/* Unit */}
              {layer.unit && (
                <Stack gap={1}>
                  <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                    Unit of Measurement
                  </Text>
                  <Text>{layer.unit}</Text>
                </Stack>
              )}

              {/* Data Range (for tabular layers) */}
              {layer.dataType === "tabular" && layer.dataRange && (
                <>
                  <Separator />
                  <Stack gap={1}>
                    <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                      Data Range
                    </Text>
                    <Text>
                      {layer.dataRange.min.toLocaleString()} -{" "}
                      {layer.dataRange.max.toLocaleString()}
                      {layer.unit ? ` ${layer.unit}` : ""}
                    </Text>
                  </Stack>
                </>
              )}

              {/* Geometry Type (for vector layers) */}
              {layer.dataType === "vector" && (
                <>
                  <Separator />
                  <Stack gap={1}>
                    <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                      Geometry Type
                    </Text>
                    <Text>{layer.geometryType}</Text>
                  </Stack>
                </>
              )}

              {/* Source */}
              {layer.source && (
                <>
                  <Separator />
                  <Stack gap={1}>
                    <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                      Data Source
                    </Text>
                    <Text fontSize="sm">{layer.source}</Text>
                  </Stack>
                </>
              )}
            </Stack>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
