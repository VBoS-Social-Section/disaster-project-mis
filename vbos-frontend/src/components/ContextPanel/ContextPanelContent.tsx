/**
 * Context-aware panel content. Shows relevant UI based on user selection.
 */
import { LuLayers } from "react-icons/lu";
import { usePanelContext } from "@/hooks/usePanelContext";
import { useScenario } from "@/hooks/useScenario";
import { useAreaStore } from "@/store/area-store";
import { useUiStore } from "@/store/ui-store";
import { ClimateLayout } from "@/components/RightSidebar/ClimateLayout";
import { ComparisonMode } from "@/components/RightSidebar/ComparisonMode";
import { LandCoverTotalsChart } from "@/components/RightSidebar/LandCoverTotalsChart";
import { Stats } from "@/components/RightSidebar/Stats";
import { ImpactModeCard } from "@/components/RightSidebar/ImpactModeCard";
import { CycloneIntensityCard } from "@/components/RightSidebar/CycloneIntensityCard";
import { FeatureInsights } from "./FeatureInsights";
import { cn } from "@/lib/utils";

function EmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
      <LuLayers className="mb-3 size-8 text-muted-foreground/60" />
      <p className="mb-1 text-sm font-semibold text-foreground">
        Select a layer
      </p>
      <p className="max-w-[200px] text-xs leading-relaxed text-muted-foreground">
        Enable a data layer from the left panel to see charts, legend, and analysis here.
      </p>
    </div>
  );
}

export function ContextPanelContent() {
  const { context, hasTabular } = usePanelContext();
  const scenario = useScenario();
  const { provinces } = useAreaStore();
  const rightSidebarExpanded = useUiStore((s) => s.rightSidebarExpanded);

  if (context === "empty") {
    return <EmptyState />;
  }

  if (context === "feature") {
    return (
      <div className="space-y-4">
        <FeatureInsights />
      </div>
    );
  }

  if (context === "tabular") {
    return (
      <div className={cn("space-y-4", rightSidebarExpanded && "space-y-6")}>
        {provinces.length === 0 && scenario.uiConfig.showStats && (
          <div className="rounded-md border border-border bg-muted px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Showing national data. Select a province above for area-level breakdown.
            </p>
          </div>
        )}
        {rightSidebarExpanded && hasTabular && (
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Analytics
            </h3>
            <div className="h-px flex-1 bg-border/60" />
          </div>
        )}
        <Stats />
      </div>
    );
  }

  if (context === "raster") {
    return (
      <div className="space-y-4">
        <CycloneIntensityCard />
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Legend and opacity controls are on the map. Use the legend at the bottom-left to adjust layers.
          </p>
        </div>
      </div>
    );
  }

  if (context === "climate") {
    return (
      <div className="space-y-4">
        <ImpactModeCard />
        <div
          className={cn(
            "rounded-lg border border-border bg-muted/30 px-3 py-3",
            rightSidebarExpanded && "rounded-xl border-border/50 bg-card/80 px-4 py-4 shadow-sm",
          )}
        >
          <p className="mb-2 text-xs text-muted-foreground">
            Compare years (swipe or delta heatmap)
          </p>
          <ComparisonMode />
        </div>
        <LandCoverTotalsChart />
        <ClimateLayout />
      </div>
    );
  }

  return <EmptyState />;
}
