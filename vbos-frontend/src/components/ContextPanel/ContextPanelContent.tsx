/**
 * Context-aware panel content. Shows relevant UI based on user selection.
 */
import { LuLayers } from "react-icons/lu";
import { usePanelContext } from "@/hooks/usePanelContext";
import { useScenario } from "@/hooks/useScenario";
import { useAreaStore } from "@/store/area-store";
import { useUiStore } from "@/store/ui-store";
import { ClimateContextByModule } from "@/components/RightSidebar/ClimateContextByModule";
import { Stats } from "@/components/RightSidebar/Stats";
import { CycloneIntensityCard } from "@/components/RightSidebar/CycloneIntensityCard";
import { FeatureInsights } from "./FeatureInsights";
import { cn } from "@/lib/utils";

function EmptyState({ isClimate }: { isClimate: boolean }) {
  if (isClimate) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <LuLayers className="mb-3 size-8 text-muted-foreground/60" />
        <p className="mb-1 text-sm font-semibold text-foreground">
          Select a climate layer
        </p>
        <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
          Choose a climate module and year to load map layers, trends, and analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-start gap-2">
        <LuLayers className="mt-0.5 size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            Start with these 3 steps
          </p>
          <p className="text-xs text-muted-foreground">
            Build your map workflow in order to view analysis.
          </p>
        </div>
      </div>
      <ol className="space-y-2 text-xs">
        <li className="rounded-md border border-border/70 bg-card/60 px-3 py-2 text-foreground">
          <span className="mr-2 font-semibold text-muted-foreground">1.</span>
          Pick a cluster in the left panel.
        </li>
        <li className="rounded-md border border-border/70 bg-card/60 px-3 py-2 text-foreground">
          <span className="mr-2 font-semibold text-muted-foreground">2.</span>
          Choose a data view: Baseline, Damage, Resources, or Financial.
        </li>
        <li className="rounded-md border border-border/70 bg-card/60 px-3 py-2 text-foreground">
          <span className="mr-2 font-semibold text-muted-foreground">3.</span>
          Toggle a layer on in the left panel to unlock charts and insights here.
        </li>
      </ol>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Once a layer is active, this panel shows key metrics, distribution charts, and contextual
        analysis.
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
    return <EmptyState isClimate={scenario.id === "climate"} />;
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
      <ClimateContextByModule />
    );
  }

  return <EmptyState isClimate={scenario.id === "climate"} />;
}
