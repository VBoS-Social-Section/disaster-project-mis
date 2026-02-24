import { useState, useEffect } from "react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  Accordion,
  Box,
  Button,
  ButtonGroup,
  Heading,
  Skeleton,
} from "@chakra-ui/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Dataset } from "@/types/api";
import { useLayerStore } from "@/store/layer-store";
import { getAttributes } from "@/utils/getAttributes";
import {
  consolidateTimeSeries,
  hasMonthlyVariation,
} from "@/utils/consolidateTimeSeries";
import { formatYAxisLabel } from "@/utils/formatCharts";
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
  const series = getAttributes(tabularLayerData).map((i, index) => ({
    name: i,
    color: `${
      index < chartColors.length ? chartColors[index] : "yellow"
    }.solid`,
  }));

  const chart = useChart({
    data: timeSeriesData,
    series: series,
  });

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
              {isTimeSeriesOpen && (
              <Skeleton height="100%" loading={isLoading}>
                <Box minH="200px" w="100%">
                <Chart.Root maxH="200px" chart={chart}>
                  <LineChart data={chart.data}>
                    <CartesianGrid
                      stroke={chart.color("border.muted")}
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      tickLine={false}
                      dataKey={chart.key(showMonthlyView ? "month" : "year")}
                      stroke={chart.color("border")}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      type="number"
                      allowDecimals={true}
                      tickFormatter={(value: number) =>
                        String(formatYAxisLabel(value))}
                      label={
                        layerMetadata?.unit
                          ? {
                            value: formattedUnit,
                            angle: -90,
                            position: "insideLeft",
                            offset: 10,
                          }
                          : undefined
                      }
                      stroke={chart.color("border")}
                    />
                    <Tooltip
                      animationDuration={100}
                      cursor={false}
                      content={<Chart.Tooltip />}
                    />
                    {chart.series.map((item) => (
                      <Line
                        key={item.name}
                        isAnimationActive={false}
                        dataKey={chart.key(item.name)}
                        stroke={chart.color(item.color)}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        type="monotone"
                      />
                    ))}
                  </LineChart>
                </Chart.Root>
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
