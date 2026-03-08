/**
 * Returns tabular data filtered by year, province, area council, and attribute.
 * Use this for Stats, KPIs, and charts to respect area and attribute filters.
 */
import { useMemo } from "react";
import type { TabularData } from "@/types/api";
import { useAreaStore } from "@/store/area-store";
import { useDateStore } from "@/store/date-store";
import { useLayerStore } from "@/store/layer-store";

function applyTabularFilters(
  data: TabularData[],
  year: string,
  province: string,
  ac: string,
  attributeFilter: string | null,
): TabularData[] {
  let result = data.filter((i) => i.date.startsWith(year));

  if (ac) {
    result = result.filter(
      (i) => i.area_council?.toLowerCase() === ac.toLowerCase(),
    );
  } else if (province) {
    result = result.filter(
      (i) => i.province?.toLowerCase() === province.toLowerCase(),
    );
  }

  if (attributeFilter) {
    const key = attributeFilter.toLowerCase();
    result = result.filter((i) => {
      const attr = (i.attribute ?? "").toLowerCase();
      return attr === key || attr.includes(key);
    });
  }

  return result;
}

export function useFilteredTabularData(): TabularData[] {
  const { tabularLayerData, tabularAttributeFilter } = useLayerStore();
  const { province, ac } = useAreaStore();
  const { year } = useDateStore();

  return useMemo(
    () =>
      applyTabularFilters(
        tabularLayerData,
        year,
        province,
        ac,
        tabularAttributeFilter,
      ),
    [tabularLayerData, year, province, ac, tabularAttributeFilter],
  );
}

export { applyTabularFilters };
