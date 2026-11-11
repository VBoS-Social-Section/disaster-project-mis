import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import API from "@/api";
import type { Dataset, DisasterEvent } from "@/types/api";
import { useEventStore } from "@/store/event-store";
import { useLayerStore } from "@/store/layer-store";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => API.getEvents(),
    staleTime: 5 * 60 * 1000,
  });
}

/** The selected event, or null when none is selected (or the list has not loaded yet). */
export function useSelectedEvent(): DisasterEvent | null {
  const eventId = useEventStore((s) => s.eventId);
  const { data } = useEvents();
  return useMemo(
    () => data?.find((e) => e.id === eventId) ?? null,
    [data, eventId],
  );
}

/**
 * Data tied to an event (its damage, response and financial tables) is only offered while
 * that event is selected. Data with no event is baseline and always offered.
 */
export function isDatasetInEvent(dataset: Pick<Dataset, "event">, eventId: number | null) {
  return dataset.event == null || dataset.event === eventId;
}

/**
 * Switch the dashboard to another event (or to none): the previous event's footprint
 * layers come off the map and the new event's go on. The previous event's table is
 * replaced by TabularDatasetSelect, which knows what else the sector offers.
 */
export function useSelectEvent() {
  const { data: events } = useEvents();

  return useCallback(
    (next: DisasterEvent | null) => {
      const { eventId: prevId, setEventId } = useEventStore.getState();
      if ((next?.id ?? null) === prevId) return;
      const { layers, setLayers } = useLayerStore.getState();
      const prev = events?.find((e) => e.id === prevId);
      const prevLayerIds = new Set(prev?.layers.map((l) => l.id));
      const kept = layers
        .split(",")
        .filter(Boolean)
        .filter((id) => !prevLayerIds.has(id));
      const added = (next?.layers ?? []).map((l) => l.id).filter((id) => !kept.includes(id));

      setEventId(next?.id ?? null);
      setLayers([...kept, ...added].join());
    },
    [events],
  );
}
