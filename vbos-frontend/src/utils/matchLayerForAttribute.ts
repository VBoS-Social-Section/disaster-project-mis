/**
 * Links a tabular metric (e.g. "primary_students") to the map layer that shows the same
 * thing (e.g. "Primary Schools"), so a metric card can switch its layer on and off.
 *
 * Matching is deliberately strict: every distinctive word in the layer name must appear in
 * the attribute, and exactly one layer may match. Otherwise no link is offered.
 */
import type { Dataset } from "@/types/api";

/** Words that describe the unit or the count rather than the subject. */
const GENERIC_WORDS = new Set([
  "total", "number", "no", "count", "all", "of", "the", "and", "in", "with", "per", "by",
  "student", "students", "school", "schools", "facility", "facilities",
  "household", "households", "people", "population", "site", "sites", "location", "locations",
]);

function distinctiveWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !GENERIC_WORDS.has(w));
}

export function findLayerForAttribute(
  attribute: string,
  mapLayers: Dataset[],
): Dataset | undefined {
  const attributeWords = new Set(distinctiveWords(attribute));
  if (attributeWords.size === 0) return undefined;
  const matches = mapLayers.filter((d) => {
    const words = distinctiveWords(d.name);
    return words.length > 0 && words.every((w) => attributeWords.has(w));
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
