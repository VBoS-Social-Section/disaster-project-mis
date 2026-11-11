import type { IconType } from "react-icons";
import {
  LuActivity,
  LuDroplets,
  LuFlame,
  LuFlameKindling,
  LuMountain,
  LuSun,
  LuWaves,
  LuWind,
} from "react-icons/lu";
import type { DisasterEvent, HazardType } from "@/types/api";

/**
 * Cyclone intensity categories and colors for map legend.
 * Matches RAP export: intensity_color in GeoJSON/PMTiles.
 */
export const CYCLONE_INTENSITY_LEGEND = [
  { label: "No intensity (0)", color: "#cccccc" },
  { label: "Category 2", color: "#fbbf24" },
  { label: "Category 3", color: "#f97316" },
  { label: "Category 4", color: "#dc2626" },
  { label: "Category 5", color: "#7f1d1d" },
] as const;

/** Parse intensity value to rank (0–5). Higher = stronger. */
export function parseIntensityRank(value: string | number): number {
  if (value === "" || value == null) return 0;
  const s = String(value).toLowerCase();
  const m = s.match(/(?:cat(?:egory)?\s*)?(\d)/);
  if (m) return Math.min(5, Math.max(0, parseInt(m[1], 10)));
  const n = parseInt(String(value), 10);
  if (!Number.isNaN(n)) return Math.min(5, Math.max(0, n));
  return 0;
}

/** Get highest intensity from rows. Returns { label, color } or null if none. */
export function getHighestIntensity(
  rows: { intensity: string | number; intensityColor?: string }[],
): { label: string; color: string } | null {
  if (!rows.length) return null;
  let best: { rank: number; label: string; color: string } | null = null;
  for (const r of rows) {
    const rank = parseIntensityRank(r.intensity);
    if (rank > 0 && (!best || rank > best.rank)) {
      const label =
        String(r.intensity).trim() ||
        CYCLONE_INTENSITY_LEGEND.find((l) => l.label.includes(String(rank)))?.label ||
        `Category ${rank}`;
      best = {
        rank,
        label,
        color: r.intensityColor || CYCLONE_INTENSITY_LEGEND.find((l) => l.label.includes(String(rank)))?.color || "#cccccc",
      };
    }
  }
  return best ? { label: best.label, color: best.color } : null;
}

/** Icon per hazard type, shared by the event picker and the event banner. */
export const HAZARD_ICONS: Record<HazardType, IconType> = {
  cyclone: LuWind,
  volcano: LuFlame,
  flood: LuDroplets,
  earthquake: LuActivity,
  tsunami: LuWaves,
  landslide: LuMountain,
  drought: LuSun,
  wildfire: LuFlameKindling,
};

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "24 Oct 2023" or "24 Oct 2023 – 26 Oct 2023"; empty for undated scenarios. */
export function formatEventDates(event: Pick<DisasterEvent, "start_date" | "end_date">): string {
  if (!event.start_date) return "";
  // Date-only strings: parse as local midnight so the day does not shift with the timezone
  const parse = (d: string) => new Date(`${d}T00:00:00`);
  const start = DAY.format(parse(event.start_date));
  if (!event.end_date || event.end_date === event.start_date) return start;
  return `${start} – ${DAY.format(parse(event.end_date))}`;
}

/**
 * Hazard layer names. Used to recognise a hazard footprint layer that has not been linked
 * to an event (layers linked to an event are recognised by that link).
 */
export const DISASTER_LAYER_NAMES = [
  "Cyclone Intensity",
  "Volcano",
  "Flood",
  "Earthquake",
  "Tsunami",
  "Landslide",
  "Drought",
  "Wildfire",
] as const;

export type DisasterLayerName = (typeof DISASTER_LAYER_NAMES)[number];
