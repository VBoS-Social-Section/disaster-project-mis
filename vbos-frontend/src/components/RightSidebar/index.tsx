/**
 * Context-aware right panel. Content adapts to user selection:
 * - Raster → Legend + opacity
 * - Tabular → Charts + KPIs
 * - Feature → Drill-down insights
 * - Climate → Land accounts
 * When expanded: dashboard layout with compact filters and modern styling.
 */
import { Sidebar } from "../Sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui";
import { LuDownload } from "react-icons/lu";
import { AreaSelect } from "./AreaSelect";
import { AttributeFilterSelect } from "./AttributeFilterSelect";
import { TabularDatasetSelect } from "./TabularDatasetSelect";
import { YearSelect } from "./YearSelect";
import { ContextPanelContent } from "../ContextPanel/ContextPanelContent";
import { DownloadDataDialog } from "./DownloadDataDialog";
import { useState } from "react";
import { usePanelContext } from "@/hooks/usePanelContext";
import { useViewStore } from "@/store/view-store";
import { useUiStore } from "@/store/ui-store";
import { Suspense, lazy } from "react";
import { cn } from "@/lib/utils";

const FloatingKpiCards = lazy(() =>
  import("../FloatingKpiCards").then((m) => ({ default: m.default })),
);

const RightSidebar = () => {
  const [downloadDialogIsOpen, setDownloadDialogIsOpen] = useState(false);
  const { context, hasActiveLayers } = usePanelContext();
  const scenarioId = useViewStore((s) => s.scenarioId);
  const rightSidebarExpanded = useUiStore((s) => s.rightSidebarExpanded);
  const hasRelevantContent = context !== "empty";

  return (
    <Sidebar
      direction="right"
      title="Context"
      collapseWhen={!hasRelevantContent}
    >
      <div
        className={cn(
          "border-b border-border bg-card",
          rightSidebarExpanded ? "px-6 py-4" : "px-5 py-4 md:px-6 md:py-4",
        )}
      >
        <AreaSelect />
      </div>
      <div
        className={cn(
          "scrollbar-thin flex-1 overflow-auto bg-card",
          rightSidebarExpanded
            ? "min-h-0 bg-gradient-to-b from-muted/20 to-background px-6 py-6"
            : "px-5 py-4 md:px-6 md:py-5 space-y-4",
        )}
      >
        {rightSidebarExpanded ? (
          <div className="w-full space-y-6">
            <div className="flex flex-wrap items-end gap-6 rounded-xl border border-border/40 bg-card/95 p-5 shadow-sm">
              <TabularDatasetSelect />
              {scenarioId === "climate" ? null : <YearSelect />}
            </div>
            <AttributeFilterSelect />
            <Suspense fallback={null}>
              <FloatingKpiCards />
            </Suspense>
            <ContextPanelContent />
          </div>
        ) : (
          <>
            <TabularDatasetSelect />
            <AttributeFilterSelect />
            {scenarioId === "climate" ? null : <YearSelect />}
            <Suspense fallback={null}>
              <FloatingKpiCards />
            </Suspense>
            <ContextPanelContent />
          </>
        )}
      </div>
      <div
        className={cn(
          "sticky bottom-0 mt-auto border-t border-border bg-card",
          rightSidebarExpanded ? "px-6 py-4" : "px-5 py-4 md:px-6 md:py-4",
        )}
      >
        <Tooltip
          content={
            !hasActiveLayers
              ? "Enable a data layer to download"
              : "Download active datasets (respects province, area council, and year filters)"
          }
          positioning={{ placement: "top" }}
        >
          <Button
            className="download-accent-pill hover-lift w-full rounded-full font-semibold"
            onClick={() => setDownloadDialogIsOpen(true)}
            disabled={!hasActiveLayers}
          >
            <LuDownload className="size-4" />
            Download Data
          </Button>
        </Tooltip>
      </div>
      <DownloadDataDialog
        isOpen={downloadDialogIsOpen}
        setIsOpen={setDownloadDialogIsOpen}
      />
    </Sidebar>
  );
};

export { RightSidebar };
