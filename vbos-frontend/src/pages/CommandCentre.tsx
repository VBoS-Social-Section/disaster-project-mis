import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { IncidentsTable } from "@/components/dashboard/IncidentsTable";
import { LiveAlertsPanel } from "@/components/dashboard/LiveAlertsPanel";
import { RiskExposurePanel } from "@/components/dashboard/RiskExposurePanel";
import { NewIncidentDialog } from "@/components/dashboard/NewIncidentDialog";
import { useCommandCentreSyncClock } from "@/hooks/useCommandCentreSyncClock";
import { useRecentSubmissions } from "@/hooks/useRecentSubmissions";
import { useLiveAlerts } from "@/hooks/useLiveAlerts";
import { useFieldTeamsDeployed } from "@/hooks/useFieldTeamsDeployed";
import { useDatasetsUpdatedToday } from "@/hooks/useDatasetsUpdatedToday";
import { colors } from "@/tokens";
import { toast } from "@/utils/toast";
import { LuDownload } from "react-icons/lu";
import { useState } from "react";

/**
 * Command Centre — main landing view after login (dashboard).
 * Layout: title row → metric cards → submissions + alerts / risk column.
 */
export function CommandCentre() {
  const [incidentDialogOpen, setIncidentDialogOpen] = useState(false);
  const { relativeLabel } = useCommandCentreSyncClock(30_000);
  const submissionsQuery = useRecentSubmissions();
  const alertsQuery = useLiveAlerts();
  const fieldTeamsQuery = useFieldTeamsDeployed();
  const datasetsUpdatedTodayQuery = useDatasetsUpdatedToday();

  const pendingCount =
    submissionsQuery.data?.results.filter((s) => s.status === "submitted").length ?? 0;
  const activeAlertCount = alertsQuery.data?.count ?? 0;

  return (
    <div
      className="grid min-h-0 min-w-0 gap-6"
      style={{
        gridTemplateRows: "auto auto minmax(0, 1fr)",
      }}
    >
      {/* Top row: title + subtitle + actions */}
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1
            className="text-[22px] font-bold leading-tight tracking-tight"
            style={{
              fontFamily: "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif",
              fontWeight: 700,
              color: colors.text.primary,
            }}
          >
            Command Centre
          </h1>
          <p
            className="mt-1 text-xs"
            style={{
              color: colors.text.muted,
              fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
            }}
          >
            {relativeLabel}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="border"
            style={{ borderColor: colors.border.default }}
            onClick={() =>
              toast.info(
                "Export",
                "Report export will be available when connected to reporting API.",
              )}
          >
            <LuDownload className="size-3.5" />
            Export Report
          </Button>
          <Button
            type="button"
            size="sm"
            className="font-semibold text-white"
            style={{ backgroundColor: colors.accent.red }}
            onClick={() => setIncidentDialogOpen(true)}
          >
            + New Incident
          </Button>
        </div>
      </header>

      {/* Metric cards — 4 columns on xl */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Pending submissions"
          value={submissionsQuery.isLoading ? "…" : pendingCount}
          subtext="awaiting review"
          accentColor="red"
        />
        <MetricCard
          label="Live alerts"
          value={alertsQuery.isLoading ? "…" : activeAlertCount}
          subtext="USGS · VMGD · GDACS · DRMIS"
          accentColor="amber"
        />
        <MetricCard
          label="Field teams deployed"
          value={fieldTeamsQuery.isLoading ? "…" : (fieldTeamsQuery.data?.count ?? 0)}
          subtext="active in last 24h"
          accentColor="green"
        />
        <MetricCard
          label="Datasets updated today"
          value={datasetsUpdatedTodayQuery.isLoading ? "…" : (datasetsUpdatedTodayQuery.data ?? 0)}
          subtext="from dataset audit log"
          accentColor="blue"
        />
      </div>

      {/* Content: left submissions + right 300px stack */}
      <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-h-0 min-w-0">
          <IncidentsTable
            submissions={submissionsQuery.data?.results}
            isLoading={submissionsQuery.isLoading}
            isError={submissionsQuery.isError}
          />
        </div>
        <div className="flex min-h-0 w-full min-w-0 flex-col gap-4 lg:w-[300px] lg:max-w-[300px]">
          <LiveAlertsPanel />
          <RiskExposurePanel />
        </div>
      </div>
      <NewIncidentDialog open={incidentDialogOpen} onOpenChange={setIncidentDialogOpen} />
    </div>
  );
}
