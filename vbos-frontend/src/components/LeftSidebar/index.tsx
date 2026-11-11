import { useEffect, useMemo } from "react";
import { LuBookOpen, LuLayers } from "react-icons/lu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sidebar } from "../Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useClusters } from "@/hooks/useClusters";
import { useLayerStore } from "@/store/layer-store";
import { useUiStore } from "@/store/ui-store";
import { SelectedClusterPanel } from "./SelectedClusterPanel";
import { RasterSection } from "./RasterSection";
import { EventLayers } from "./EventLayers";
import { useT } from "@/i18n";

const LeftSidebar = () => {
  const { t } = useT();
  const rightSidebarExpanded = useUiStore((s) => s.rightSidebarExpanded);
  const {
    data: allClusters,
    isPending: clustersLoading,
    error: clustersError,
  } = useClusters();
  // "Disaster" is not a sector: its layers are reached through the event picker in the header
  const clusters = useMemo(
    () => allClusters?.filter((c) => c.name.toLowerCase() !== "disaster"),
    [allClusters],
  );
  const { layers } = useLayerStore();
  const selectedCluster = useUiStore((s) => s.selectedCluster);
  const setSelectedCluster = useUiStore((s) => s.setSelectedCluster);

  const activeLayerCount = layers ? layers.split(",").filter(Boolean).length : 0;

  useEffect(() => {
    if (!clusters?.length) return;
    // Also covers a sector that no longer exists, e.g. "Disaster" from an older session
    if (!clusters.some((c) => c.name === selectedCluster)) {
      setSelectedCluster(clusters[0].name);
    }
  }, [clusters, selectedCluster, setSelectedCluster]);

  if (clustersError) {
    return (
      <Sidebar direction="left" title={t("panel.dataLayers")} transparent collapseWhen={rightSidebarExpanded}>
        <div className="p-4 text-sm text-amber-600 dark:text-amber-400">
          Error loading data: {String(clustersError)}
        </div>
      </Sidebar>
    );
  }

  if (clustersLoading) {
    return (
      <Sidebar direction="left" title={t("panel.dataLayers")} transparent collapseWhen={rightSidebarExpanded}>
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

  // Shared by the expanded sidebar and the collapsed-bar flyout (never mounted together)
  const layersBody = (
    <>
      <div className="border-b border-border px-4 py-3 md:px-5 md:py-3">
        <Select value={selectedCluster} onValueChange={setSelectedCluster}>
          <SelectTrigger className="w-full rounded-md border-border bg-muted/50" aria-label={t("panel.sector")}>
            <SelectValue placeholder={t("panel.selectSector")} />
          </SelectTrigger>
          <SelectContent>
            {clusters?.map((cluster) => (
              <SelectItem key={cluster.id} value={cluster.name}>
                {cluster.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto py-3 px-4 md:py-4 md:px-5">
        <EventLayers />
        {selectedCluster ? (
          <>
            <SelectedClusterPanel clusterName={selectedCluster} />
            <RasterSection clusterName={selectedCluster} />
          </>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Select a sector above to view datasets
          </p>
        )}
      </div>
      <div className="shrink-0 border-t border-border px-4 py-2 md:px-5">
        <a
          href="https://vbos-social-section.github.io/disaster-mis-user-manual/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <LuBookOpen className="size-3.5 shrink-0" />
          <span>{t("panel.userManual")}</span>
        </a>
      </div>
    </>
  );

  // Collapsed bar: the layers icon opens the same content in a floating card over the map,
  // so the sidebar can stay collapsed. Closes on outside click or Esc.
  const collapsedIcons = () => (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
          aria-label="Show data layers"
          title="Data layers"
        >
          <LuLayers className="size-4" />
          {activeLayerCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold leading-none text-primary-foreground">
              {activeLayerCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={12}
        collisionPadding={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="flex max-h-[calc(100vh-5rem)] w-80 flex-col overflow-hidden rounded-xl p-0"
      >
        <div className="flex h-10 shrink-0 items-center border-b border-border bg-muted px-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("panel.dataLayers")}
          </span>
        </div>
        {layersBody}
      </PopoverContent>
    </Popover>
  );

  return (
    <Sidebar
      direction="left"
      title={t("panel.dataLayers")}
      badgeCount={activeLayerCount}
      collapsedIcons={collapsedIcons}
      transparent
      collapseWhen={rightSidebarExpanded}
    >
      {layersBody}
    </Sidebar>
  );
};

export { LeftSidebar };
