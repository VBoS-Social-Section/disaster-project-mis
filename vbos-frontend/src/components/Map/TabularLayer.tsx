import { useEffect } from "react";
import { useDataset } from "@/hooks/useDataset";
import { useLayerStore } from "@/store/layer-store";
import { Skeleton } from "@/components/ui/skeleton";

export function TabularLayers() {
  const { layers } = useLayerStore();
  const tabularLayers = layers
    .split(",")
    .filter((i) => i.startsWith("t"))
    .map((i) => Number(i.slice(1)));

  const layer = tabularLayers.length ? tabularLayers[0] : null;

  if (layer) return <TabularDatasetMapLayer id={layer} />;
  return null;
}

type TabularDatasetMapLayerProps = {
  id: number;
};

function TabularDatasetMapLayer({ id }: TabularDatasetMapLayerProps) {
  const { setTabularLayerData } = useLayerStore();
  const filters = new URLSearchParams();

  const { data, isPending } = useDataset("tabular", id, filters);

  useEffect(() => {
    if (data && "results" in data && Array.isArray(data.results)) {
      setTabularLayerData(data.results);
    } else {
      setTabularLayerData([]);
    }
  }, [setTabularLayerData, data]);

  if (isPending)
    return (
      <div className="relative m-1 inline-block rounded-md bg-background p-2 shadow-sm opacity-95" role="status" aria-label="Loading dataset">
        <Skeleton className="mb-1 h-4 w-[140px]" />
        <p className="text-xs text-muted-foreground">
          Loading dataset layer {id}
        </p>
      </div>
    );

  return null;
}
