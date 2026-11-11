import { create } from "zustand";

/**
 * The disaster event (or scenario) the dashboard is looking at. null = no event, baseline
 * data only. Kept in the URL as ?event=<id> so shared links reopen the same event.
 */
interface EventState {
  eventId: number | null;
  setEventId: (id: number | null) => void;
  syncFromUrl: () => void;
}

const PARAM = "event";

function readFromUrl(): number | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get(PARAM);
  const id = raw ? Number(raw) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}

export const useEventStore = create<EventState>((set) => ({
  eventId: readFromUrl(),

  setEventId: (id) => {
    set({ eventId: id });
    const params = new URLSearchParams(window.location.search);
    if (id) params.set(PARAM, String(id));
    else params.delete(PARAM);
    const rest = params.toString();
    window.history.replaceState(null, "", rest ? `?${rest}` : window.location.pathname);
  },

  syncFromUrl: () => set({ eventId: readFromUrl() }),
}));
