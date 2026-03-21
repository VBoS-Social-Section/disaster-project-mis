import { colors } from "@/tokens";
import { cn } from "@/lib/utils";

export type AlertDotColor = "red" | "amber" | "blue";

const dotColor: Record<AlertDotColor, string> = {
  red: colors.accent.red,
  amber: colors.accent.amber,
  blue: colors.accent.blue,
};

export interface LiveAlertItem {
  id: string;
  /** Left indicator colour */
  dot: AlertDotColor;
  text: string;
  /** Shown in mono, muted (e.g. “14:02” or “13:18:05”) */
  timestamp: string;
}

const PLACEHOLDER_ALERTS: LiveAlertItem[] = [
  {
    id: "a1",
    dot: "red",
    text: "NDMO advisory: elevated swell Shefa coast",
    timestamp: "14:02",
  },
  {
    id: "a2",
    dot: "amber",
    text: "Met office: thunderstorm watch Malampa",
    timestamp: "13:18",
  },
  {
    id: "a3",
    dot: "blue",
    text: "Field team check-in — Luganville depot",
    timestamp: "11:45",
  },
  {
    id: "a4",
    dot: "amber",
    text: "Coastal road advisory: low-lying areas Shefa",
    timestamp: "10:22",
  },
  {
    id: "a5",
    dot: "blue",
    text: "System: backup sync completed successfully",
    timestamp: "09:58",
  },
  {
    id: "a6",
    dot: "red",
    text: "Evacuation readiness drill — Port Vila",
    timestamp: "08:30",
  },
];

/** Approximate height for one alert row; list max height ≈ 5 rows then scrolls. */
const ROW_REM = 4;

export interface LiveAlertsPanelProps {
  alerts?: LiveAlertItem[];
  /** Called when the user taps Silence (e.g. mute notifications). */
  onSilence?: () => void;
  className?: string;
}

/**
 * Live operational alerts: dot + message + timestamp; list scrolls after ~5 items.
 */
export function LiveAlertsPanel({
  alerts = PLACEHOLDER_ALERTS,
  onSilence,
  className,
}: LiveAlertsPanelProps) {
  return (
    <section
      className={cn("flex min-h-0 flex-col overflow-hidden rounded-lg border", className)}
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.surface,
      }}
      aria-labelledby="live-alerts-heading"
    >
      <header
        className="flex items-center justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: colors.border.default }}
      >
        <h2
          id="live-alerts-heading"
          className="text-sm font-semibold leading-tight"
          style={{ color: colors.text.primary }}
        >
          Live Alerts
        </h2>
        <button
          type="button"
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-muted/30 focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--drmis-bg-surface)]"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            color: colors.text.muted,
          }}
          onClick={() => onSilence?.()}
        >
          Silence
        </button>
      </header>

      <ul
        className="scrollbar-thin divide-y divide-[var(--drmis-border-default)] overflow-y-auto"
        style={{
          maxHeight: `calc(${ROW_REM}rem * 5)`,
        }}
        aria-live="polite"
      >
        {alerts.map((a) => (
          <li key={a.id} className="flex gap-3 px-4 py-3">
            <span
              className="mt-1.5 size-2 shrink-0 rounded-full"
              style={{ backgroundColor: dotColor[a.dot] }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] leading-snug" style={{ color: colors.text.secondary }}>
                {a.text}
              </p>
              <p
                className="mt-1 text-[11px] tabular-nums leading-none"
                style={{
                  color: colors.text.muted,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {a.timestamp}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
