/** Province names as shown in the UI and stored in the area filter. */
export const PROVINCES = [
  "Malampa",
  "Penama",
  "Sanma",
  "Shefa",
  "Tafea",
  "Torba",
] as const;

/** Map a name from boundary data (e.g. "SANMA") to its UI spelling, if it is a province. */
export function toProvinceName(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const lower = raw.trim().toLowerCase();
  return PROVINCES.find((p) => p.toLowerCase() === lower);
}
