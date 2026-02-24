import { Chart, useChart } from "@chakra-ui/charts";
import { Box } from "@chakra-ui/react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { useAreaStore } from "@/store/area-store";
import { TabularData } from "@/types/api";
import { consolidateStats } from "@/utils/consolidateStats";
import { getAttributes } from "@/utils/getAttributes";
import { formatYAxisLabel } from "@/utils/formatCharts";
import { chartColors } from "../colors";

type StatsChartType = {
  stats: TabularData[];
  unit?: string | null;
};

export function StatsChart({ stats, unit }: StatsChartType) {
  const { province, ac } = useAreaStore();
  const isAreaCouncilLevel = Boolean(ac);

  const series = getAttributes(stats).map((i, index) => ({
    name: i,
    color: `${index < chartColors.length ? chartColors[index] : "yellow"}.solid`,
    // Stack bars at province level, group them at area council level
    stackId: isAreaCouncilLevel ? undefined : "a",
  }));
  const chart = useChart({
    data: consolidateStats(stats, province ? "area_council" : "province"),
    series: series,
  });

  return (
    <Box minH="240px" w="100%" mt={4} mb={12}>
      <Chart.Root maxH="sm" chart={chart}>
      <BarChart data={chart.data}>
        <CartesianGrid stroke={chart.color("border.muted")} vertical={false} />
        <XAxis
          axisLine={false}
          tickLine={false}
          dataKey={chart.key("place")}
          angle={-45}
          textAnchor="end"
          interval={0}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          type="number"
          allowDecimals={true}
          tickFormatter={(value: number) => String(formatYAxisLabel(value))}
          label={unit ? { value: unit, angle: -90, position: "insideLeft" } : undefined}
        />
        <Tooltip
          cursor={false}
          animationDuration={100}
          content={<Chart.Tooltip />}
        />
        {chart.series.map((item) => (
          <Bar
            key={item.name}
            isAnimationActive={false}
            dataKey={chart.key(item.name)}
            fill={chart.color(item.color)}
            stackId={item.stackId}
          />
        ))}
      </BarChart>
    </Chart.Root>
    </Box>
  );
}
