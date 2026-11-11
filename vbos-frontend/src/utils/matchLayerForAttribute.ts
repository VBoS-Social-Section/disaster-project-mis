/**
 * Links a tabular metric (e.g. "primary_schools") to the map layer that shows the same
 * thing (e.g. "Primary Schools"), so a metric card can switch its layer on and off.
 *
 * Matching is deliberately strict: every word of the layer name must appear in the
 * attribute, and exactly one layer may match. "primary_students" is not linked to
 * "Primary Schools": the layer shows schools, not students.
 */
import type { Dataset } from "@/types/api";

const STOP_WORDS = new Set(["total", "number", "no", "count", "all", "of", "the", "and", "in"]);

/** Lower-case words, plurals folded ("Schools" and "school" compare equal). */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .map((w) => (w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w));
}

export function findLayerForAttribute(
  attribute: string,
  mapLayers: Dataset[],
): Dataset | undefined {
  const attributeWords = new Set(words(attribute));
  if (attributeWords.size === 0) return undefined;
  const matches = mapLayers.filter((d) => {
    const layerWords = words(d.name);
    return layerWords.length > 0 && layerWords.every((w) => attributeWords.has(w));
  });
  return matches.length === 1 ? matches[0] : undefined;
}

/**
 * If the dataset has a "total …" attribute, returns it together with a test for whether
 * another attribute is a part of that total (e.g. "primary_students" of "total_students").
 */
export function findTotalAttribute(attributes: string[]) {
  const total = attributes.find((a) => /^total([^a-z]|$)/i.test(a));
  if (!total) return null;
  const subject = total.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && w !== "total");
  return {
    attribute: total,
    isPartOfTotal: (attr: string) => {
      if (attr === total) return false;
      const words = attr.toLowerCase().split(/[^a-z0-9]+/);
      return subject.every((w) => words.includes(w));
    },
  };
}
