/**
 * Floating layer-control panel that overlays the map (top-left).
 * Replaces the left sidebar: cluster/dataset picker + active-layers list.
 */
import { useEffect, useRef, useState, startTransition, useMemo } from "react";
import {
  LuLayers,
  LuChevronDown,
  LuTrash2,
  LuX,
  LuWind,
} from "react-icons/lu";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion } from "@/components/ui/accordion";
import { useClusters, useClusterDatasets } from "@/hooks/useClusters";
import { useLayerStore } from "@/store/layer-store";
import { useUiStore, DISASTER_VIEW_TYPES } from "@/store/ui-store";
import { useViewStore } from "@/store/view-store";
import { useScenario } from "@/hooks/useScenario";
import { DatasetSection } from "@/components/LeftSidebar/DatasetSection";
import { DisasterSection } from "@/components/LeftSidebar/DisasterSection";
import { DriversSection } from "@/components/LeftSidebar/DriversSection";
import { isLayerAllowed, isClusterTypeAllowed } from "@/config/scenarios";
import {
  isDatasetForClimateModule,
  CLIMATE_MODULES_WITH_LAYERS,
  getClusterForClimateModule,
  CLIMATE_MODULES,
  type ClimateModuleId,
} from "@/config/climate";

const PANEL_WIDTH = 296;

/* ------------------------------------------------------------------ */
/* Dataset accordion panel                                             */
/* ------------------------------------------------------------------ */

function ClusterDatasetPanel({ clusterName }: { clusterName: string }) {
  const scenario = useScenario();
  const selectedClimateModule = useUiStore((s) => s.selectedClimateModule);
  const { data: clusterDatasets, isPending, error } = useClusterDatasets(clusterName, {
    enabled: !!clusterName,
  });

  const filteredTypeGroups = useMemo(() => {
    let result = clusterDatasets ?? [];
    return result
      .filter((tg) => isClusterTypeAllowed(scenario, tg.type))
      .map((tg) => ({
        ...tg,
        datasets: tg.datasets
          .filter((d) => isLayerAllowed(scenario, d.dataType))
          .filter((d) => d.dataType !== "tabular"),
      }))
      .filter((tg) => tg.datasets.length > 0);
  }, [clusterDatasets, scenario]);

  const isClimate = scenario.uiConfig.sidebarLayout === "climate";

  const displayGroups = useMemo(() => {
    if (!isClimate || !selectedClimateModule) return filteredTypeGroups;
    const moduleId = selectedClimateModule as ClimateModuleId;
    if (!CLIMATE_MODULES_WITH_LAYERS.includes(moduleId)) return [];
    return filteredTypeGroups
      .map((tg) => ({
        ...tg,
        datasets: tg.datasets.filter((d) => isDatasetForClimateModule(moduleId, d)),
      }))
      .filter((tg) => tg.datasets.length > 0);
  }, [isClimate, selectedClimateModule, filteredTypeGroups]);

  if (error) return <p className="py-2 text-xs text-amber-600">Error loading datasets</p>;
  if (isPending) return (
    <div className="space-y-1.5 py-1" role="status">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full rounded-md" />)}
    </div>
  );
  if (displayGroups.length === 0) return (
    <p className="py-3 text-xs text-muted-foreground">
      {isClimate && selectedClimateModule &&
       !CLIMATE_MODULES_WITH_LAYERS.includes(selectedClimateModule as ClimateModuleId)
        ? "Coming soon."
        : "No map layers in this cluster."}
    </p>
  );

  return (
    <Accordion
      type="multiple"
      defaultValue={filteredTypeGroups.map((t) => t.type)}
      className="space-y-0.5"
    >
      {displayGroups.map((item) => (
        <DatasetSection key={item.type} title={item.type} datasets={item.datasets} />
      ))}
    </Accordion>
  );
}

/* ------------------------------------------------------------------ */
/* Active layers strip                                                  */
/* ------------------------------------------------------------------ */

