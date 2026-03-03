/**
 * Context-aware right panel. Content adapts to user selection:
 * - Raster → Legend + opacity
 * - Tabular → Charts + KPIs
 * - Feature → Drill-down insights
 * - Climate → Land accounts
 */
import { Sidebar } from "../Sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui";
import { LuDownload } from "react-icons/lu";
import { AreaSelect } from "./AreaSelect";
import { YearSelect } from "./YearSelect";
import { ContextPanelContent } from "../ContextPanel/ContextPanelContent";
import { DownloadDataDialog } from "./DownloadDataDialog";
import { useState } from "react";
import { usePanelContext } from "@/hooks/usePanelContext";
import { useViewStore } from "@/store/view-store";

const RightSidebar = () => {
  const [downloadDialogIsOpen, setDownloadDialogIsOpen] = useState(false);
  const { context, hasActiveLayers } = usePanelContext();
  const scenarioId = useViewStore((s) => s.scenarioId);

  const hasRelevantContent = context !== "empty";

  return (
    <Sidebar
      direction="right"
      title="Context"
      collapseWhen={!hasRelevantContent}
    >
      <div className="border-b border-border bg-card px-5 py-4 md:px-6 md:py-4">
        <AreaSelect />
      </div>
      <div className="scrollbar-thin flex-1 overflow-auto bg-card px-5 py-4 md:px-6 md:py-5 space-y-4">
        {scenarioId === "climate" ? null : <YearSelect />}
        <ContextPanelContent />
      </div>
      <div className="sticky bottom-0 mt-auto border-t border-border bg-card px-5 py-4 md:px-6 md:py-4">
        <Tooltip
          content={!hasActiveLayers ? "Enable a data layer to download" : "Download active datasets"}
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
