import { cn } from "@/lib/utils";
import { colors } from "@/tokens";
import { LuBell } from "react-icons/lu";

export interface AlertCountPillProps {
  count: number;
  className?: string;
  /** Screen reader label, e.g. "Unread alerts" */
  ariaLabel?: string;
}

/**
 * Topbar alert counter — pill with optional red emphasis when count &gt; 0.
 */
export function AlertCountPill({
  count,
  className,
  ariaLabel = "Alerts",
}: AlertCountPillProps) {
  const hasAlerts = count > 0;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors",
        "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D90FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--drmis-bg-surface)]",
        className,
      )}
      style={{
        borderColor: hasAlerts ? colors.accent.red : colors.border.default,
        backgroundColor: hasAlerts ? `${colors.accent.red}18` : colors.bg.surface,
      }}
      aria-label={`${ariaLabel}: ${count}`}
    >
      <LuBell
        className="size-3.5 shrink-0"
        style={{ color: hasAlerts ? colors.accent.red : colors.text.muted }}
        aria-hidden
      />
      <span
        className="min-w-[1.25rem] text-center text-[11px] font-semibold tabular-nums"
        style={{
          color: hasAlerts ? colors.text.primary : colors.text.muted,
          fontFamily: "'IBM Plex Mono', monospace",
        }}
      >
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
}
