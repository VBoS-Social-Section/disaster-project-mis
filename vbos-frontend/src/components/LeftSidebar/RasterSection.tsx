/**
 * Land cover and other raster layers. Rasters are not tied to a cluster (the API returns
 * them with every cluster), so they are listed once here instead of inside each cluster.
 * Hidden when no raster datasets exist.
 */
import { useMemo } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LuLeaf } from "react-icons/lu";
import { LayerSwitch } from "./LayerSwitch";
import { useClusterDatasets } from "@/hooks/useClusters";

export function RasterSection({ clusterName }: { clusterName: string }) {
  const { data: clusterDatasets } = useClusterDatasets(clusterName, { enabled: true });

  const rasters = useMemo(() => {
    const seen = new Set<number>();
    return (clusterDatasets ?? [])
      .flatMap((tg) => tg.datasets)
      .filter((d) => d.dataType === "raster")
      .filter((d) => (seen.has(d.id) ? false : (seen.add(d.id), true)));
  }, [clusterDatasets]);

  if (rasters.length === 0) return null;

  return (
    <Accordion type="multiple" defaultValue={["rasters"]} className="mt-3">
      <AccordionItem value="rasters" className="rounded-lg border border-border bg-muted/30">
        <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline rounded-md [&[data-state=open]]:rounded-b-none">
          <span className="flex items-center gap-2">
            <LuLeaf className="size-4 shrink-0 text-muted-foreground" />
            Land cover &amp; imagery
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 pt-0">
          <div className="flex flex-col gap-2 pt-1">
            {rasters.map((dataset) => (
              <LayerSwitch
                key={`raster-${dataset.id}`}
                dataType={dataset.dataType}
                id={dataset.id}
                title={dataset.name}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
