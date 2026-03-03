/**
 * SVG icon definitions for vector point layers.
 * Each icon is a 24x24 viewBox SVG, designed to be colored via fill/stroke.
 */

const SIZE = 24;

const stroke =
  'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/** SVG path data for each icon type. Paths from Lucide (lucide.dev). */
export const VECTOR_ICON_PATHS: Record<string, string> = {
  circle: '<circle cx="12" cy="12" r="6" fill="currentColor"/>',
  graduationCap:
    `<path d="M22 10v6M2 10l10-5.5L22 10l-10 5.5L2 10z" ${stroke}/>` +
    `<path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" ${stroke}/>`,
  cross: `<path d="M12 5v14M5 12h14" ${stroke}/>`,
  mapPin:
    `<path d="M18 8c0 4.5-6 12-6 12s-6-7.5-6-12a6 6 0 0 1 12 0Z" ${stroke}/>` +
    '<circle cx="12" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>',
  building:
    `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" ${stroke}/>` +
    '<path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 8h.01M10 8h.01M14 8h.01M18 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  square: '<rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor"/>',
  triangle:
    '<path d="M12 4 4 20h16L12 4z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
  star:
    '<path d="m12 2 3 7 7 1-5 5 1.5 7L12 17l-6.5 3.5L8 15l-5-5 7-1 3-7z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
  // Lucide icons
  droplet: `<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" ${stroke}/>`,
  school:
    `<path d="M14 21v-3a2 2 0 0 0-4 0v3" ${stroke}/>` +
    `<path d="M18 5v16" ${stroke}/>` +
    `<path d="m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6" ${stroke}/>` +
    `<path d="m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11" ${stroke}/>` +
    `<path d="M6 5v16" ${stroke}/>` +
    '<circle cx="12" cy="9" r="2" fill="none" stroke="currentColor" stroke-width="2"/>',
  hospital:
    `<path d="M12 7v4" ${stroke}/>` +
    `<path d="M14 21v-3a2 2 0 0 0-4 0v3" ${stroke}/>` +
    `<path d="M14 9h-4" ${stroke}/>` +
    `<path d="M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" ${stroke}/>` +
    `<path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16" ${stroke}/>`,
  heart: `<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" ${stroke}/>`,
  bookOpen:
    `<path d="M12 7v14" ${stroke}/>` +
    `<path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" ${stroke}/>`,
  tent:
    `<path d="M3.5 21 14 3" ${stroke}/>` +
    `<path d="M20.5 21 10 3" ${stroke}/>` +
    `<path d="M15.5 21 12 15l-3.5 6" ${stroke}/>` +
    `<path d="M2 21h20" ${stroke}/>`,
  treePine:
    `<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z" ${stroke}/>` +
    `<path d="M12 22v-3" ${stroke}/>`,
  factory:
    `<path d="M12 16h.01" ${stroke}/>` +
    `<path d="M16 16h.01" ${stroke}/>` +
    `<path d="M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" ${stroke}/>` +
    `<path d="M8 16h.01" ${stroke}/>`,
  landmark:
    `<path d="M10 18v-7" ${stroke}/>` +
    `<path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" ${stroke}/>` +
    `<path d="M14 18v-7" ${stroke}/>` +
    `<path d="M18 18v-7" ${stroke}/>` +
    `<path d="M3 22h18" ${stroke}/>` +
    `<path d="M6 18v-7" ${stroke}/>`,
};

/** Icon keys in order - used for index-based assignment */
export const VECTOR_ICON_KEYS = [
  "graduationCap",
  "cross",
  "mapPin",
  "droplet",
  "school",
  "hospital",
  "heart",
  "bookOpen",
  "building",
  "tent",
  "treePine",
  "factory",
  "landmark",
  "square",
  "triangle",
  "star",
  "circle",
] as const;

export type VectorIconKey = (typeof VECTOR_ICON_KEYS)[number];

/** Humanitarian cluster -> icon (Lucide key or Flaticon class) */
const CLUSTER_ICON_MAP: Record<string, VectorIconKey | string> = {
  education: "graduationCap",
  health: "cross",
  wash: "droplet",
  emergency: "fi-sr-broadcast-tower",
  energy: "fi-sr-bolt",
  food: "fi-sr-utensils",
  gender: "fi-sr-users",
  logistics: "fi-sr-truck-moving",
  shelter: "fi-sr-shield",
  business: "fi-sr-briefcase",
};

/** Flaticon icon format (fi-sr-*, fi-rr-*, etc.) */
const FLATICON_PREFIX = "fi-";

/** Get icon key from dataset icon, cluster name, or fallback to index */
export function getVectorIconKey(
  index: number,
  cluster?: string | null,
  datasetIcon?: string | null,
): VectorIconKey | string {
  if (datasetIcon) {
    if (datasetIcon.startsWith(FLATICON_PREFIX)) {
      return datasetIcon;
    }
    if ((VECTOR_ICON_KEYS as readonly string[]).includes(datasetIcon)) {
      return datasetIcon as VectorIconKey;
    }
  }
  if (cluster) {
    const key = CLUSTER_ICON_MAP[cluster.toLowerCase().trim()];
    if (key) return key;
  }
  return VECTOR_ICON_KEYS[index % VECTOR_ICON_KEYS.length];
}

/** Build SVG or Flaticon HTML for legend display (React dangerouslySetInnerHTML) */
export function buildVectorIconSvg(
  color: string,
  iconKey: VectorIconKey | string,
  size = 16,
): string {
  if (typeof iconKey === "string" && iconKey.startsWith(FLATICON_PREFIX)) {
    return `<i class="fi ${iconKey}" style="color:${color};font-size:${size}px;display:inline-block;width:${size}px;height:${size}px;line-height:${size}px;text-align:center"></i>`;
  }
  const path = VECTOR_ICON_PATHS[iconKey as VectorIconKey] ?? VECTOR_ICON_PATHS.circle;
  const coloredPath = path.replace(/currentColor/g, color);
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${coloredPath}</svg>`;
}

/** Build Leaflet DivIcon HTML for a vector point marker */
export function buildVectorMarkerIcon(
  color: string,
  iconKey: VectorIconKey | string,
  opacity: number,
): string {
  if (typeof iconKey === "string" && iconKey.startsWith(FLATICON_PREFIX)) {
    return `<div class="vector-marker-icon" style="width:${SIZE}px;height:${SIZE}px;display:flex;align-items:center;justify-content:center;opacity:${opacity}"><i class="fi ${iconKey}" style="color:${color};font-size:${SIZE}px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))"></i></div>`;
  }
  const path = VECTOR_ICON_PATHS[iconKey as VectorIconKey] ?? VECTOR_ICON_PATHS.circle;
  const coloredPath = path.replace(/currentColor/g, color);
  return `<div class="vector-marker-icon" style="width:${SIZE}px;height:${SIZE}px;display:flex;align-items:center;justify-content:center;opacity:${opacity}"><svg viewBox="0 0 24 24" width="${SIZE}" height="${SIZE}" style="filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">${coloredPath}</svg></div>`;
}
