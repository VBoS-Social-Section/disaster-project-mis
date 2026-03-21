/**
 * Dataset selector for tabular layers. Uses tabs for view type (Baseline, Damage, Resources, Financial)
 * and a dropdown for the specific dataset within that type.
 * Filters datasets by the cluster selected in the left sidebar.
 */
import { startTransition, useEffect, useMemo, useRef } from "react";
import { Label } from "@/components/ui/label";
import { colors } from "@/tokens";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLayerStore } from "@/store/layer-store";
import { useUiStore } from "@/store/ui-store";
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

function clusterMatches(datasetCluster: string | null | undefined, selected: string): boolean {
  if (!selected) return true;
  return (datasetCluster ?? "").toLowerCase() === selected.toLowerCase();
}

export function TabularDatasetSelect() {
  const scenario = useScenario();
  const { allDatasets, layers, switchLayer } = useLayerStore();
  const scenarioId = useViewStore((s) => s.scenarioId);
  const selectedCluster = useUiStore((s) => s.selectedCluster);
  const setSelectedViewType = useUiStore((s) => s.setSelectedViewType);

  const currentTabularId = layers
    .split(",")
    .find((l) => l.startsWith("t"));
  const activeTabularMeta = currentTabularId
    ? allDatasets.find(
      (d) =>
        d.dataType === "tabular" && `t${d.id}` === currentTabularId,
    )
    : null;
  const tabularDatasets = useMemo(() => {
    const fromCluster = allDatasets.filter(
      (d) =>
        d.dataType === "tabular" &&
        clusterMatches(d.cluster, selectedCluster),
    );
    // Only include activeTabularMeta from another source when it's in the selected cluster
    // (e.g. Damage tab from same cluster). Never include when switching clusters — avoids
    // showing stale Education KPIs after switching to Telecommunications.
    if (
      activeTabularMeta &&
      !fromCluster.some((d) => d.id === activeTabularMeta.id) &&
      clusterMatches(activeTabularMeta.cluster, selectedCluster)
    ) {
      return [...fromCluster, activeTabularMeta];
    }
    return fromCluster;
  }, [allDatasets, selectedCluster, activeTabularMeta]);

  const datasetsByType = useMemo(() => {
    const map = new Map<DatasetType, typeof tabularDatasets>();
    for (const type of VIEW_TYPE_ORDER) {
      map.set(type, tabularDatasets.filter((d) => d.type === type));
    }
    return map;
  }, [tabularDatasets]);

  const currentDataset = currentTabularId
    ? tabularDatasets.find((d) => `t${d.id}` === currentTabularId)
    : null;

  const prevClusterRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedCluster) return;
    if (tabularDatasets.length === 0) {
      if (currentTabularId) {
        startTransition(() => switchLayer(currentTabularId));
      }
      return;
    }
    const clusterChanged = prevClusterRef.current !== selectedCluster;
    prevClusterRef.current = selectedCluster;
    if (!clusterChanged) return;
    const inCluster =
      currentDataset && clusterMatches(currentDataset.cluster, selectedCluster);
    if (!inCluster) {
      const firstFromCluster = tabularDatasets.find((d) =>
        clusterMatches(d.cluster, selectedCluster),
      );
      if (firstFromCluster)
        startTransition(() => switchLayer(`t${firstFromCluster.id}`));
    }
  }, [selectedCluster, tabularDatasets, currentDataset, currentTabularId, switchLayer]);

  const typesWithData = VIEW_TYPE_ORDER.filter(
    (t) => (datasetsByType.get(t)?.length ?? 0) > 0,
  );
  const currentType = currentDataset?.type ?? typesWithData[0] ?? null;

  useEffect(() => {
    setSelectedViewType(currentType);
  }, [currentType, setSelectedViewType]);

  const hasTabularAllowed = scenario.allowedLayerTypes.includes("tabular");
  if (!hasTabularAllowed || scenarioId === "climate") return null;
  if (tabularDatasets.length === 0) return null;

  const datasetsInType = datasetsByType.get(currentType!) ?? [];

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

        {currentDataset && datasetsInType.length <= 1 && (
          <a
            href={`/admin/datasets/tabulardataset/${currentDataset.id}/change/`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              color: colors.text.muted,
              textDecoration: "none",
            }}
          >
            Manage dataset ↗
          </a>
        )}
      </Tabs>
    </div>
  );
}
