/**
 * The selected disaster event and its hazard footprint layers. Sits above the sector list
 * and stays put while the user moves between sectors.
 */
import { LayerSwitch } from "./LayerSwitch";
import { useSelectedEvent } from "@/hooks/useEvents";
import { HAZARD_ICONS, formatEventDates } from "@/config/disaster";

const DATA_TYPE = { p: "pmtiles", v: "vector" } as const;

export function EventLayers() {
  const event = useSelectedEvent();
  if (!event) return null;

  const Icon = HAZARD_ICONS[event.hazard_type];
  const dates = formatEventDates(event);

  return (
    <section
      className="mb-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
      aria-label={`Selected event: ${event.name}`}
    >
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {event.is_scenario ? "Scenario" : "Event"}
          </p>
          <p className="truncate text-sm font-medium">{event.name}</p>
          <p className="text-xs text-muted-foreground">
            {[event.hazard_type_label, dates].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      {event.layers.length > 0 ? (
        <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
          {event.layers.map((layer) => {
            const dataType = DATA_TYPE[layer.id[0] as keyof typeof DATA_TYPE];
            if (!dataType) return null;
            return (
              <LayerSwitch
                key={layer.id}
                dataType={dataType}
                id={Number(layer.id.slice(1))}
                title={layer.name}
              />
            );
          })}
        </div>
      ) : (
        <p className="mt-2 border-t border-border pt-2 text-xs text-muted-foreground">
          No hazard footprint layer has been uploaded for this event.
        </p>
      )}
    </section>
  );
}
