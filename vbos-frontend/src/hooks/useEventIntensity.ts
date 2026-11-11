/**
 * Hazard category of every area council for the selected event, from the event's
 * footprint layer. Shared by the impact summary, the facility markers and the report.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPmtilesIntensity } from "@/api/getDatasets";
import { parseIntensityRank } from "@/config/disaster";
import { useSelectedEvent } from "@/hooks/useEvents";

export type CouncilIntensity = { council: string; province: string; rank: number };

const NO_FILTERS = new URLSearchParams();

export const councilKey = (name: string | null | undefined) => (name ?? "").trim().toLowerCase();

export function useEventIntensity() {
  const event = useSelectedEvent();
  // Only vector-tile footprints carry a per-council category table
  const layerId = event?.layers.find((l) => l.id.startsWith("p"))?.id;
  const datasetId = layerId ? Number(layerId.slice(1)) : 0;

  const { data, isPending } = useQuery({
    queryKey: ["dataset", "pmtiles", "intensity", datasetId, ""],
    queryFn: () => getPmtilesIntensity(datasetId, NO_FILTERS),
    enabled: datasetId > 0,
    staleTime: 10 * 60 * 1000,
  });

  return useMemo(() => {
    const councils: CouncilIntensity[] = (data?.features ?? []).map((f) => {
      const p = f.properties ?? {};
      return {
        council: String(p.area_council ?? p.acname ?? ""),
        province: String(p.province ?? p.Province ?? ""),
        rank: parseIntensityRank((p.Intensity ?? p.intensity ?? "") as string | number),
      };
    });
    const rankByCouncil = new Map(councils.map((c) => [councilKey(c.council), c.rank]));
    return {
      event,
      layerId,
      councils,
      /** Category (0–5) of an area council; undefined when the footprint does not list it. */
      rankOf: (council: string | null | undefined) => rankByCouncil.get(councilKey(council)),
      hasData: councils.length > 0,
      isLoading: datasetId > 0 && isPending,
    };
  }, [data, event, layerId, datasetId, isPending]);
}
