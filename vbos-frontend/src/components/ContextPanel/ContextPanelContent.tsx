/**
 * Context-aware panel content. Shows relevant UI based on user selection.
 */
import { LuLayers } from "react-icons/lu";
import { usePanelContext } from "@/hooks/usePanelContext";
import { useScenario } from "@/hooks/useScenario";
import { useAreaStore } from "@/store/area-store";
import { ClimateLayout } from "@/components/RightSidebar/ClimateLayout";
import { ComparisonMode } from "@/components/RightSidebar/ComparisonMode";
import { LandCoverTotalsChart } from "@/components/RightSidebar/LandCoverTotalsChart";
import { Stats } from "@/components/RightSidebar/Stats";
import { ImpactModeCard } from "@/components/RightSidebar/ImpactModeCard";
import { FeatureInsights } from "./FeatureInsights";

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
  const { province } = useAreaStore();

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
      <div className="space-y-4">
        {scenario.id === "disaster" && <ImpactModeCard />}
        {hasTabular && (
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-3">
            <p className="mb-2 text-xs text-muted-foreground">
              Compare years (swipe or delta heatmap)
            </p>
            <ComparisonMode />
          </div>
        )}
        {!province && scenario.uiConfig.showStats && (
          <div className="rounded-md border border-border bg-muted px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Showing national data. Select a province above for area-level breakdown.
            </p>
          </div>
        )}
        <Stats />
      </div>
    );
  }

  if (context === "raster") {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Legend and opacity controls are on the map. Use the legend at the bottom-left to adjust layers.
        </p>
      </div>
    );
  }

  if (context === "climate") {
    return (
      <div className="space-y-4">
        <LandCoverTotalsChart />
        <ClimateLayout />
      </div>
    );
  }

  return <EmptyState />;
}
