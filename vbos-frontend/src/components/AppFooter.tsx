/**
 * Slim status bar: who owns the system, how fresh the data is, and whether the device is
 * online. Government systems are expected to say all three on every screen.
 */
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { LuLeaf, LuRefreshCw, LuWifiOff } from "react-icons/lu";
import { SITE } from "@/config/site";
import { useLayerStore } from "@/store/layer-store";
import { useOfflineStore } from "@/store/offline-store";
import { useLowData } from "@/store/low-data-store";
import { useT } from "@/i18n";

/** Most recent time any data was fetched from the server in this session. */
function useLastSynced(): Date | null {
  const queryClient = useQueryClient();
  // Re-render whenever a fetch starts or ends
  useIsFetching();
  const latest = Math.max(
    0,
    ...queryClient
      .getQueryCache()
      .getAll()
      .map((q) => q.state.dataUpdatedAt),
  );
  return latest > 0 ? new Date(latest) : null;
}

export function AppFooter() {
  const { t, locale } = useT();
  const isOnline = useOfflineStore((s) => s.isOnline);
  const lowData = useLowData();
  const lastSynced = useLastSynced();
  const { layers, allDatasets } = useLayerStore();

  // "Data as of": the newest update among the layers on screen (or everything loaded)
  const active = new Set(layers.split(","));
  const onScreen = allDatasets.filter((d) => active.has(`${d.dataType[0]}${d.id}`));
  const newest = (onScreen.length ? onScreen : allDatasets)
    .map((d) => Date.parse(d.updated))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => b - a)[0];
  const sources = [...new Set(onScreen.map((d) => d.source).filter(Boolean))] as string[];

  const date = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" });

  return (
    <footer className="flex h-6 min-w-0 items-center gap-3 border-t border-border bg-muted/60 px-3 text-[11px] text-muted-foreground print:hidden">
      <span className="hidden min-w-0 truncate sm:inline">
        <span className="font-medium text-foreground/80">{SITE.government}</span>
        {SITE.agency && <> · {SITE.agency}</>}
        <span className="hidden lg:inline"> · {t("gov.officialSystem")}</span>
      </span>
      <span className="ml-auto flex min-w-0 shrink-0 items-center gap-3">
        {sources.length > 0 && (
          <span className="hidden max-w-[22rem] truncate xl:inline" title={sources.join("; ")}>
            {t("footer.sources")}: {sources.join("; ")}
          </span>
        )}
        {newest != null && <span>{t("footer.dataAsOf", { date: date.format(newest) })}</span>}
        {lowData.active && (
          <span
            className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400"
            title={lowData.automatic ? t("lowData.auto") : t("lowData.help")}
          >
            <LuLeaf className="size-3" aria-hidden />
            {t("lowData.label")}
          </span>
        )}
        <span
          className={
            isOnline ? "flex items-center gap-1" : "flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400"
          }
          role="status"
        >
          {isOnline ? (
            <LuRefreshCw className="size-3" aria-hidden />
          ) : (
            <LuWifiOff className="size-3" aria-hidden />
          )}
          {!isOnline
            ? t("sync.offline")
            : lastSynced
              ? t("sync.lastSynced", { time: time.format(lastSynced) })
              : t("sync.never")}
        </span>
      </span>
    </footer>
  );
}
