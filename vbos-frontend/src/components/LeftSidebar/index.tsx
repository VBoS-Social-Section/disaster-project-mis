import { useState, useEffect } from "react";
import { LuLayers } from "react-icons/lu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sidebar } from "../Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useClusters } from "@/hooks/useClusters";
import { useLayerStore } from "@/store/layer-store";
import { useScenario } from "@/hooks/useScenario";
import { SelectedClusterPanel } from "./SelectedClusterPanel";
import { DriversSection } from "./DriversSection";
import { ActiveLayersList } from "./ActiveLayersList";
import { getClusterIcon } from "./clusterIcons";

const LeftSidebar = () => {
  const scenario = useScenario();
  const {
    data: clusters,
    isPending: clustersLoading,
    error: clustersError,
  } = useClusters();
  const { layers } = useLayerStore();
  const [selectedCluster, setSelectedCluster] = useState<string>("");

  const activeLayerCount = layers ? layers.split(",").filter(Boolean).length : 0;

  useEffect(() => {
    if (clusters?.length && !selectedCluster) {
      setSelectedCluster(clusters[0].name);
    }
  }, [clusters, selectedCluster]);

  const collapsedIcons = (onExpand: () => void) => (
    <button
      type="button"
      onClick={onExpand}
      className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Open data layers"
    >
      <LuLayers className="size-4" />
    </button>
  );

  if (clustersError) {
    return (
      <Sidebar direction="left" title="Data Layers" transparent>
        <div className="p-4 text-sm text-amber-600 dark:text-amber-400">
          Error loading data: {String(clustersError)}
        </div>
      </Sidebar>
    );
  }

  if (clustersLoading) {
    return (
      <Sidebar direction="left" title="Data Layers" transparent>
        <div className="space-y-3 px-2 py-3" role="status" aria-label="Loading clusters">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 p-4">
              <Skeleton className="mb-3 h-5 w-[140px]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            </div>
          ))}
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar
      direction="left"
      title="Data Layers"
      badgeCount={activeLayerCount}
      subtitle={scenario.uiConfig.sidebarLayout === "climate" ? "Baseline datasets only" : undefined}
      collapsedIcons={collapsedIcons}
      transparent
    >
      <div className="border-b border-border px-4 py-3 md:px-5 md:py-3">
        <Select value={selectedCluster} onValueChange={setSelectedCluster}>
          <SelectTrigger className="w-full rounded-md border-border bg-muted/50">
            <SelectValue placeholder="Select cluster..." />
          </SelectTrigger>
          <SelectContent>
            {clusters?.map((cluster) => {
              const Icon = getClusterIcon(cluster.name);
              return (
                <SelectItem key={cluster.id} value={cluster.name}>
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0" />
                    {cluster.name}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <div className="scrollbar-thin overflow-y-auto py-3 px-4 md:py-4 md:px-5">
        {selectedCluster ? (
          <>
            <SelectedClusterPanel clusterName={selectedCluster} />
            {scenario.uiConfig.sidebarLayout === "climate" && <DriversSection />}
          </>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Select a cluster above to view datasets
          </p>
        )}
      </div>
      <ActiveLayersList />
    </Sidebar>
  );
};

export { LeftSidebar };
