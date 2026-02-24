import { Accordion, HStack, Status } from "@chakra-ui/react";
import { LayerSwitch } from "./LayerSwitch";
import { Dataset } from "@/types/api";
import { DATASET_TYPES } from "@/utils/datasetTypes";
import { useActiveLayerCount } from "@/hooks/useActiveLayerCount";

type DatasetSectionProps = {
  title:
    | "baseline"
    | "estimated_damage"
    | "aid_resources_needed"
    | "estimate_financial_damage";
  datasets: Dataset[];
};

export function DatasetSection({ title, datasets }: DatasetSectionProps) {
  // Check if any layer in this section is active
  const activeLayerCount = useActiveLayerCount(datasets);

  return (
    <Accordion.Item key={title} value={title}>
      <Accordion.ItemTrigger
        cursor="pointer"
        px={4}
        py={1}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        fontWeight="normal"
        fontSize="sm"
      >
        <HStack gap={2}>
          {DATASET_TYPES[title]}
          {activeLayerCount > 0 && (
            <Status.Root size="sm">
              <Status.Indicator colorPalette="blue" />
            </Status.Root>
          )}
        </HStack>
        <Accordion.ItemIndicator />
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Accordion.ItemBody
          px={4}
          pt={0}
          display="flex"
          flexDirection="column"
          gap={1}
        >
          {datasets.map((dataset) => (
            <LayerSwitch
              key={dataset.id}
              dataType={dataset.dataType}
              id={dataset.id}
              title={dataset.name}
            />
          ))}
        </Accordion.ItemBody>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
}