function ActiveLayersStrip() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { layers, switchLayer, setLayers, setTabularLayerData, getLayerMetadata } = useLayerStore();
  const allIds = layers ? layers.split(",").map((l) => l.trim()).filter(Boolean) : [];
  const layerIds = allIds.filter((id) => !id.startsWith("t"));

  if (layerIds.length === 0) return null;

  const handleClearAll = () => {
    setConfirmOpen(false);
    startTransition(() => {
      setTabularLayerData([]);
      setLayers("");
    });
  };

  return (
    <>
      <Separator className="my-2.5" />
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Active layers
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-1.5 text-[10px] text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <LuTrash2 className="size-3" />
            Clear all
          </Button>
        </div>
        <div className="flex flex-col gap-0.5">
          {layerIds.map((id) => {
            const meta = getLayerMetadata(id);
            return (
              <label
                key={id}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/50"
              >
                <Switch
                  id={`fl-active-${id}`}
                  size="sm"
                  checked
                  onCheckedChange={() => startTransition(() => switchLayer(id))}
                />
                <span className="min-w-0 flex-1 truncate text-xs">
                  {meta?.name ?? `Layer ${id}`}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove all layers?</DialogTitle>
            <DialogDescription>
              Clears all {allIds.length} selected dataset{allIds.length !== 1 ? "s" : ""} from the map.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleClearAll} className="gap-1.5">
              <LuTrash2 className="size-3.5" /> Remove all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Cyclone event banner                                                */
/* ------------------------------------------------------------------ */

function CycloneBannerInline() {
  const { layers, getLayerMetadata } = useLayerStore();
  const layerIds = layers ? layers.split(",").map((l) => l.trim()).filter(Boolean) : [];
  const activeCycloneLayer = layerIds.find((id) => getLayerMetadata(id)?.cyclone_name?.trim());
  const cycloneName = activeCycloneLayer
    ? getLayerMetadata(activeCycloneLayer)?.cyclone_name?.trim()
    : null;
  if (!cycloneName) return null;
  return (
    <div className="mb-2.5 flex items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5">
      <LuWind className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Event:
      </span>
      <span className="truncate text-xs font-medium">{cycloneName}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function FloatingLayerControl() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const scenarioId = useViewStore((s) => s.scenarioId);
  const isLayerPanelSwitching = useViewStore((s) => s.isLayerPanelSwitching);
  const selectedClimateModule = useUiStore((s) => s.selectedClimateModule);
  const setSelectedClimateModule = useUiStore((s) => s.setSelectedClimateModule);
  const selectedCluster = useUiStore((s) => s.selectedCluster);
  const setSelectedCluster = useUiStore((s) => s.setSelectedCluster);
  const selectedViewType = useUiStore((s) => s.selectedViewType);
  const { data: clusters, isPending: clustersLoading } = useClusters();
  const { layers } = useLayerStore();

  const activeLayerCount = layers ? layers.split(",").filter(Boolean).length : 0;

  // Set cluster default on load
  useEffect(() => {
    if (clusters?.length && !selectedCluster) {
      setSelectedCluster(clusters[0].name);
    }
  }, [clusters, selectedCluster, setSelectedCluster]);

  // Set climate module default on load
  useEffect(() => {
    if (scenarioId === "climate" && !selectedClimateModule && CLIMATE_MODULES.length > 0) {
      setSelectedClimateModule(CLIMATE_MODULES[0].id);
    }
  }, [scenarioId, selectedClimateModule, setSelectedClimateModule]);

  const effectiveCluster =
    scenarioId === "climate"
      ? getClusterForClimateModule(
          (selectedClimateModule || "land_use") as "land_use" | "coastal",
        )
      : selectedCluster;

  // Close on outside click — but ignore clicks inside Radix portals (SelectContent, etc.)
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Radix portals render as [data-radix-popper-content-wrapper] siblings to body
      const isInsidePortal = !!(target as Element).closest?.("[data-radix-popper-content-wrapper], [role='dialog'], [data-radix-select-viewport]");
      if (
        rootRef.current &&
        !rootRef.current.contains(target) &&
        !isInsidePortal
      ) {
        setOpen(false);
      }
    };
    // Use capture so we get it before Radix stops propagation
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  const triggerLabel =
    scenarioId === "climate"
      ? (CLIMATE_MODULES.find((m) => m.id === selectedClimateModule)?.label ?? "Layers")
      : selectedCluster || "Select cluster";

  return (
    <div
      ref={rootRef}
      id="drmis-mode-panel"
      className="absolute left-4 top-4 z-[1040]"
      style={{ width: PANEL_WIDTH }}
      aria-label="Layers and datasets for the current view mode"
    >
      {/* ---- Trigger pill ---- */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 border border-border bg-card px-3.5 py-2 shadow-md",
          "text-sm font-medium transition-colors hover:bg-muted/50",
          open
            ? "rounded-t-xl rounded-b-none border-b-0"
            : "rounded-xl",
        )}
        aria-expanded={open}
      >
        <LuLayers className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-left">{triggerLabel}</span>
        {activeLayerCount > 0 && (
          <Badge className="h-5 shrink-0 rounded-full px-1.5 text-[10px]">
            {activeLayerCount}
          </Badge>
        )}
        {open
          ? <LuX className="size-3.5 shrink-0 text-muted-foreground" />
          : <LuChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        }
      </button>

      {/* ---- Dropdown body ---- */}
      {open && (
        <div
          className={cn(
            "w-full rounded-b-xl border border-t-0 border-border bg-card shadow-xl",
            "animate-in fade-in-0 slide-in-from-top-1 duration-150",
          )}
        >
          <div
            key={scenarioId}
            className="scrollbar-thin overflow-y-auto p-3 animate-in fade-in-0 duration-200"
            style={{ maxHeight: "min(500px, calc(100svh - 10rem))" }}
            aria-busy={isLayerPanelSwitching}
          >
            {/* Cluster / climate-module selector */}
            <div className="mb-3">
              {scenarioId === "climate" ? (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Climate module
                  </label>
                  <Select
                    value={selectedClimateModule || undefined}
                    onValueChange={(v) => setSelectedClimateModule(v || "")}
                  >
                    <SelectTrigger className="w-full rounded-md border-border bg-muted/50 text-sm">
                      <SelectValue placeholder="Select module…" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLIMATE_MODULES.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : clustersLoading ? (
                <Skeleton className="h-9 w-full rounded-md" />
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Cluster
                  </label>
                  <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                    <SelectTrigger className="w-full rounded-md border-border bg-muted/50 text-sm">
                      <SelectValue placeholder="Select cluster…" />
                    </SelectTrigger>
                    <SelectContent>
                      {clusters?.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Layer list */}
            {isLayerPanelSwitching ? (
              <div className="space-y-1.5 py-2" role="status" aria-label="Loading layers">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-md" />
                ))}
              </div>
            ) : (
              effectiveCluster && (
                <>
                  <CycloneBannerInline />
                  <ClusterDatasetPanel clusterName={effectiveCluster} />
                  {scenarioId !== "climate" &&
                    selectedViewType &&
                    DISASTER_VIEW_TYPES.includes(selectedViewType) && (
                      <DisasterSection />
                    )}
                  {scenarioId === "climate" && <DriversSection />}
                </>
              )
            )}

            {/* Active layers */}
            <ActiveLayersStrip />
          </div>
        </div>
      )}
    </div>
  );
}
