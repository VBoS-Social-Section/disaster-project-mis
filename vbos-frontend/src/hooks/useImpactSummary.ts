/**
 * What the selected event means for the selected area: how many area councils fall in
 * each hazard category, and how the sector's baseline figures (schools, students,
 * households…) are distributed across those categories.
 */
import { useMemo } from "react";
import { useAreaStore } from "@/store/area-store";
import { useLayerStore } from "@/store/layer-store";
import { useFilteredTabularData } from "@/hooks/useFilteredTabularData";
import { councilKey, useEventIntensity } from "@/hooks/useEventIntensity";

export type ExposureRow = {
  attribute: string;
  label: string;
  total: number;
  /** Sum per category rank; rank 0 = not affected. */
  byRank: Record<number, number>;
};

const MAX_ROWS = 4;

export function useImpactSummary() {
  const intensity = useEventIntensity();
  const { provinces, acList } = useAreaStore();
  const { layers, getLayerMetadata } = useLayerStore();
  const tabularRows = useFilteredTabularData();

  const tabularId = layers.split(",").find((l) => l.startsWith("t"));
  const tabularMeta = tabularId ? getLayerMetadata(tabularId) : undefined;
  // Exposure only makes sense for baseline figures; damage tables are already an impact
  const isBaseline = tabularMeta?.type === "baseline";

  return useMemo(() => {
    const { event, councils, rankOf, hasData, isLoading } = intensity;
    if (!event || !hasData) return { event, isLoading, ready: false as const };

    const acSet = new Set(acList.map(councilKey));
    const provSet = new Set(provinces.map(councilKey));
    const inScope = councils.filter((c) =>
      acSet.size > 0
        ? acSet.has(councilKey(c.council))
        : provSet.size > 0
          ? provSet.has(councilKey(c.province))
          : true,
    );

    const councilsByRank: Record<number, number> = {};
    for (const c of inScope) councilsByRank[c.rank] = (councilsByRank[c.rank] ?? 0) + 1;
    const ranks = Object.keys(councilsByRank).map(Number).sort((a, b) => b - a);
    const worstRank = ranks.find((r) => r > 0) ?? 0;

    const byAttribute = new Map<string, ExposureRow>();
    if (isBaseline) {
      for (const row of tabularRows) {
        if (!row.area_council || !row.attribute) continue;
        const rank = rankOf(row.area_council);
        if (rank == null) continue;
        let entry = byAttribute.get(row.attribute);
        if (!entry) {
          entry = {
            attribute: row.attribute,
            label: row.attribute.replace(/_/g, " ").toLowerCase(),
            total: 0,
            byRank: {},
          };
          byAttribute.set(row.attribute, entry);
        }
        const value = Number(row.value) || 0;
        entry.total += value;
        entry.byRank[rank] = (entry.byRank[rank] ?? 0) + value;
      }
    }
    const exposure = [...byAttribute.values()]
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, MAX_ROWS);

    const areaNames = acList.length > 0 ? acList : provinces;
    return {
      event,
      isLoading,
      ready: true as const,
      areaNames,
      councilsInScope: inScope.length,
      councilsByRank,
      /** Ranks present in the area, worst first (includes 0 when some councils are unaffected). */
      ranks,
      worstRank,
      exposure,
      datasetName: isBaseline ? tabularMeta?.name : undefined,
      datasetCluster: isBaseline ? tabularMeta?.cluster : undefined,
    };
  }, [intensity, provinces, acList, tabularRows, isBaseline, tabularMeta]);
}
