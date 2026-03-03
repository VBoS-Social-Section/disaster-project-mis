import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useDeferredArea } from "@/hooks/useDeferredArea";
import { TabularData } from "@/types/api";
import { consolidateStats } from "@/utils/consolidateStats";
import { getAttributes, getAttributeValueSum } from "@/utils/getAttributes";
import { chartColors } from "../colors";
import { useHighchartsTheme } from "@/hooks/useHighchartsTheme";

type StatsPieChartProps = {
  stats: TabularData[];
  unit?: string | null;
};

export function StatsPieChart({ stats }: StatsPieChartProps) {
  const theme = useHighchartsTheme();
  const { province } = useDeferredArea();
  const consolidated = consolidateStats(stats, province ? "area_council" : "province");
  const attributes = getAttributes(stats);

  const topAttr = attributes
    .map((attr) => ({ attr, total: getAttributeValueSum(stats, attr) }))
    .sort((a, b) => b.total - a.total)[0]?.attr;

  const { options } = useMemo(() => {
    if (!topAttr || consolidated.length === 0) return { options: null };

    const total = consolidated.reduce(
      (s, row) => s + ((row[topAttr] as number) ?? 0),
      0,
    );
    const data = consolidated.map((row, i) => {
      const v = (row[topAttr] as number) ?? 0;
      const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
      return {
        name: row.place,
        y: v,
        color: chartColors[i % chartColors.length],
        pct: `${pct}%`,
      };
    });

    const opts = Highcharts.merge(theme, {
      chart: { type: "pie" },
      title: { text: undefined },
      series: [{
        type: "pie",
        name: "Share",
        data,
        size: "75%",
        dataLabels: {
          enabled: true,
          format: "{point.name} {point.pct}",
          style: { fontSize: "10px" },
        },
        showInLegend: false,
      }],
      tooltip: {
        formatter: function (): string {
          const p = (this as unknown as { point: Highcharts.Point & { pct?: string } }).point;
          const v = p.y ?? 0;
          const pct = p.pct ?? (total > 0 ? ((v / total) * 100).toFixed(1) + "%" : "0%");
          return `${v.toLocaleString()} (${pct})`;
        },
      },
    });
    return { options: opts };
  }, [theme, consolidated, topAttr]);

  if (!topAttr || consolidated.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Distribution by {province ? "Area Council" : "Province"}
      </h4>
      <HighchartsReact
        highcharts={Highcharts}
        options={options!}
        containerProps={{ style: { width: "100%", height: 220 } }}
      />
    </div>
  );
}
