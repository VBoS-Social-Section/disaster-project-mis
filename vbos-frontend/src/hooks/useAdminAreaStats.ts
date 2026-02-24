import { useAreaStore } from "@/store/area-store";
import { useDateStore } from "@/store/date-store";
import { useLayerStore } from "@/store/layer-store";
import { AreaCouncilGeoJSON, ProvincesGeoJSON } from "@/types/data";
import { getAreaCouncilValue, getProvinceValue } from "@/utils/getValue";
import { featureCollection } from "@turf/helpers";
import { useEffect, useState } from "react";

const useAdminAreaStats = (
  geojson: ProvincesGeoJSON | AreaCouncilGeoJSON = featureCollection([]),
) => {
  const { ac, province } = useAreaStore();
  const { tabularLayerData } = useLayerStore();
  const { year } = useDateStore();
  const [result, setResult] = useState<ProvincesGeoJSON | AreaCouncilGeoJSON>(
    featureCollection([]),
  );
  const [minValue, setMinValue] = useState<number>(0);
  const [maxValue, setMaxValue] = useState<number>(0);

  useEffect(() => {
    const filteredData = tabularLayerData.filter((i) =>
      i.date.startsWith(year),
    );

    if (!tabularLayerData) {
      setResult(featureCollection([]));
    }

    const updatedGeojson = {
      ...geojson,
      features: geojson.features.map((feature) => ({
        ...feature,
        properties: { ...feature.properties },
      })),
    };

    if (!province) {
      updatedGeojson.features.forEach(
        (p) =>
          (p.properties.value = getProvinceValue(
            filteredData,
            p.properties.name,
          )),
      );
    }
    if (province) {
      updatedGeojson.features.forEach(
        (c) =>
          (c.properties.value = getAreaCouncilValue(
            filteredData,
            c.properties.name,
          )),
      );
    }

    const values = updatedGeojson.features
      .map((i) => i.properties?.value)
      .filter((v): v is number => typeof v === "number" && isFinite(v));

    if (values.length === 0) {
      setMinValue(0);
      setMaxValue(0);
    } else {
      values.sort((a, b) => a - b);
      setMinValue(values[0]);
      setMaxValue(values[values.length - 1]);
    }

    setResult(updatedGeojson);
  }, [
    ac,
    province,
    tabularLayerData,
    year,
    setMaxValue,
    setMinValue,
    setResult,
    geojson,
  ]);

  return { geojson: result, maxValue, minValue };
};

export { useAdminAreaStats };
