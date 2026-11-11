/**
 * Situation report: the current view laid out for paper or PDF.
 *
 * The report is the page itself printed through a print stylesheet (see "Situation
 * report" in index.css): the panels are hidden, the map keeps the extent the user set,
 * and the blocks below are placed above and beneath it. Nothing is uploaded or rendered
 * on a server, so it works offline and on a slow connection.
 */
import { LuFileText } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ImpactSummary } from "@/components/RightSidebar/ImpactSummary";
import { SITE } from "@/config/site";
import { formatEventDates } from "@/config/disaster";
import { useSelectedEvent } from "@/hooks/useEvents";
import { useFilteredTabularData } from "@/hooks/useFilteredTabularData";
import { useAreaStore } from "@/store/area-store";
import { useAuthStore } from "@/store/auth-store";
import { useDateStore } from "@/store/date-store";
import { useLayerStore } from "@/store/layer-store";
import { getAttributes, getAttributeValueSum } from "@/utils/getAttributes";
import { displayDatasetName } from "@/utils/displayDatasetName";
import { useT } from "@/i18n";

/** A4 portrait with 12 mm margins leaves about 186 mm, roughly 700 CSS px, for content. */
const PAGE_WIDTH_PX = 700;
/** Tallest the map may be on the page, so the figures below it stay on page one. */
const MAP_MAX_HEIGHT_PX = 430;

export function printSituationReport() {
  const map = document.querySelector<HTMLElement>(".map-area");
  if (map) {
    // The map prints at the size it has on screen, scaled to the page; resizing it would
    // leave Leaflet with unloaded tiles
    const { width, height } = map.getBoundingClientRect();
    const scale = Math.min(1, PAGE_WIDTH_PX / width, MAP_MAX_HEIGHT_PX / height);
    const root = document.documentElement.style;
    root.setProperty("--report-map-width", `${Math.round(width)}px`);
    root.setProperty("--report-map-height", `${Math.round(height)}px`);
    root.setProperty("--report-map-scale", scale.toFixed(3));
  }
  window.print();
}

export function SituationReportButton() {
  const { t } = useT();
  return (
    <Button
      variant="outline"
      className="mt-2 w-full rounded-full"
      onClick={printSituationReport}
      title={t("report.help")}
    >
      <LuFileText className="size-4" />
      {t("report.button")}
    </Button>
  );
}

function useAreaLabel() {
  const { provinces, acList } = useAreaStore();
  const { t } = useT();
  if (acList.length > 0) return `${acList.join(", ")} (${provinces.join(", ")})`;
  if (provinces.length > 0) return provinces.join(", ");
  return t("impact.national");
}

/** Printed above the map. */
export function ReportHeader() {
  const { t, locale } = useT();
  const event = useSelectedEvent();
  const area = useAreaLabel();
  const year = useDateStore((s) => s.year);
  const user = useAuthStore((s) => s.user);
  const now = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short" }).format(
    new Date(),
  );
  const eventDates = event ? formatEventDates(event, locale) : "";

  return (
    <div className="report-block report-header">
      <div className="report-masthead">
        {SITE.crestUrl ? (
          <img src={SITE.crestUrl} alt="" className="report-crest" />
        ) : (
          <img src="/MISLogo.svg" alt="" className="report-crest" />
        )}
        <div>
          <p className="report-gov">{SITE.government}</p>
          {SITE.agency && <p className="report-agency">{SITE.agency}</p>}
          <p className="report-system">{t("app.title")}</p>
        </div>
      </div>
      <h1 className="report-title">
        {t("report.title")}
        {event ? `: ${event.name}` : ""}
      </h1>
      {event?.is_scenario && (
        <p className="report-scenario">
          <strong>{t("scenario.tag")}.</strong> {t("scenario.explain")}
        </p>
      )}
      <dl className="report-facts">
        <div>
          <dt>{t("picker.event")}</dt>
          <dd>
            {event
              ? [event.name, event.hazard_type_label, eventDates].filter(Boolean).join(" · ")
              : t("report.noEvent")}
          </dd>
        </div>
        <div>
          <dt>{t("report.area")}</dt>
          <dd>{area}</dd>
        </div>
        <div>
          <dt>{t("report.year")}</dt>
          <dd>{year}</dd>
        </div>
        <div>
          <dt>{t("report.generated")}</dt>
          <dd>
            {now}
            {user?.username ? ` ${t("report.by")} ${user.username}`.replace(/\s+/g, " ") : ""}
          </dd>
        </div>
      </dl>
    </div>
  );
}

/** Printed beneath the map. */
export function ReportBody() {
  const { t, locale } = useT();
  const { layers, getLayerMetadata } = useLayerStore();
  const rows = useFilteredTabularData();

  const layerIds = layers.split(",").filter(Boolean);
  const metadata = layerIds
    .map((id) => getLayerMetadata(id))
    .filter((d): d is NonNullable<typeof d> => !!d);
  const table = metadata.find((d) => d.dataType === "tabular");
  const mapLayers = metadata.filter((d) => d.dataType !== "tabular");
  const sources = [...new Set(metadata.map((d) => d.source).filter(Boolean))] as string[];

  const figures = getAttributes(rows)
    .map((attribute) => ({ attribute, value: getAttributeValueSum(rows, attribute) }))
    .filter((f) => f.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="report-block report-body">
      <ImpactSummary className="report-impact" />

      {table && figures.length > 0 && (
        <section>
          <h2>
            {t("report.keyFigures")} · {displayDatasetName(table.name, table.cluster)}
          </h2>
          <table className="report-table">
            <tbody>
              {figures.map((f) => (
                <tr key={f.attribute}>
                  <th scope="row">{f.attribute.replace(/_/g, " ")}</th>
                  <td>{Math.round(f.value).toLocaleString(locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="report-meta">
        {mapLayers.length > 0 && (
          <p>
            <strong>{t("report.layers")}:</strong> {mapLayers.map((d) => d.name).join(", ")}
          </p>
        )}
        {sources.length > 0 && (
          <p>
            <strong>{t("report.sources")}:</strong> {sources.join("; ")}
          </p>
        )}
        <p className="report-disclaimer">{t("report.disclaimer")}</p>
      </section>
    </div>
  );
}
