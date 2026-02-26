import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Box } from "@chakra-ui/react";
import { useAreaStore } from "@/store/area-store";
import { TabularData } from "@/types/api";
import { consolidateStats } from "@/utils/consolidateStats";
import { getAttributes } from "@/utils/getAttributes";
import { chartColors } from "../colors";

type StatsChartType = {
  stats: TabularData[];
  unit?: string | null;
};

export function StatsChart({ stats, unit }: StatsChartType) {
  const { province, ac } = useAreaStore();
  const isAreaCouncilLevel = Boolean(ac);

  const consolidated = consolidateStats(stats, province ? "area_council" : "province");
  const attributes = getAttributes(stats);

  const categories = consolidated.map((d) => d.place);
  const series = attributes.map((attr, index) => ({
    name: attr.replace(/_/g, " "),
    data: consolidated.map((d) => (d[attr] as number) ?? 0),
    stack: isAreaCouncilLevel ? undefined : "a",
    color: chartColors[index % chartColors.length] ?? chartColors[0],
  }));

  const options: Highcharts.Options = {
    chart: {
      type: "column",
      height: 320,
      style: { fontFamily: "var(--chakra-fonts-body)" },
    },
    title: { text: undefined },
    xAxis: {
      categories,
      labels: {
        rotation: -45,
        style: { fontSize: "10px" },
      },
      crosshair: true,
    },
    yAxis: {
      title: unit ? { text: unit } : undefined,
      labels: {
        formatter: function () {
          const v = this.value as number;
          if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
          if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
          return String(v);
        },
      },
      gridLineDashStyle: "Dash",
    },
    tooltip: {
      shared: true,
      useHTML: true,
    },
    legend: {
      align: "center",
      verticalAlign: "bottom",
      layout: "horizontal",
      itemStyle: { fontSize: "11px" },
      itemDistance: 16,
    },
    plotOptions: {
      column: {
        stacking: isAreaCouncilLevel ? undefined : "normal",
        borderWidth: 0,
      },
    },
    series: series as Highcharts.SeriesOptionsType[],
    credits: { enabled: false },
  };

  return (
    <Box minW={0} w="100%" mt={4} mb={4}>
      <HighchartsReact highcharts={Highcharts} options={options} containerProps={{ style: { width: "100%" } }} />
    </Box>
  );
}
