/**
 * A scenario must never be mistaken for a real disaster, on screen, in a screenshot or
 * in a printed report. While one is selected this tag stays on the map.
 */
import { LuFlaskConical } from "react-icons/lu";
import { useSelectedEvent } from "@/hooks/useEvents";
import { useT } from "@/i18n";

export function ScenarioTag() {
  const event = useSelectedEvent();
  const { t } = useT();
  if (!event?.is_scenario) return null;

  return (
    <div
      className="scenario-tag pointer-events-none absolute left-1/2 top-3 z-[1000] flex max-w-[calc(100%-7rem)] -translate-x-1/2 items-center gap-2 rounded-md border-2 border-amber-600 bg-amber-100 px-3 py-1 text-amber-950 shadow-md"
      role="status"
      title={t("scenario.explain")}
    >
      <LuFlaskConical className="size-4 shrink-0" aria-hidden />
      <span className="truncate text-xs font-bold uppercase tracking-wider">
        {t("scenario.tag")}
      </span>
    </div>
  );
}
