/**
 * Displays datasets for a chosen cluster. Shown below the cluster dropdown.
 * Raster layers (land cover) are listed once in RasterSection, not per cluster.
 */
import { useMemo } from "react";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { DatasetSection } from "./DatasetSection";
import { useClusterDatasets } from "@/hooks/useClusters";
import { useScenario } from "@/hooks/useScenario";
import { isDatasetInEvent } from "@/hooks/useEvents";
import { useEventStore } from "@/store/event-store";
import { isLayerAllowed, isClusterTypeAllowed } from "@/config/scenarios";

type SelectedClusterPanelProps = {
  clusterName: string;
};

export function SelectedClusterPanel({ clusterName }: SelectedClusterPanelProps) {
  const scenario = useScenario();
  const eventId = useEventStore((s) => s.eventId);
  const { data: clusterDatasets, isPending, error } = useClusterDatasets(
    clusterName,
    { enabled: true },
  );

  const filteredTypeGroups = useMemo(() => {
    let result = clusterDatasets ?? [];
    result = result
      .filter((tg) => isClusterTypeAllowed(scenario, tg.type))
      .map((tg) => ({
        ...tg,
        datasets: tg.datasets
          .filter((d) => isLayerAllowed(scenario, d.dataType))
          .filter((d) => d.dataType !== "tabular" && d.dataType !== "raster")
          .filter((d) => isDatasetInEvent(d, eventId)),
      }))
      .filter((tg) => tg.datasets.length > 0);
    return result;
  }, [clusterDatasets, scenario, eventId]);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="px-2 pb-3 pt-2">
        {error ? (
          <div className="rounded-lg p-4 text-sm text-amber-600 dark:text-amber-400">
            Error loading data: {String(error)}
          </div>
        ) : isPending ? (
          <div className="space-y-2 px-2 py-2" role="status" aria-label="Loading datasets">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                <Skeleton className="mb-2 h-4 w-24" />
                <div className="space-y-1.5 pl-1">
                  <Skeleton className="h-3.5 w-[85%]" />
                  <Skeleton className="h-3.5 w-[70%]" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTypeGroups?.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            No map layers in this sector. Its figures appear in the right panel.
          </p>
        ) : (
          <>
            <Accordion type="multiple" defaultValue={filteredTypeGroups?.map((t) => t.type) ?? []} className="space-y-1">
            {filteredTypeGroups?.map((item) => (
              <DatasetSection
                key={item.type}
                title={item.type}
                datasets={item.datasets}
              />
            ))}
          </Accordion>
          </>
        )}
      </div>
    </div>
  );
}
