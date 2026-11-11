/**
 * Impact Mode: Estimated affected population card.
 */
import { useImpactModeStore } from "@/store/impact-mode-store";
import { useEstimatedAffectedPopulation } from "@/hooks/useEstimatedAffectedPopulation";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LuUsers, LuZap } from "react-icons/lu";
import { formatCompactNumber } from "@/utils/formatCharts";

export function ImpactModeCard() {
  const { enabled, setEnabled } = useImpactModeStore();
  const result = useEstimatedAffectedPopulation();

  const canCompute = result !== null;
  const showCard = enabled && canCompute;

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
        <div className="flex min-w-0 items-start gap-2">
          <LuZap className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <div className="min-w-0">
            <label htmlFor="impact-mode-switch" className="text-sm font-medium">
              Impact Mode
            </label>
            <p id="impact-mode-help" className="text-xs leading-snug text-muted-foreground">
              Estimates how many people are affected: adds up the population of every area
              where the selected dataset reports a hazard or damage.
            </p>
          </div>
        </div>
        <Switch
          id="impact-mode-switch"
          aria-describedby="impact-mode-help"
          className="mt-0.5 shrink-0"
          checked={enabled}
          onCheckedChange={setEnabled}
        />
      </div>
      {enabled && !canCompute && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          No estimate for this dataset: it needs both a population figure and a hazard or
          damage figure. Try a Damage dataset under Data view.
        </p>
      )}
      {showCard && (
        <Card className="overflow-hidden border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold leading-none">
              <LuUsers className="size-4" />
              Estimated affected population
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 pt-0">
            <p className="font-mono-num text-2xl font-bold tabular-nums">
              {formatCompactNumber(result.affected)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Population in areas with {result.hazardAttr.replace(/_/g, " ")} &gt; 0
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
