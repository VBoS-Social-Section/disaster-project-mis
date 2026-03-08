/**
 * Dataset selector for tabular layers. Uses tabs for view type (Baseline, Damage, Resources, Financial)
 * and a dropdown for the specific dataset within that type.
 */
import { startTransition, useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLayerStore } from "@/store/layer-store";
import { useViewStore } from "@/store/view-store";
import { useScenario } from "@/hooks/useScenario";

/** Shorter labels for tab buttons */
const VIEW_TYPE_LABELS: Record<DatasetType, string> = {
  baseline: "Baseline",
  estimated_damage: "Damage",
  aid_resources_needed: "Resources",
  estimate_financial_damage: "Financial",
};
import type { DatasetType } from "@/types/api";

const VIEW_TYPE_ORDER: DatasetType[] = [
  "baseline",
  "estimated_damage",
  "aid_resources_needed",
  "estimate_financial_damage",
];

export function TabularDatasetSelect() {
  const scenario = useScenario();
  const { allDatasets, layers, switchLayer } = useLayerStore();
  const scenarioId = useViewStore((s) => s.scenarioId);

  const hasTabularAllowed = scenario.allowedLayerTypes.includes("tabular");
  if (!hasTabularAllowed || scenarioId === "climate") return null;

  const tabularDatasets = allDatasets.filter((d) => d.dataType === "tabular");
  const currentTabularId = layers
    .split(",")
    .find((l) => l.startsWith("t"));

  const datasetsByType = useMemo(() => {
    const map = new Map<DatasetType, typeof tabularDatasets>();
    for (const type of VIEW_TYPE_ORDER) {
      map.set(type, tabularDatasets.filter((d) => d.type === type));
    }
    return map;
  }, [tabularDatasets]);

  const typesWithData = VIEW_TYPE_ORDER.filter(
    (t) => (datasetsByType.get(t)?.length ?? 0) > 0,
  );

  if (tabularDatasets.length === 0) return null;

  const currentDataset = currentTabularId
    ? tabularDatasets.find((d) => `t${d.id}` === currentTabularId)
    : null;
  const currentType = currentDataset?.type ?? typesWithData[0];
  const datasetsInType = datasetsByType.get(currentType) ?? [];

  const handleTypeChange = (type: string) => {
    const list = datasetsByType.get(type as DatasetType);
    if (list?.length) {
      const first = list[0];
      const targetId = `t${first.id}`;
      // Only switch if changing to a different layer; re-clicking same tab must not toggle it off
      if (targetId !== currentTabularId) {
        startTransition(() => switchLayer(targetId));
      }
    }
  };

  const handleDatasetChange = (v: string) => {
    if (v) startTransition(() => switchLayer(v));
  };

  return (
    <div className="w-full space-y-3">
      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Data view
      </Label>
      <Tabs
        value={currentType}
        onValueChange={handleTypeChange}
        className="w-full"
      >
        <TabsList className="h-auto w-full flex-wrap bg-muted/50 p-1">
          {typesWithData.map((type) => (
            <TabsTrigger
              key={type}
              value={type}
              className="flex-1 text-xs"
            >
              {VIEW_TYPE_LABELS[type]}
            </TabsTrigger>
          ))}
        </TabsList>
        {datasetsInType.length > 1 && (
          <div className="mt-3 space-y-2">
            <Label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Dataset
            </Label>
            <Select
              value={currentTabularId ?? ""}
              onValueChange={handleDatasetChange}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select dataset" />
              </SelectTrigger>
              <SelectContent>
                {datasetsInType.map((d) => (
                  <SelectItem key={`t${d.id}`} value={`t${d.id}`}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </Tabs>
    </div>
  );
}
