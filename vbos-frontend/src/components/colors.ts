import { LAND_COVER_TYPES } from "@/data/landCoverData";

/** Distinct colors for vector point layers when multiple are active */
export const VECTOR_LAYER_COLORS = [
  "#3d4aff", /* blue */
  "#10b981", /* emerald */
  "#f09000", /* orange */
  "#8b5cf6", /* violet */
  "#e34a33", /* red */
  "#06b6d4", /* cyan */
  "#6366f1", /* indigo */
  "#14b8a6", /* teal */
];

/** Semantic mapping: cluster name (lowercase) -> color. Education=blue, Health=emerald. */
export const VECTOR_CLUSTER_COLORS: Record<string, string> = {
  education: "#3d4aff",
  health: "#10b981",
};

const mapColors = {
  blueLight: "#22d3ee",
  blue: "#3d4aff",
  purple: "#8b5cf6",
  orange: "#f09000",
  red: "#e34a33",
  /** Choropleth: low (cyan) -> high (purple/red) */
  choroplethLow: "#06b6d4",
  choroplethMid: "#10b981",
  choroplethHigh: "#8b5cf6",
  choroplethMax: "#e34a33",
};

/** Theme-aware map colors: province border, area council border, choropleth */
export const MAP_COLORS = {
  light: {
    provinceBorder: "#0891b2",
    areaCouncilBorder: "#dc2626",
    choroplethLow: "#06b6d4",
    choroplethMid: "#10b981",
    choroplethHigh: "#8b5cf6",
    choroplethMax: "#dc2626",
    deltaNeg: "#dc2626",
    deltaZero: "#64748b",
    deltaPos: "#16a34a",
  },
  dark: {
    provinceBorder: "#22d3ee",
    areaCouncilBorder: "#f87171",
    choroplethLow: "#22d3ee",
    choroplethMid: "#34d399",
    choroplethHigh: "#a78bfa",
    choroplethMax: "#f87171",
    deltaNeg: "#f87171",
    deltaZero: "#94a3b8",
    deltaPos: "#4ade80",
  },
} as const;

export type MapPalette = (typeof MAP_COLORS)[keyof typeof MAP_COLORS];

/** Interpolate hex color between low and high based on t (0-1) */
function lerpHex(low: string, high: string, t: number): string {
  const parse = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [r1, g1, b1] = parse(low);
  const [r2, g2, b2] = parse(high);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Get choropleth fill color: low values -> cyan/emerald, high -> purple/red */
export function getChoroplethColor(t: number, palette?: MapPalette): string {
  const p = palette ?? MAP_COLORS.light;
  if (t <= 0) return p.choroplethLow;
  if (t >= 1) return p.choroplethMax;
  if (t < 0.5) {
    return lerpHex(p.choroplethLow, p.choroplethMid, t * 2);
  }
  return lerpHex(p.choroplethMid, p.choroplethMax, (t - 0.5) * 2);
}

/** Get delta heatmap color: t in [-1, 1] where -1 = max negative, 0 = no change, 1 = max positive */
export function getDeltaColor(t: number, palette?: MapPalette): string {
  const p = palette ?? MAP_COLORS.light;
  if (t <= -1) return p.deltaNeg;
  if (t >= 1) return p.deltaPos;
  if (t < 0) return lerpHex(p.deltaZero, p.deltaNeg, -t);
  return lerpHex(p.deltaZero, p.deltaPos, t);
}

/* Data viz: emerald/indigo/purple accent palette */
const chartColors = [
  "#10b981", /* emerald-500 */
  "#6366f1", /* indigo-500 */
  "#8b5cf6", /* violet-500 */
  "#06b6d4", /* cyan-500 */
  "#14b8a6", /* teal-500 */
  "#818cf8", /* indigo-400 */
  "#a78bfa", /* violet-400 */
  "#22d3ee", /* cyan-400 */
];

/** Softer palette for line charts (light blue, darker blue/purple like reference) */
export const lineChartColors = [
  "#38bdf8", /* sky-400 - light blue */
  "#6366f1", /* indigo-500 - darker blue */
  "#06b6d4", /* cyan-500 */
  "#8b5cf6", /* violet-500 */
  "#14b8a6", /* teal-500 */
  "#818cf8", /* indigo-400 */
];

/**
 * TiTiler colormap for categorical land cover raster (explicit value→color).
 * Use in titiler_url_params: colormap=JSON.stringify(LAND_COVER_COLORMAP)
 * Pixel values 1–9 map to the 9 classes (order matches LAND_COVER_TYPES).
 * Use getLandCoverColormap(hiddenClasses) to get a colormap with hidden classes as transparent.
 */
export const LAND_COVER_COLORMAP: Record<string, string> = {
  "1": "#42A5F5", // Water bodies
  "2": "#FFB300", // Coconut plantations
  "3": "#CDDC39", // Grassland
  "4": "#388E3C", // Mangrove
  "5": "#FBC02D", // Agriculture
  "6": "#A1887F", // Barelands
  "7": "#757575", // Builtup Infrastructure
  "8": "#2E7D32", // Dense Forest
  "9": "#66BB6A", // Open Forest
};

/** Transparent color for hidden land cover classes */
const LAND_COVER_TRANSPARENT = "#00000000";

/** Build colormap with hidden classes (by type name) rendered transparent */
export function getLandCoverColormap(hiddenClasses: Set<string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < LAND_COVER_TYPES.length; i++) {
    const pixel = String(i + 1);
    const typeName = LAND_COVER_TYPES[i];
    result[pixel] = hiddenClasses.has(typeName)
      ? LAND_COVER_TRANSPARENT
      : LAND_COVER_COLORMAP[pixel];
  }
  return result;
}

/** Land cover types: theme-aware palette (colorblind-safe) */
export const LAND_COVER_COLORS = {
  light: {
    "Dense Forest": "#2E7D32",
    "Open Forest": "#66BB6A",
    Mangrove: "#388E3C",
    Agriculture: "#FBC02D",
    "Coconut plantations": "#FFB300",
    Grassland: "#CDDC39",
    Barelands: "#A1887F",
    "Builtup Infrastructure": "#757575",
    "Water bodies": "#42A5F5",
    // Land Accounts 6-category scheme
    "Water Bodies": "#42A5F5",
    "Built Up": "#757575",
    Bareland: "#A1887F",
    Forest: "#2E7D32",
  } as Record<string, string>,
  dark: {
    "Dense Forest": "#66BB6A",
    "Open Forest": "#A5D6A7",
    Mangrove: "#81C784",
    Agriculture: "#FFF176",
    "Coconut plantations": "#FFE082",
    Grassland: "#E6EE9C",
    Barelands: "#BCAAA4",
    "Builtup Infrastructure": "#B0BEC5",
    "Water bodies": "#90CAF9",
    // Land Accounts 6-category scheme
    "Water Bodies": "#90CAF9",
    "Built Up": "#B0BEC5",
    Bareland: "#BCAAA4",
    Forest: "#66BB6A",
  } as Record<string, string>,
};

export { mapColors, chartColors };

/** Opaque tooltip style for Recharts – use var(--card) not hsl(var(--card)) since --card is hex */
export const chartTooltipContentStyle: Record<string, string | number> = {
  backgroundColor: "var(--card)",
  color: "var(--card-foreground)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  opacity: 1,
};

/** Wrapper must also have solid background – Recharts applies wrapperStyle to outer div */
export const chartTooltipWrapperStyle: Record<string, string | number> = {
  backgroundColor: "var(--card)",
  opacity: 1,
};
