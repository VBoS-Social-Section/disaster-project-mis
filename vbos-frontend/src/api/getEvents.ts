import * as HTTP from "./http";
import type { DisasterEvent } from "@/types/api";

export function getEvents(): Promise<DisasterEvent[]> {
  return HTTP.get("/api/v1/events/").then(async (r) => {
    if (!r.ok) throw new Error("Unable to get disaster events.");
    return r.json();
  });
}
