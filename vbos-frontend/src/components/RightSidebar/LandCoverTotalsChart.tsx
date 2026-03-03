/**
 * Bar chart showing land cover class percentages for the selected area and year.
 * Uses landCoverData (province/year/land_cover_type/land_area).
 */
import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { landCoverData, LAND_COVER_TYPES, PROVINCES } from "@/data/landCoverData";
import { LAND_COVER_COLORS } from "@/components/colors";
import { useColorMode } from "@/components/ui/color-mode";
import { useDeferredArea } from "@/hooks/useDeferredArea";
import { useDateStore } from "@/store/date-store";
import { useHighchartsTheme } from "@/hooks/useHighchartsTheme";
import { useLayerStore } from "@/store/layer-store";
import { useScenario } from "@/hooks/useScenario";

const LAND_COVER_COLORMAP_ORDER = LAND_COVER_TYPES;

export function LandCoverTotalsChart() {
  const theme = useHighchartsTheme();
  const { province } = useDeferredArea();
  const { year } = useDateStore();
  const { colorMode } = useColorMode();
  const { layers } = useLayerStore();
  const scenario = useScenario();

  const hasRasterLayer = layers.split(",").some((l) => l.startsWith("r"));
  const isClimate = scenario.uiConfig.sidebarLayout === "climate";

  const { data, total } = useMemo(() => {
    const provinces = province ? [province] : [...PROVINCES];
    const yearStr = String(year);
    const filtered = landCoverData.filter(
      (d) => provinces.includes(d.province as (typeof PROVINCES)[number]) && d.year === yearStr,
    );
    const byType: Record<string, number> = {};
    for (const t of LAND_COVER_COLORMAP_ORDER) {
      byType[t] = 0;
    }
    for (const row of filtered) {
      byType[row.land_cover_type] = (byType[row.land_cover_type] ?? 0) + row.land_area;
    }
    const totalArea = Object.values(byType).reduce((s, v) => s + v, 0);
    const data = LAND_COVER_COLORMAP_ORDER.map((t) => ({
      name: t,
      y: totalArea > 0 ? Math.round((byType[t] / totalArea) * 1000) / 10 : 0,
      area: byType[t],
    }));
    return { data, total: totalArea };
  }, [province, year]);

  const palette = LAND_COVER_COLORS[colorMode === "dark" ? "dark" : "light"];

  const chartOptions = useMemo((): Highcharts.Options => {
    return Highcharts.merge(theme, {
      chart: { type: "column" },
      title: { text: undefined },
      xAxis: {
        categories: data.map((d) => d.name),
        labels: {
          rotation: -45,
          style: { fontSize: "10px" },
        },
      },
      yAxis: {
        min: 0,
        max: 100,
        title: { text: "Share (%)", style: { fontSize: "10px" } },
        labels: {
          formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) {
            return `${this.value}%`;
          },
        },
      },
      plotOptions: {
        column: {
          borderRadius: 4,
          dataLabels: {
            enabled: true,
            format: "{y}%",
            style: { fontSize: "9px" },
          },
        },
      },
      series: [
        {
          type: "column",
          name: "Land cover",
          data: data.map((d, i) => ({
            y: d.y,
            color: palette[LAND_COVER_COLORMAP_ORDER[i]] ?? "#888",
          })),
          showInLegend: false,
        },
      ],
      tooltip: {
        formatter: function (this: { point: Highcharts.Point }) {
          const point = this.point;
          const idx = point.index ?? 0;
          const d = data[idx];
          return `<b>${point.name}</b><br/>${point.y}% (${d?.area?.toFixed(1) ?? 0} km²)`;
        },
      },
      legend: { enabled: false },
    });
  }, [theme, data, palette]);

  if (!isClimate || !hasRasterLayer) return null;

  return (
    <Card className="overflow-hidden border-border/60 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          Land cover totals {year}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {province ? province : "National"} · {total.toFixed(1)} km² total
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <HighchartsReact
          highcharts={Highcharts}
          options={chartOptions}
          containerProps={{ style: { width: "100%", height: 220 } }}
        />
      </CardContent>
    </Card>
  );
}
