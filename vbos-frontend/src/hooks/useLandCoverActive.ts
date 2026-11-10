/**
 * True while the land cover raster layer is switched on.
 * Land cover tools (class legend, totals chart, land accounts, year comparison)
 * appear on the single dashboard only while this is true.
 */
import { useLayerStore } from "@/store/layer-store";
import { useLandCoverRaster } from "./useLandCoverRaster";

export function useLandCoverActive(): { active: boolean; layerId: string | null } {
  const layers = useLayerStore((s) => s.layers);
  const landCover = useLandCoverRaster();
  const layerId = landCover?.layerId ?? null;
  const active = !!layerId && layers.split(",").includes(layerId);
  return { active, layerId };
}
