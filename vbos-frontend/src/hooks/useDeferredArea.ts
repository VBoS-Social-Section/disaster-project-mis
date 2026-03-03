/**
 * Returns deferred province and ac so heavy consumers (charts, map) don't block
 * the select UI. The AreaSelect updates immediately; charts/map update in a
 * lower-priority render.
 */
import { useDeferredValue } from "react";
import { useAreaStore } from "@/store/area-store";

export function useDeferredArea() {
  const province = useAreaStore((s) => s.province);
  const ac = useAreaStore((s) => s.ac);
  const deferredProvince = useDeferredValue(province);
  const deferredAc = useDeferredValue(ac);
  return { province: deferredProvince, ac: deferredAc };
}
