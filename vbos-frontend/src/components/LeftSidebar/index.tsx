import { useRef, useState, useEffect } from "react";
import { Accordion, Box, Skeleton, Stack } from "@chakra-ui/react";
import { Sidebar } from "../Sidebar";
import { useClusters } from "@/hooks/useClusters";
import { Cluster } from "./Cluster";

const LeftSidebar = () => {
  const {
    data: clusters,
    isPending: clustersLoading,
    error: clustersError,
  } = useClusters();
  const [expandedValue, setExpandedValue] = useState<string[]>([]);
  const hasSetInitial = useRef(false);

  useEffect(() => {
    if (clusters?.length && !hasSetInitial.current) {
      hasSetInitial.current = true;
      setExpandedValue([String(clusters[0].id)]);
    }
  }, [clusters]);

  if (clustersError) {
    return (
      <Sidebar direction="left" title="Data Layers">
        <Box p={4} fontSize="sm" color="fg.warning">
          Error loading data: {String(clustersError)}
        </Box>
      </Sidebar>
    );
  }

  if (clustersLoading) {
    return (
      <Sidebar direction="left" title="Data Layers">
        <Stack gap={4} py={2} overflowY="auto">
          {[1, 2, 3, 4].map((i) => (
            <Stack key={i} gap={2}>
              <Stack px={4}>
                <Skeleton height={6} width="140px" />
              </Stack>
              <Stack gap={3} px={4}>
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
            </Stack>
          ))}
        </Stack>
      </Sidebar>
    );
  }

  return (
    <Sidebar direction="left" title="Data Layers">
      <Accordion.Root
        multiple
        lazyMount
        value={expandedValue}
        onValueChange={(details) => setExpandedValue(details.value)}
        overflowY="auto"
      >
        {clusters?.map((cluster) => (
          <Cluster
            name={cluster.name}
            id={cluster.id}
            key={cluster.id}
            isExpanded={expandedValue.includes(String(cluster.id))}
          />
        ))}
      </Accordion.Root>
    </Sidebar>
  );
};

export { LeftSidebar };
