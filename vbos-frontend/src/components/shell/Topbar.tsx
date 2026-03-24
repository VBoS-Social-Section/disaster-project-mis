import { useCallback } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { colors } from "@/tokens";
import { DRMIS_VERSION_DISPLAY } from "@/config/version";
import { Tooltip } from "@/components/ui";
import { ColorModeButton } from "@/components/ui/color-mode";
import { Button } from "@/components/ui/button";
import { SystemStatusPill } from "./StatusPill";
import { AlertCountPill } from "./AlertCountPill";
import { UserAvatar } from "./UserAvatar";
import { useViewStore } from "@/store/view-store";
import { useModeTransition } from "@/hooks/useModeTransition";
import {
  HEADER_MODE_IDS,
  HEADER_MODE_META,
  isHeaderModeId,
  type HeaderModeId,
} from "@/config/modes";
import { LuLeaf, LuShield, LuSquareSplitHorizontal } from "react-icons/lu";
import { useUiStore } from "@/store/ui-store";

export interface TopbarProps {
  className?: string;
  /** Alert count for the bell pill (demo default: 0). */
  alertCount?: number;
  alertPulse?: boolean;
  /** When false, hide `<UserAvatar />`. Default **true** (spec). */
  showUserAvatar?: boolean;
}

/**
 * 52px full-width top bar: DRMIS brand, system line, status / alerts / user.
 */
export function Topbar({
  className,
  alertCount = 0,
  alertPulse = false,
  showUserAvatar = true,
}: TopbarProps) {
  const scenarioId = useViewStore((s) => s.scenarioId);
  const { switchToMode } = useModeTransition();
  const primaryWorkspace = useUiStore((s) => s.primaryWorkspace);
  const showViewModeTabs = primaryWorkspace === "operations";

  const headerActiveMode: HeaderModeId | null = isHeaderModeId(scenarioId)
    ? scenarioId
    : null;
  const activeTabIndex = headerActiveMode
    ? HEADER_MODE_IDS.indexOf(headerActiveMode)
    : 0;

  const focusModeTab = useCallback(
    (index: number) => {
      const n = HEADER_MODE_IDS.length;
      const i = ((index % n) + n) % n;
      const id = HEADER_MODE_IDS[i];
      switchToMode(id);
      window.setTimeout(() => {
        document.getElementById(`view-mode-tab-${id}`)?.focus();
      }, 0);
    },
    [switchToMode],
  );

  const modeIcons: Record<HeaderModeId, ReactNode> = {
    disaster: <LuShield className="size-3.5 shrink-0" aria-hidden />,
    climate: <LuLeaf className="size-3.5 shrink-0" aria-hidden />,
    compare: <LuSquareSplitHorizontal className="size-3.5 shrink-0" aria-hidden />,
  };

  const modeActiveClasses: Record<HeaderModeId, string> = {
    disaster:
      "bg-red-500/12 text-red-800 ring-1 ring-red-500/40 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/35",
    climate:
      "bg-emerald-500/12 text-emerald-900 ring-1 ring-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/35",
    compare:
      "bg-violet-500/12 text-violet-900 ring-1 ring-violet-500/40 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/35",
  };

  return (
      <header
      className={cn(
        "col-span-2 row-start-1 flex h-[52px] min-h-[52px] w-full items-center gap-4 border-b px-4",
        className,
      )}
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.surface,
      }}
    >
      {/* Logo lockup — hover shows release string for support */}
      <Tooltip
        content={DRMIS_VERSION_DISPLAY}
        positioning={{ placement: "bottom" }}
        contentProps={{ className: "max-w-[18rem] font-mono text-[11px] text-balance" }}
      >
        <div
          className="flex min-w-0 shrink-0 cursor-default items-center gap-2.5"
          aria-label={`DRMIS — ${DRMIS_VERSION_DISPLAY}`}
        >
          <div
            className="flex size-6 shrink-0 items-center justify-center rounded-sm text-[10px] font-semibold leading-none text-white"
            style={{
              backgroundColor: colors.accent.red,
              fontFamily: "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif",
            }}
            aria-hidden
          >
            DR
          </div>
          <span
            className="truncate text-lg font-extrabold tracking-tight"
            style={{ fontFamily: "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif", fontWeight: 800, color: colors.text.primary }}
          >
            DRMIS
          </span>
        </div>
      </Tooltip>

      <div
        className="hidden h-4 w-px shrink-0 sm:block"
        style={{ backgroundColor: colors.border.strong }}
        aria-hidden
      />

      {showViewModeTabs ? (
        <p
          className="hidden w-auto shrink-0 truncate px-1 text-[10px] font-medium tracking-wide sm:block sm:text-[11px]"
          style={{
            fontFamily:
              "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif",
            color: colors.text.muted,
          }}
        >
          Disaster Risk Management Information System — Vanuatu
        </p>
      ) : (
        <p
          className="min-w-0 flex-1 truncate px-1 text-[10px] font-medium tracking-wide sm:text-[11px]"
          style={{
            fontFamily:
              "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif",
            color: colors.text.muted,
          }}
        >
          Disaster Risk Management Information System — Vanuatu
        </p>
      )}

      {showViewModeTabs ? (
        <div className="flex flex-1 items-center justify-center px-2">
            <div
              data-tour="view-mode"
              className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-muted/60 p-0.5 shadow-sm md:gap-0.5"
              role="tablist"
              aria-label="View mode: Disaster, Climate, or Compare"
              id="view-mode-tablist"
              onKeyDown={(e) => {
                if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                e.preventDefault();
                const base = activeTabIndex >= 0 ? activeTabIndex : 0;
                if (e.key === "ArrowRight") focusModeTab(base + 1);
                else focusModeTab(base - 1);
              }}
            >
              {HEADER_MODE_IDS.map((id) => {
                const selected = scenarioId === id;
                const meta = HEADER_MODE_META[id];
                return (
                  <Button
                    key={id}
                    type="button"
                    variant={selected ? "secondary" : "ghost"}
                    size="sm"
                    id={`view-mode-tab-${id}`}
                    role="tab"
                    aria-selected={selected}
                    aria-controls="drmis-mode-panel"
                    tabIndex={selected ? 0 : -1}
                    className={cn(
                      "h-9 gap-1 px-2 text-xs font-semibold transition-all duration-200 md:h-8 md:px-2.5",
                      selected ? modeActiveClasses[id] : "text-muted-foreground",
                    )}
                    title={`${meta.label}: ${meta.subtitle}`}
                    onClick={() => switchToMode(id)}
                  >
                    <span className="flex items-center gap-1.5">
                      {modeIcons[id]}
                      <span className="hidden sm:inline">{meta.label}</span>
                    </span>
                  </Button>
                );
              })}
            </div>
        </div>
      ) : null}

      <div className="ml-auto flex shrink-0 items-center gap-2.5">
        <SystemStatusPill />
        <AlertCountPill count={alertCount} pulse={alertPulse} />
        <ColorModeButton
          aria-label="Toggle light or dark theme"
          className="size-8 shrink-0 text-[var(--drmis-text-muted)] hover:bg-[var(--drmis-bg-overlay)] hover:text-[var(--drmis-text-primary)]"
        />
        {showUserAvatar ? <UserAvatar /> : null}
      </div>
      </header>
  );
}
