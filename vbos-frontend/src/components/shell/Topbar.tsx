import { cn } from "@/lib/utils";
import { colors } from "@/tokens";
import { DRMIS_VERSION_DISPLAY } from "@/config/version";
import { Tooltip } from "@/components/ui";
import { ColorModeButton } from "@/components/ui/color-mode";
import { SystemStatusPill } from "./StatusPill";
import { AlertCountPill } from "./AlertCountPill";
import { UserAvatar } from "./UserAvatar";

export interface TopbarProps {
  className?: string;
  /** Alert count for the bell pill (demo default: 0). */
  alertCount?: number;
  onAvatarClick?: () => void;
  /** When false, hide `<UserAvatar />`. Default **true** (spec). */
  showUserAvatar?: boolean;
}

/**
 * 52px full-width top bar: DRMIS brand, system line, status / alerts / user.
 */
export function Topbar({
  className,
  alertCount = 0,
  onAvatarClick,
  showUserAvatar = true,
}: TopbarProps) {
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
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            aria-hidden
          >
            DR
          </div>
          <span
            className="truncate text-lg font-extrabold tracking-tight"
            style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: colors.text.primary }}
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

      <p
        className="min-w-0 flex-1 truncate px-1 text-[10px] font-medium tracking-wide sm:text-[11px]"
        style={{ fontFamily: "'IBM Plex Mono', monospace", color: colors.text.muted }}
      >
        Disaster Risk Management — Vanuatu
      </p>

      <div className="ml-auto flex shrink-0 items-center gap-2.5">
        <SystemStatusPill />
        <AlertCountPill count={alertCount} />
        <ColorModeButton
          aria-label="Toggle light or dark theme"
          className="size-8 shrink-0 text-[var(--drmis-text-muted)] hover:bg-[var(--drmis-bg-overlay)] hover:text-[var(--drmis-text-primary)]"
        />
        {showUserAvatar ? <UserAvatar onClick={onAvatarClick} /> : null}
      </div>
    </header>
  );
}
