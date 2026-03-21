import { cn } from "@/lib/utils";
import { colors } from "@/tokens";
import { NavItem } from "./NavItem";
import {
  LuLayoutDashboard,
  LuMap,
  LuDatabase,
  LuDownload,
  LuClipboardCheck,
  LuSettings2,
} from "react-icons/lu";

export interface SidebarProps {
  activeId: string;
  onNavigate: (id: string) => void;
  className?: string;
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3
      className="mb-2 mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.12em] first:mt-0"
      style={{ color: colors.sidebar.textMuted }}
    >
      {children}
    </h3>
  );
}

/**
 * Left navigation: Operations, Data, Governance — 220px column.
 */
export function Sidebar({ activeId, onNavigate, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "row-start-2 col-start-1 flex min-h-0 w-[220px] shrink-0 flex-col overflow-y-auto border-r px-2 py-3",
        className,
      )}
      style={{
        borderColor: colors.sidebar.border,
        backgroundColor: colors.sidebar.bg,
      }}
      aria-label="Main navigation"
    >
      <nav className="flex flex-col gap-0.5">
        <SectionTitle>Operations</SectionTitle>
        <NavItem
          label="Dashboard"
          icon={<LuLayoutDashboard />}
          active={activeId === "dashboard"}
          onClick={() => onNavigate("dashboard")}
        />
        <NavItem
          label="Live map"
          icon={<LuMap />}
          active={activeId === "live-map"}
          badge={2}
          badgeVariant="red"
          onClick={() => onNavigate("live-map")}
        />

        <SectionTitle>Data</SectionTitle>
        <NavItem
          label="Datasets"
          icon={<LuDatabase />}
          active={activeId === "datasets"}
          onClick={() => onNavigate("datasets")}
        />
        <NavItem
          label="Exports"
          icon={<LuDownload />}
          active={activeId === "exports"}
          badge="New"
          badgeVariant="blue"
          onClick={() => onNavigate("exports")}
        />

        <SectionTitle>Governance</SectionTitle>
        <NavItem
          label="Audit log"
          icon={<LuClipboardCheck />}
          active={activeId === "audit"}
          onClick={() => onNavigate("audit")}
        />
        <NavItem
          label="Settings"
          icon={<LuSettings2 />}
          active={activeId === "settings"}
          onClick={() => onNavigate("settings")}
        />
      </nav>
    </aside>
  );
}
