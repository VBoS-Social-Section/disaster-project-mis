/**
 * Dataset names come from file names ("Education 01 baseline education"). For display,
 * drop the leading sector and sequence number and tidy the rest ("Baseline education").
 * Names that do not follow that pattern are returned unchanged.
 */
export function displayDatasetName(name: string | undefined | null, cluster?: string | null) {
  if (!name) return "";
  let text = name.replace(/_/g, " ").trim();
  if (cluster) {
    const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    // "GenderProtection 02 …" for the "Gender & Protection" sector: compare without spacing
    const match = text.match(/^(.+?)\s+(\d{1,2})\s+(.+)$/);
    if (match && compact(match[1]) === compact(cluster)) text = match[3];
  }
  text = text.replace(/^\d{1,2}\s+/, "");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
