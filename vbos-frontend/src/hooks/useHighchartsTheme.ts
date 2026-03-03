/**
 * Highcharts theme options that follow the app's light/dark color mode.
 * Uses chartColors for series and system-like colors for chart chrome.
 */
import { useMemo } from "react";
import type Highcharts from "highcharts";
import { useColorMode } from "@/components/ui/color-mode";
import { chartColors } from "@/components/colors";

const LIGHT = {
  chartBg: "transparent",
  text: "#0f172a",
  mutedText: "#64748b",
  gridLine: "#e2e8f0",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e2e8f0",
  tooltipText: "#0f172a",
} as const;

const DARK = {
  chartBg: "transparent",
  text: "#f8fafc",
  mutedText: "#94a3b8",
  gridLine: "#334155",
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
      chart: {
        backgroundColor: c.chartBg,
        style: { fontFamily: "var(--font-work-sans), system-ui, sans-serif" },
      },
      colors: [...chartColors],
      title: { style: { color: c.text, fontSize: "14px" } },
      subtitle: { style: { color: c.mutedText } },
      xAxis: {
        lineColor: c.gridLine,
        tickColor: c.gridLine,
        labels: { style: { color: c.mutedText, fontSize: "10px" } },
        title: { style: { color: c.text } },
      },
      yAxis: {
        lineColor: c.gridLine,
        tickColor: c.gridLine,
        labels: { style: { color: c.mutedText, fontSize: "10px" } },
        title: { style: { color: c.text } },
        gridLineColor: c.gridLine,
      },
      legend: {
        itemStyle: { color: c.text, fontSize: "10px" },
        itemHoverStyle: { color: c.text },
      },
      tooltip: {
        backgroundColor: c.tooltipBg,
        borderColor: c.tooltipBorder,
        style: { color: c.tooltipText, fontSize: "12px" },
        borderRadius: 6,
        shadow: { color: "rgba(0,0,0,0.15)", offsetY: 4, width: 0, opacity: 1 },
      },
      credits: { enabled: false },
    }),
    [isDark],
  );
}
