import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { getClusterIcon } from "./clusterIcons";
import { LayerSwitch } from "./LayerSwitch";
import { Skeleton } from "@/components/ui/skeleton";
import { useClusterDatasets } from "@/hooks/useClusters";
import { DATASET_TYPES } from "@/utils/datasetTypes";
import type { DatasetType } from "@/types/api";

type ClusterFlyoutProps = {
  clusterName: string;
  onExpand: () => void;
};

export function ClusterFlyout({ clusterName, onExpand }: ClusterFlyoutProps) {
  const [open, setOpen] = useState(false);
  const { data: clusterDatasets, isPending, error } = useClusterDatasets(
    clusterName,
    { enabled: open },
  );
  const ClusterIcon = getClusterIcon(clusterName);

  return (
    <HoverCard
      open={open}
      onOpenChange={setOpen}
      openDelay={80}
      closeDelay={150}
    >
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Open ${clusterName}`}
          onClick={onExpand}
        >
          <ClusterIcon className="size-4" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-72 max-h-[min(70vh,420px)] overflow-y-auto border border-border bg-popover p-0"
      >
        <div className="sticky top-0 z-10 border-b border-border bg-popover px-3 py-2">
          <h3 className="text-sm font-semibold">{clusterName}</h3>
        </div>
        <div className="flex flex-col gap-1 p-2">
          {error ? (
            <div className="px-2 py-3 text-sm text-amber-600 dark:text-amber-400">
              Error loading data
            </div>
          ) : isPending ? (
            <div className="space-y-2 px-2 py-3" role="status" aria-label="Loading">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-0.5">
              {clusterDatasets?.map((typeGroup) => (
                <AccordionItem
                  key={typeGroup.type}
                  value={typeGroup.type}
                  className="rounded-lg border-0 bg-muted/30 dark:bg-muted/20"
                >
                  <AccordionTrigger className="px-3 py-2 text-sm font-normal hover:no-underline hover:bg-muted/40 rounded-lg [&>svg]:shrink-0">
                    {DATASET_TYPES[typeGroup.type as DatasetType]}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-1 px-3 pb-2 pt-0">
                      {typeGroup.datasets.map((dataset) => (
                        <LayerSwitch
                          key={`${dataset.dataType}-${dataset.id}`}
                          dataType={dataset.dataType}
                          id={dataset.id}
                          title={dataset.name}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
