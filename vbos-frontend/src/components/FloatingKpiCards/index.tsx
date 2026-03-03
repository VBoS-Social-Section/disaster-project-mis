import { useMemo, useState } from "react";
import { useDateStore } from "@/store/date-store";
import { useLayerStore } from "@/store/layer-store";
import { useMapStore } from "@/store/map-store";
import { getAttributes, getAttributeValueSum } from "@/utils/getAttributes";
import { abbreviateUnit } from "@/utils/abbreviateUnit";
import { createTabularKpi } from "@/config/tabularKpis";
import { KpiCard } from "@/components/ui/KpiCard";
import { KpiDrillDownSheet } from "@/components/ui/KpiDrillDownSheet";
import type { TabularData } from "@/types/api";

function getSparklineData(data: TabularData[], attr: string): number[] {
  const byDate = data
    .filter((i) => i.attribute === attr)
    .reduce<Record<string, number>>((acc, i) => {
      const d = i.date;
      acc[d] = (acc[d] ?? 0) + (i.value ?? 0);
      return acc;
    }, {});
  const sorted = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([, v]) => v);
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 48;
  const h = 20;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const path = `M ${points.join(" L ")}`;
  return (
    <svg width={w} height={h} className="overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="sparkline-grad" x1="0" x2="0" y1="1" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        style={{
          strokeDasharray: 300,
          strokeDashoffset: 300,
          animation: "sparkline-draw 0.6s ease-out forwards",
        }}
      />
      <path
        d={`${path} L ${w} ${h} L 0 ${h} Z`}
        fill="url(#sparkline-grad)"
      />
    </svg>
  );
}

const FloatingKpiCards = () => {
  const { layers, tabularLayerData, getLayerMetadata } = useLayerStore();
  const zoom = useMapStore((s) => s.viewState.zoom);
  const { year } = useDateStore();
  const [drillDown, setDrillDown] = useState<{ title: string; rows: { label: string; value: string | number }[]; source?: string } | null>(null);

  const filteredData = tabularLayerData.filter((i) => i.date.startsWith(year));
  const tabularLayerId = layers.split(",").find((i) => i.startsWith("t"));
  const layerMetadata = tabularLayerId
    ? getLayerMetadata(tabularLayerId)
    : undefined;
  const unit =
    layerMetadata?.unit === "number"
      ? undefined
      : abbreviateUnit(layerMetadata?.unit ?? "");

  const attributes = getAttributes(filteredData);
  const sortedAttributes = useMemo(
    () =>
      attributes
        .map((attr) => ({
          name: attr,
          total: getAttributeValueSum(filteredData, attr),
        }))
        .sort((a, b) => b.total - a.total)
        .map((item) => item.name),
    [attributes, filteredData],
  );

  if (
    !tabularLayerId ||
    filteredData.length === 0 ||
    sortedAttributes.length === 0
  ) {
    return null;
  }

  const topAttributes = sortedAttributes.slice(0, 4);
  const maxTotal = Math.max(
    ...topAttributes.map((a) => getAttributeValueSum(filteredData, a)),
  );

  const zoomNorm = Math.max(0, Math.min(1, (zoom - 6) / 6));
  const scale = 1 + zoomNorm * 0.02;
  const lift = -zoomNorm * 8;

  return (
    <>
      <div
        className={`
          contain-panel absolute left-4 top-4 z-[1000] max-w-[calc(100%-2rem)] overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm
          md:left-6 md:top-6 md:max-w-[360px] md:p-5
          -translate-y-0.5
        `}
        style={{
          transform: `scale(${scale}) translateY(${lift}px)`,
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Key metrics
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory md:grid md:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] md:overflow-visible md:snap-none sm:gap-4 md:gap-5">
          {topAttributes.map((attr) => {
            const kpi = createTabularKpi(attr);
            const ctx = {
              data: filteredData,
              attribute: attr,
              unit: unit ?? undefined,
            };
            const result = kpi.formula(ctx);
            const drillData = kpi.getDrillDown?.(ctx) ?? null;
            const total = getAttributeValueSum(filteredData, attr);
            const sparkData = getSparklineData(filteredData, attr);
            const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
            return (
              <KpiCard
                key={attr}
                label={kpi.label}
                result={result}
                unit={unit ?? ""}
                onClick={drillData ? () => setDrillDown(drillData) : undefined}
                className="min-w-[140px] shrink-0 snap-center md:min-w-0 md:shrink md:snap-align-none md:p-4"
              >
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div className="opacity-70">
                    <Sparkline data={sparkData} />
                  </div>
                  <div
                    className="h-1.5 w-12 overflow-hidden rounded-full bg-muted/50"
                    title={`${pct.toFixed(0)}% of max`}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </KpiCard>
            );
          })}
        </div>
      </div>
      <KpiDrillDownSheet
        open={!!drillDown}
        onOpenChange={(open) => !open && setDrillDown(null)}
        data={drillDown}
      />
    </>
  );
};

export default FloatingKpiCards;
