/**
 * The answer first: what the selected event means for the selected area, in one sentence,
 * followed by the breakdown behind it. Shown at the top of the right panel and reused in
 * the printed situation report.
 */
import { LuTriangleAlert } from "react-icons/lu";
import { useImpactSummary } from "@/hooks/useImpactSummary";
import { categoryStyle } from "@/config/disaster";
import { formatCompactNumber } from "@/utils/formatCharts";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

function CategoryChip({ rank }: { rank: number }) {
  const { color, text } = categoryStyle(rank);
  return (
    <span
      className="inline-flex h-4 w-5 shrink-0 items-center justify-center rounded-sm border border-black/20 text-[10px] font-bold leading-none"
      style={{ backgroundColor: color, color: text }}
      aria-hidden
    >
      {rank}
    </span>
  );
}

export function ImpactSummary({ className }: { className?: string }) {
  const summary = useImpactSummary();
  const { t, locale } = useT();

  if (!summary.event || !summary.ready) return null;
  const { event, areaNames, councilsByRank, ranks, worstRank, exposure } = summary;

  const area =
    areaNames.length === 0
      ? t("impact.national")
      : areaNames.length <= 2
        ? areaNames.join(` ${t("impact.and")} `)
        : `${areaNames.slice(0, 2).join(", ")} +${areaNames.length - 2}`;

  const number = (n: number) =>
    n >= 10000 ? formatCompactNumber(n) : Math.round(n).toLocaleString(locale);
  const councilCount = (n: number) =>
    n === 1 ? t("impact.oneCouncil") : t("impact.manyCouncils", { n });

  // Headline: the sector's two largest figures in the worst category present, or the
  // number of area councils in it when no baseline table is on screen
  let headline: string;
  if (worstRank === 0) {
    headline = t("impact.headlineNone", { area });
  } else {
    const figures = exposure
      .filter((r) => (r.byRank[worstRank] ?? 0) > 0)
      .slice(0, 2)
      .map((r) => `${number(r.byRank[worstRank])} ${r.label}`);
    const items =
      figures.length > 0
        ? figures.join(` ${t("impact.and")} `)
        : councilCount(councilsByRank[worstRank] ?? 0);
    headline = t("impact.headline", { area, items, n: worstRank });
  }

  const affectedRanks = ranks.filter((r) => r > 0);
  const columns = [...affectedRanks, ...(ranks.includes(0) ? [0] : [])];

  return (
    <section
      className={cn(
        "impact-summary rounded-lg border border-border bg-card p-3 shadow-sm",
        worstRank > 0 && "border-l-4",
        className,
      )}
      style={worstRank > 0 ? { borderLeftColor: categoryStyle(worstRank).color } : undefined}
      aria-labelledby="impact-summary-title"
    >
      <div className="flex items-center gap-1.5">
        <LuTriangleAlert className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <h3
          id="impact-summary-title"
          className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
        >
          {t("impact.title")} · {event.name}
        </h3>
      </div>
      <p className="mt-1.5 text-sm font-semibold leading-snug text-foreground">{headline}</p>

      <div className="mt-3">
        <p className="mb-1 text-[11px] text-muted-foreground">{t("impact.councils")}</p>
        <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0 text-xs">
          {columns.map((rank) => (
            <li key={rank} className="flex items-center gap-1.5">
              <CategoryChip rank={rank} />
              <span>
                <span className="font-semibold tabular-nums">{councilsByRank[rank]}</span>{" "}
                <span className="text-muted-foreground">
                  {rank === 0 ? t("impact.notAffected") : t("impact.category", { n: rank })}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {exposure.length > 0 && (
        <div className="mt-3">
          <table className="w-full border-collapse text-xs">
            <caption className="mb-1 text-left text-[11px] text-muted-foreground">
              {t("impact.exposure")}
            </caption>
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th scope="col" className="py-1 pr-2 text-left font-medium" />
                {columns.map((rank) => (
                  <th key={rank} scope="col" className="px-1 py-1 text-right font-medium">
                    <span className="inline-flex items-center justify-end gap-1">
                      <CategoryChip rank={rank} />
                      <span className="sr-only">
                        {rank === 0 ? t("impact.notAffected") : t("impact.category", { n: rank })}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exposure.map((row) => (
                <tr key={row.attribute} className="border-b border-border/50 last:border-b-0">
                  <th scope="row" className="py-1 pr-2 text-left font-normal first-letter:uppercase">
                    {row.label}
                  </th>
                  {columns.map((rank) => (
                    <td key={rank} className="px-1 py-1 text-right tabular-nums">
                      {row.byRank[rank] ? number(row.byRank[rank]) : "–"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
            {t("impact.exposureNote")}
          </p>
        </div>
      )}
    </section>
  );
}
