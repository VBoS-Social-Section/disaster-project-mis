/**
 * Year → Event picker in the header. This is the dashboard's starting point: choose a
 * year, then one of that year's disasters (or a scenario). The event's hazard footprint
 * goes on the map and its damage, response and financial figures become available under
 * each sector. "No event" shows baseline data only.
 */
import { startTransition, useEffect, useMemo, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { useDateStore } from "@/store/date-store";
import { useEventStore } from "@/store/event-store";
import { useLayerStore } from "@/store/layer-store";
import { useEvents, useSelectEvent, useSelectedEvent } from "@/hooks/useEvents";
import { HAZARD_ICONS, formatEventDates } from "@/config/disaster";
import type { DisasterEvent } from "@/types/api";

const MIN_YEAR = 2004;
const MAX_YEAR = new Date().getFullYear();
const NO_EVENT = "none";

function EventOption({ event }: { event: DisasterEvent }) {
  const Icon = HAZARD_ICONS[event.hazard_type];
  const dates = formatEventDates(event);
  return (
    <SelectItem value={String(event.id)}>
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{event.name}</span>
      {dates && <span className="text-xs text-muted-foreground">{dates}</span>}
    </SelectItem>
  );
}

export function EventPicker() {
  const { year, setYear } = useDateStore();
  const { data: events, isPending, error } = useEvents();
  const eventId = useEventStore((s) => s.eventId);
  const selected = useSelectedEvent();
  const selectEvent = useSelectEvent();

  const eventsThisYear = useMemo(
    () => (events ?? []).filter((e) => !e.is_scenario && String(e.year) === year),
    [events, year],
  );
  const scenarios = useMemo(() => (events ?? []).filter((e) => e.is_scenario), [events]);

  const years = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events ?? []) {
      if (e.is_scenario || e.year == null) continue;
      counts.set(String(e.year), (counts.get(String(e.year)) ?? 0) + 1);
    }
    const first = Math.min(MIN_YEAR, ...[...counts.keys()].map(Number));
    return Array.from({ length: MAX_YEAR - first + 1 }, (_, i) => {
      const y = String(MAX_YEAR - i);
      return { year: y, count: counts.get(y) ?? 0 };
    });
  }, [events]);

  // Reconcile what the URL (or a restored session) says with the events that exist. Runs
  // once per load of the event list.
  const reconciled = useRef(false);
  useEffect(() => {
    if (!events || reconciled.current) return;
    reconciled.current = true;
    const current = events.find((e) => e.id === eventId);
    if (eventId != null && !current) {
      // The link points at an event that no longer exists
      useEventStore.getState().setEventId(null);
      return;
    }
    if (current) {
      if (!current.is_scenario && current.year != null && String(current.year) !== year) {
        setYear(String(current.year));
      }
      return;
    }
    // Older links carry only the footprint layer: recognise the event it belongs to
    const active = new Set(useLayerStore.getState().layers.split(","));
    const owner = events.find((e) => e.layers.some((l) => active.has(l.id)));
    if (owner) useEventStore.getState().setEventId(owner.id);
  }, [events, eventId, year, setYear]);

  const handleYearChange = (next: string) => {
    startTransition(() => {
      setYear(next);
      // A dated event belongs to its year; scenarios carry over to any year
      if (selected && !selected.is_scenario && String(selected.year) !== next) {
        selectEvent(null);
      }
    });
  };

  const handleEventChange = (value: string) => {
    const next = value === NO_EVENT ? null : events?.find((e) => String(e.id) === value) ?? null;
    startTransition(() => selectEvent(next));
  };

  const SelectedIcon = selected ? HAZARD_ICONS[selected.hazard_type] : null;

  return (
    <div className="flex min-w-0 items-center gap-2" role="group" aria-label="Year and disaster event">
      <Select value={year} onValueChange={handleYearChange}>
        <SelectTrigger size="sm" className="shrink-0 bg-background/60" aria-label="Year" title="Year">
          <span className="hidden text-xs text-muted-foreground sm:inline">Year</span>
          {/* Plain text rather than SelectValue, which would repeat the event-count badge */}
          <span>{year}</span>
        </SelectTrigger>
        {/* popper: the default item-aligned placement needs a SelectValue in the trigger
            to measure against, and silently never shows the list without one */}
        <SelectContent position="popper" align="start">
          {years.map(({ year: y, count }) => (
            <SelectItem key={y} value={y} textValue={y}>
              {y}
              {count > 0 && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  {count} {count === 1 ? "event" : "events"}
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={selected ? String(selected.id) : NO_EVENT}
        onValueChange={handleEventChange}
        disabled={isPending || !!error}
      >
        <SelectTrigger
          size="sm"
          className="min-w-0 max-w-[11rem] bg-background/60 sm:max-w-[18rem]"
          aria-label="Disaster event"
          title={error ? "Could not load disaster events" : "Disaster event"}
        >
          <span className="hidden text-xs text-muted-foreground sm:inline">Event</span>
          {/* The trigger shows a compact label; the list items carry dates as well */}
          <span className="flex min-w-0 items-center gap-1.5">
            {SelectedIcon && <SelectedIcon className="size-4 shrink-0 !text-foreground" />}
            <span className="truncate">
              {isPending ? "Loading…" : selected ? selected.name : "No event (baseline)"}
            </span>
          </span>
        </SelectTrigger>
        <SelectContent position="popper" align="start" className="max-w-[min(24rem,calc(100vw-2rem))]">
          <SelectItem value={NO_EVENT}>No event (baseline)</SelectItem>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Events in {year}</SelectLabel>
            {eventsThisYear.length === 0 ? (
              <p className="px-2 py-1.5 text-sm text-muted-foreground">
                No events recorded for {year}.
              </p>
            ) : (
              eventsThisYear.map((e) => <EventOption key={e.id} event={e} />)
            )}
          </SelectGroup>
          {scenarios.length > 0 && (
            <>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Scenarios</SelectLabel>
                {scenarios.map((e) => (
                  <EventOption key={e.id} event={e} />
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
