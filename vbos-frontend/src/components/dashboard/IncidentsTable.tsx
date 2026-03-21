import { colors } from "@/tokens";
import { cn } from "@/lib/utils";

export type SeverityLevel = "Critical" | "High" | "Medium" | "Low" | "Watch";

/** Border, fill, and label colours — readable on light and dark surfaces. */
const severityBadge: Record<
  SeverityLevel,
  { border: string; background: string; color: string }
> = {
  Critical: {
    border: colors.accent.red,
    background: "rgba(255, 75, 43, 0.12)",
    color: "#9B3418",
  },
  High: {
    border: colors.accent.amber,
    background: "rgba(245, 166, 35, 0.12)",
    color: "#854F0B",
  },
  Medium: {
    border: colors.accent.blue,
    background: "rgba(77, 144, 255, 0.12)",
    color: "#185FA5",
  },
  Low: {
    border: colors.accent.green,
    background: "rgba(48, 232, 122, 0.12)",
    color: "#27500A",
  },
  Watch: {
    border: "#5DCAA5",
    background: "rgba(93, 202, 165, 0.12)",
    color: "#085041",
  },
};

export interface SeverityBadgeProps {
  level: SeverityLevel;
  className?: string;
}

/**
 * Pill badge: border + tinted background + dark text for contrast in both themes.
 */
export function SeverityBadge({ level, className }: SeverityBadgeProps) {
  const s = severityBadge[level];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none",
        className,
      )}
      style={{
        borderColor: s.border,
        backgroundColor: s.background,
        color: s.color,
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      {level}
    </span>
  );
}

function formatIncidentDate(d: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export interface IncidentRow {
  id: string;
  severity: SeverityLevel;
  name: string;
  location: string;
  /** Displayed as “20 Mar” in mono */
  date: Date;
  status: string;
}

const PLACEHOLDER_ROWS: IncidentRow[] = [
  {
    id: "1",
    severity: "High",
    name: "Cyclone — North Efate",
    location: "Shefa",
    date: new Date(2026, 2, 20),
    status: "Active response",
  },
  {
    id: "2",
    severity: "Medium",
    name: "Coastal flood — Luganville",
    location: "Sanma",
    date: new Date(2026, 2, 19),
    status: "Monitoring",
  },
  {
    id: "3",
    severity: "Low",
    name: "Landslide watch — Tanna",
    location: "Tafea",
    date: new Date(2026, 2, 18),
    status: "Watch",
  },
  {
    id: "4",
    severity: "Watch",
    name: "Drought advisory — South",
    location: "Tafea",
    date: new Date(2026, 2, 17),
    status: "Advisory",
  },
];

const headerMono = {
  fontFamily: "'IBM Plex Mono', monospace",
  color: colors.text.ghost,
} as const;

export interface IncidentsTableProps {
  rows?: IncidentRow[];
  /** Called when “View all” is activated (e.g. navigate or open drawer). */
  onViewAll?: () => void;
  className?: string;
}

/**
 * Recent incidents panel: severity badges, incident + location, short dates, status.
 */
export function IncidentsTable({
  rows = PLACEHOLDER_ROWS,
  onViewAll,
  className,
}: IncidentsTableProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border",
        className,
      )}
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.surface,
      }}
      aria-labelledby="recent-incidents-heading"
    >
      <header
        className="flex items-center justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: colors.border.default }}
      >
        <h2
          id="recent-incidents-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            color: colors.text.muted,
          }}
        >
          Recent Incidents
        </h2>
        <button
          type="button"
          className="text-[11px] font-semibold uppercase tracking-wide underline-offset-2 transition-opacity hover:opacity-90 focus-visible:outline focus-visible:ring-2 focus-visible:ring-[#4D90FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--drmis-bg-surface)]"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            color: colors.accent.blue,
          }}
          onClick={() => onViewAll?.()}
        >
          View all →
        </button>
      </header>

      <div className="scrollbar-thin min-h-[200px] overflow-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border.default}` }}>
              {(["Severity", "Incident", "Date", "Status"] as const).map((label) => (
                <th
                  key={label}
                  className="px-4 py-2.5 text-[9px] font-semibold uppercase tracking-[0.1em]"
                  style={headerMono}
                  scope="col"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="transition-colors hover:bg-muted/30"
                style={{ borderBottom: `1px solid ${colors.border.default}` }}
              >
                <td className="px-4 py-3 align-middle">
                  <SeverityBadge level={row.severity} />
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="min-w-0">
                    <div
                      className="text-sm font-medium leading-snug"
                      style={{ color: colors.text.primary }}
                    >
                      {row.name}
                    </div>
                    <div
                      className="mt-0.5 text-xs leading-snug"
                      style={{ color: colors.text.muted }}
                    >
                      {row.location}
                    </div>
                  </div>
                </td>
                <td
                  className="px-4 py-3 align-middle text-sm tabular-nums"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: colors.text.secondary,
                  }}
                >
                  {formatIncidentDate(row.date)}
                </td>
                <td
                  className="px-4 py-3 align-middle text-sm"
                  style={{ color: colors.text.secondary }}
                >
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
