import { useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {
  Accordion,
  Box,
  Button,
  ButtonGroup,
  Heading,
  Skeleton,
} from "@chakra-ui/react";
import { Dataset } from "@/types/api";
import { useLayerStore } from "@/store/layer-store";
import { getAttributes } from "@/utils/getAttributes";
import {
  consolidateTimeSeries,
  hasMonthlyVariation,
} from "@/utils/consolidateTimeSeries";
import { useAreaStore } from "@/store/area-store";
import { useUiStore } from "@/store/ui-store";
import { chartColors } from "../colors";
import { abbreviateUnit } from "@/utils/abbreviateUnit";

const BottomDrawer = () => {
  const { layers, tabularLayerData, getLayerMetadata } = useLayerStore();
  const { province, ac } = useAreaStore();
  const { isTimeSeriesOpen, setTimeSeriesOpen } = useUiStore();
  const tabularLayerId = layers.split(",").find((i) => i.startsWith("t"));
  const layerMetadata: Dataset | undefined = tabularLayerId
    ? getLayerMetadata(tabularLayerId)
    : undefined;
  const formattedUnit =
    layerMetadata?.unit === "number"
      ? undefined
      : abbreviateUnit(layerMetadata?.unit);
  // Check if data has monthly variation
  const hasMonthlyData = hasMonthlyVariation(tabularLayerData);

  // Track view mode: "monthly" or "annual"
  const [viewMode, setViewMode] = useState<"monthly" | "annual">("annual");

  // Auto-switch to monthly view when monthly data becomes available
  useEffect(() => {
    if (hasMonthlyData) {
      setViewMode("monthly");
    } else {
      setViewMode("annual");
    }
  }, [hasMonthlyData]);

  // Determine if we should show monthly data based on both availability and user selection
  const showMonthlyView = hasMonthlyData && viewMode === "monthly";

  // Get time series data - tabularLayerData is already filtered by selected area
  const timeSeriesData = consolidateTimeSeries(
    tabularLayerData,
    showMonthlyView
  );
  const attributes = getAttributes(tabularLayerData);
  const xKey = showMonthlyView ? "month" : "year";
  const categories = timeSeriesData.map((d) => String(d[xKey]));
  const series = attributes.map((attr, index) => ({
    name: attr.replace(/_/g, " "),
    data: timeSeriesData.map((d) => (d[attr] as number) ?? 0),
    color: chartColors[index % chartColors.length] ?? chartColors[0],
  }));

  const chartOptions: Highcharts.Options = {
    chart: {
      type: "line",
      height: 200,
      style: { fontFamily: "var(--chakra-fonts-body)" },
    },
    title: { text: undefined },
    xAxis: {
      categories,
      labels: { style: { fontSize: "10px" } },
      crosshair: true,
    },
    yAxis: {
      title: formattedUnit ? { text: formattedUnit } : undefined,
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
    tooltip: { shared: true },
    legend: {
      align: "center",
      verticalAlign: "bottom",
      itemStyle: { fontSize: "11px" },
    },
    plotOptions: {
      line: {
        marker: { radius: 4 },
        lineWidth: 2,
      },
    },
    series: series as Highcharts.SeriesOptionsType[],
    credits: { enabled: false },
  };

  // Check if data is loading
  const isLoading =
    tabularLayerData.length === 0 && tabularLayerId !== undefined;

  return (
    <Accordion.Root
      collapsible
      variant="plain"
      value={isTimeSeriesOpen ? ["bottom-drawer"] : []}
      onValueChange={(details) =>
        setTimeSeriesOpen(details.value.includes("bottom-drawer"))}
      disabled={!tabularLayerData.length}
    >
      <Accordion.Item
        value="bottom-drawer"
        borderTop="1px solid"
        borderColor="border.emphasized"
        bg="bg"
        maxH="sm"
      >
        <Accordion.ItemTrigger
          display="flex"
          justifyContent="space-between"
          borderBottom={isTimeSeriesOpen ? "1px solid" : "none"}
          borderColor="border.muted"
          p={2}
          px={3}
          cursor="pointer"
        >
          <Heading
            as="h3"
            fontSize="sm"
            fontWeight="medium"
            textTransform="uppercase"
            color="fg.muted"
            flex="1"
          >
            Time Series
          </Heading>
          <Accordion.ItemIndicator />
        </Accordion.ItemTrigger>
        <Accordion.ItemContent>
          <Accordion.ItemBody>
            <Box p={3}>
              {isLoading ? (
                <Skeleton height={4} width="40%" mb={4} loading={isLoading} />
              ) : (
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={4}
                >
                  <Heading as="h4" fontSize="md">
                    {ac ? ac : province ? province : "National Level"} -{" "}
                    {layerMetadata
                      ? layerMetadata.name
                      : "Selected Data Over Time"}
                  </Heading>
                  {hasMonthlyData && (
                    <ButtonGroup size="xs" variant="surface" attached>
                      <Button
                        onClick={() => setViewMode("monthly")}
                        colorPalette={viewMode === "monthly" ? "blue" : "gray"}
                      >
                        Monthly
                      </Button>
                      <Button
                        onClick={() => setViewMode("annual")}
                        colorPalette={viewMode === "annual" ? "blue" : "gray"}
                      >
                        Annual
                      </Button>
                    </ButtonGroup>
                  )}
                </Box>
              )}
              {isTimeSeriesOpen && timeSeriesData.length > 0 && (
              <Skeleton height="100%" loading={isLoading}>
                <Box minH="200px" w="100%">
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={chartOptions}
                    containerProps={{ style: { width: "100%" } }}
                  />
                </Box>
              </Skeleton>
              )}
            </Box>
          </Accordion.ItemBody>
        </Accordion.ItemContent>
      </Accordion.Item>
    </Accordion.Root>
  );
};
export default BottomDrawer;
