import {
  Accordion,
  Badge,
  Box,
  HStack,
  Skeleton,
  Stack,
} from "@chakra-ui/react";
import { LuMinus, LuPlus } from "react-icons/lu";

import { SidebarSectionHeading } from "../SidebarSectionHeading";
import { DatasetSection } from "./DatasetSection";
import { useClusterDatasets } from "@/hooks/useClusters";
import { useActiveLayerCount } from "@/hooks/useActiveLayerCount";
import { useMemo } from "react";

type ClusterProps = {
  name: string;
  id: number;
};

const Cluster = ({ name, id }: ClusterProps) => {
  const { data: clusterDatasets, isPending, error } = useClusterDatasets(name);

  // Flatten all datasets from all type groups in this cluster
  const allDatasets = useMemo(() => {
    if (!clusterDatasets) return undefined;
    return clusterDatasets.flatMap((typeGroup) => typeGroup.datasets);
  }, [clusterDatasets]);

  // Count active layers within this cluster
  const activeLayerCount = useActiveLayerCount(allDatasets);

  if (error) {
    return (
      <Box p={4} fontSize="sm" color="fg.warning">
        Error loading data: {String(error)}
      </Box>
    );
  }

  if (isPending) {
    return (
      <Stack gap={3} px={4} py={1}>
        <Stack gap={1}>
          <Skeleton height={5} width="100px" />
          <Stack gap={1} pl={3}>
            <Skeleton height={3} width="80%" />
            <Skeleton height={3} width="95%" />
            <Skeleton height={3} width="90%" />
          </Stack>
        </Stack>
        <Stack gap={1}>
          <Skeleton height={5} width="120px" />
          <Stack gap={1} pl={3}>
            <Skeleton height={3} width="100%" />
            <Skeleton height={3} width="92%" />
          </Stack>
        </Stack>
      </Stack>
    );
  }

  return (
    <Accordion.Item key={name} value={`${id}`}>
      <Accordion.ItemTrigger cursor="pointer" px={4}>
        <HStack gap={2} flex={1} minW={0}>
          <SidebarSectionHeading>{name}</SidebarSectionHeading>
          {activeLayerCount > 0 && (
            <Badge
              colorPalette="blue"
              variant="surface"
              size="sm"
              flexShrink={0}
            >
              {activeLayerCount}
            </Badge>
          )}
        </HStack>
        <Accordion.ItemIndicator asChild color="fg">
          <Accordion.ItemContext>
            {(context) => (context.expanded ? <LuMinus /> : <LuPlus />)}
          </Accordion.ItemContext>
        </Accordion.ItemIndicator>
      </Accordion.ItemTrigger>
      <Accordion.ItemContent>
        <Accordion.ItemBody p={0}>
          <Accordion.Root multiple>
            {clusterDatasets?.map((item) => (
              <DatasetSection
                title={item.type}
                datasets={item.datasets}
                key={item.type}
              />
            ))}
          </Accordion.Root>
        </Accordion.ItemBody>
      </Accordion.ItemContent>
    </Accordion.Item>
  );
};

export { Cluster };
