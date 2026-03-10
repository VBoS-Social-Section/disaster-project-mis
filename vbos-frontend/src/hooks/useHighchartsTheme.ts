/**
 * Highcharts theme: clean, minimal design matching reference aesthetic.
 * White background, extremely subtle grid, ample whitespace, legend on right.
 */
import { useMemo } from "react";
import type Highcharts from "highcharts";
import { useColorMode } from "@/components/ui/color-mode";
import { chartColors } from "@/components/colors";

const LIGHT = {
  chartBg: "#ffffff",
  text: "#1e293b",
  mutedText: "#64748b",
  gridLine: "rgba(0,0,0,0.05)",
  axisLine: "rgba(0,0,0,0.06)",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e2e8f0",
  tooltipText: "#1e293b",
} as const;

const DARK = {
  chartBg: "transparent",
  text: "#f8fafc",
  mutedText: "#94a3b8",
  gridLine: "rgba(255,255,255,0.05)",
  axisLine: "rgba(255,255,255,0.06)",
  tooltipBg: "#0f172a",
  tooltipBorder: "#334155",
  tooltipText: "#f8fafc",
} as const;

export function useHighchartsTheme(): Highcharts.Options {
  const { colorMode } = useColorMode();
  const isDark = colorMode === "dark";
  const c = isDark ? DARK : LIGHT;

  return useMemo(
    (): Highcharts.Options => ({
      accessibility: { enabled: false },
      chart: {
        backgroundColor: c.chartBg,
        style: { fontFamily: "var(--font-work-sans), system-ui, sans-serif" },
        spacing: [24, 20, 20, 24],
        plotBorderWidth: 0,
      },
      colors: [...chartColors],
      title: { style: { color: c.text, fontSize: "14px", fontWeight: "600" } },
      subtitle: { style: { color: c.mutedText, fontSize: "11px" } },
      xAxis: {
        lineColor: c.axisLine,
        tickColor: c.axisLine,
        lineWidth: 1,
        tickLength: 4,
        labels: { style: { color: c.mutedText, fontSize: "11px" } },
        title: { style: { color: c.text, fontSize: "11px" } },
        gridLineWidth: 0,
      },
      yAxis: {
        lineColor: c.axisLine,
        tickColor: c.axisLine,
        lineWidth: 1,
        tickLength: 4,
        labels: { style: { color: c.mutedText, fontSize: "11px" } },
        title: { style: { color: c.text, fontSize: "11px" } },
        gridLineColor: c.gridLine,
        gridLineWidth: 1,
      },
      legend: {
        itemStyle: { color: c.text, fontSize: "11px" },
        itemHoverStyle: { color: c.text },
        itemDistance: 12,
        symbolRadius: 4,
      },
      tooltip: {
        backgroundColor: c.tooltipBg,
        borderColor: c.tooltipBorder,
        borderWidth: 1,
        style: { color: c.tooltipText, fontSize: "12px" },
        borderRadius: 6,
        shadow: false,
        padding: 10,
      },
      plotOptions: {
        series: { borderWidth: 0 },
        bar: { borderWidth: 0, pointPadding: 0.1, groupPadding: 0.15 },
        line: {
          lineWidth: 2,
          marker: { radius: 4, symbol: "circle", lineWidth: 1, lineColor: "#ffffff" },
        },
        pie: { borderWidth: 0 },
      },
      credits: { enabled: false },
    }),
    [isDark],
  );
}
