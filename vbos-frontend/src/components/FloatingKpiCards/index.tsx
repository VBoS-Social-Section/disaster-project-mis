import { startTransition, useMemo, useState } from "react";
import { LuMapPin, LuMapPinCheck } from "react-icons/lu";
import { useFilteredTabularData } from "@/hooks/useFilteredTabularData";
import { useLayerStore } from "@/store/layer-store";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { getAttributes, getAttributeValueSum } from "@/utils/getAttributes";
import { abbreviateUnit } from "@/utils/abbreviateUnit";
import { createTabularKpi } from "@/config/tabularKpis";
import { KpiCard } from "@/components/ui/KpiCard";
import { KpiDrillDownSheet } from "@/components/ui/KpiDrillDownSheet";
import type { TabularData } from "@/types/api";
import { useDateStore } from "@/store/date-store";
import { findLayerForAttribute, findTotalAttribute } from "@/utils/matchLayerForAttribute";

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
  const { layers, getLayerMetadata, allDatasets, switchLayer } = useLayerStore();
  const year = useDateStore((s) => s.year);
  const rightSidebarExpanded = useUiStore((s) => s.rightSidebarExpanded);
  const [drillDown, setDrillDown] = useState<{ title: string; rows: { label: string; value: string | number }[]; source?: string } | null>(null);

  const filteredData = useFilteredTabularData();
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

  // Share bars are only shown where they mean something: parts of a "total …" attribute
  const totalInfo = findTotalAttribute(sortedAttributes);
  const totalValue = totalInfo
    ? getAttributeValueSum(filteredData, totalInfo.attribute)
    : 0;

  // Map layers of the same cluster that a metric can switch on (e.g. Primary Schools)
  const activeLayerIds = layers.split(",");
  const mapLayers = allDatasets.filter(
    (d) =>
      (d.dataType === "vector" || d.dataType === "pmtiles") &&
      (d.cluster ?? "") === (layerMetadata?.cluster ?? ""),
  );

  const updated = layerMetadata?.updated ? new Date(layerMetadata.updated) : null;
  const updatedLabel =
    updated && !Number.isNaN(updated.getTime())
      ? updated.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
      : null;

  return (
    <>
      <div
        className={cn(
          "space-y-4",
          rightSidebarExpanded && "rounded-xl border border-border/40 bg-card/95 p-5 shadow-sm",
        )}
      >
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Key metrics
          </p>
          {layerMetadata && (
            <p className="text-[11px] leading-snug text-muted-foreground">
              {layerMetadata.name}
              {year ? ` · ${year}` : ""}
              {layerMetadata.source ? ` · Source: ${layerMetadata.source}` : ""}
              {updatedLabel ? ` · Loaded ${updatedLabel}` : ""}
            </p>
          )}
        </div>
        <div
          className={cn(
            "grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3 md:gap-4",
            rightSidebarExpanded && "grid-cols-2 gap-4 lg:grid-cols-4",
          )}
        >
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
            const share =
              totalInfo && totalValue > 0 && totalInfo.isPartOfTotal(attr) && total <= totalValue
                ? (total / totalValue) * 100
                : null;
            const linkedLayer = findLayerForAttribute(attr, mapLayers);
            const linkedLayerId = linkedLayer
              ? `${linkedLayer.dataType.slice(0, 1)}${linkedLayer.id}`
              : null;
            const layerOn = !!linkedLayerId && activeLayerIds.includes(linkedLayerId);
            return (
              <KpiCard
                key={attr}
                label={kpi.label}
                result={result}
                unit={unit ?? ""}
                onClick={drillData ? () => setDrillDown(drillData) : undefined}
                className={cn("p-4", layerOn && "border-primary/60 ring-1 ring-primary/40")}
              >
                <div className="mt-2 opacity-70 empty:hidden">
                  <Sparkline data={sparkData} />
                </div>
                {share !== null && (
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
                      role="img"
                      aria-label={`${share.toFixed(0)}% of ${totalInfo!.attribute.replace(/_/g, " ")}`}
                    >
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {share.toFixed(0)}% of total
                    </span>
                  </div>
                )}
                {linkedLayer && linkedLayerId && (
                  <button
                    type="button"
                    aria-pressed={layerOn}
                    title={`${layerOn ? "Hide" : "Show"} the ${linkedLayer.name} layer on the map`}
                    className={cn(
                      "mt-2 inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                      layerOn
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                    )}
                    onClick={(e) => {
                      // The card itself opens the by-province breakdown
                      e.stopPropagation();
                      startTransition(() => switchLayer(linkedLayerId));
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {layerOn ? (
                      <LuMapPinCheck className="size-3 shrink-0" aria-hidden />
                    ) : (
                      <LuMapPin className="size-3 shrink-0" aria-hidden />
                    )}
                    <span className="truncate">{layerOn ? "On map" : "Show on map"}</span>
                  </button>
                )}
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
