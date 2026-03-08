import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { LuGripVertical, LuChevronDown, LuChevronUp } from "react-icons/lu";
import { Tooltip } from "@/components/ui";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useComparisonStore } from "@/store/comparison-store";
import { useScenario } from "@/hooks/useScenario";
import { useLegendLayers } from "@/components/Map/Legend/hooks/useLegendLayers";
import { useLandCoverRaster } from "@/hooks/useLandCoverRaster";
import { LayerEntry } from "./LayerEntry";
import { MAP_COLORS, getDeltaColor } from "@/components/colors";
import { useColorMode } from "@/components/ui/color-mode";

type LegendProps = {
  /** When true, renders inline for context panel (no absolute positioning) */
  embedded?: boolean;
};

export function Legend({ embedded = false }: LegendProps = {}) {
  const { colorMode } = useColorMode();
  const mapPalette = MAP_COLORS[colorMode === "dark" ? "dark" : "light"];
  const { switchLayer, reorderLayers, layers } = useLayerStore();
  const { setOpacity } = useOpacityStore();
  const { comparisonMode, comparisonView, yearLeft, yearRight } = useComparisonStore();
  const scenario = useScenario();
  const legendLayers = useLegendLayers();
  const landCover = useLandCoverRaster();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showDiffLegend, setShowDiffLegend] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const hasLandCoverRaster = landCover && layers.split(",").includes(landCover.layerId);
  const hideWhenLandCoverDominates = scenario.id === "climate" && hasLandCoverRaster;

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === toIndex) return;
    reorderLayers(draggedIndex, toIndex);
    setDraggedIndex(null);
  }, [draggedIndex, reorderLayers]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  if (!legendLayers.length) return null;
  if (hideWhenLandCoverDominates) return null;

  return (
    <div
      className={
        embedded
          ? "w-full overflow-hidden rounded-lg border border-border bg-muted/20 shadow-sm"
          : "absolute left-2 bottom-4 z-[1000] w-[280px] overflow-hidden rounded-lg border border-border shadow-[0_4px_20px_-4px_rgb(0_0_0_/0.08),0_0_0_1px_var(--border)] glass-surface md:w-[320px]"
      }
      role="list"
    >
      <div className="flex items-center justify-between gap-1 border-b border-border px-2 py-1.5">
        <h2 className="text-xs font-semibold">Legend</h2>
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand legend" : "Collapse legend"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <LuChevronDown className="size-3.5" />
          ) : (
            <LuChevronUp className="size-3.5" />
          )}
        </Button>
      </div>
      {!collapsed && comparisonMode && (
        <>
          <div className="border-b border-border bg-primary/10 px-2 py-1.5 text-center text-xs font-medium text-primary">
            Compare: {yearLeft} ↔ {yearRight}
          </div>
          <div className="border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-between gap-1 px-2 text-xs font-normal"
              onClick={() => setShowDiffLegend((v) => !v)}
              aria-expanded={showDiffLegend}
            >
              {comparisonView === "delta" ? "Delta heatmap" : "Show difference legend"}
              {showDiffLegend ? (
                <LuChevronUp className="size-3.5" />
              ) : (
                <LuChevronDown className="size-3.5" />
              )}
            </Button>
            {showDiffLegend && (
              <div className="px-2 pb-2 pt-0">
                {comparisonView === "delta" ? (
                  <>
                    <div
                      className="h-3 w-full rounded-md"
                      style={{
                        background: `linear-gradient(to right, ${getDeltaColor(-1, mapPalette)}, ${getDeltaColor(0, mapPalette)}, ${getDeltaColor(1, mapPalette)})`,
                      }}
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>Decrease</span>
                      <span>No change</span>
                      <span>Increase</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className="h-3 w-full rounded-md"
                      style={{
                        background: `linear-gradient(to right, ${mapPalette.choroplethLow}, ${mapPalette.choroplethMid}, ${mapPalette.choroplethHigh}, ${mapPalette.choroplethMax})`,
                      }}
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </>
      )}
      {!collapsed && (
      <ul className="m-0 flex w-full list-none flex-col gap-0 p-0 text-xs">
        {legendLayers.map((layer, index) => (
          <li
            key={`${layer.dataType}-${layer.id}`}
            className={`flex items-start gap-1 border-b border-border p-2 last:border-b-0 ${
              draggedIndex === index ? "opacity-60" : ""
            } cursor-grab active:cursor-grabbing`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <Tooltip content="Drag to reorder" positioning={{ placement: "top" }}>
              <Button
                variant="ghost"
                size="icon-xs"
                className="mt-0.5 shrink-0 cursor-grab"
                aria-label="Drag to reorder layer"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <LuGripVertical className="size-4" />
              </Button>
            </Tooltip>
            <div className="min-w-0 flex-1">
              <LayerEntry
                {...layer}
                switchLayer={switchLayer}
                setOpacity={setOpacity}
              />
            </div>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}
