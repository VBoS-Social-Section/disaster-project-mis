import { useEffect, useMemo, startTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import useAreaCouncils from "@/hooks/useAreaCouncils";
import { useAreaStore } from "@/store/area-store";
import { featureCollection } from "@turf/helpers";

const PROVINCES = [
  "Malampa",
  "Penama",
  "Sanma",
  "Shefa",
  "Tafea",
  "Torba",
];

const AreaSelect = () => {
  const { ac, province, setAc, setAcGeoJSON, setProvince } = useAreaStore();
  const { data: areaCouncils, isPending: areaCouncilsIsLoading } =
    useAreaCouncils(province);

  const areaCouncilOptions = useMemo(
    () => areaCouncils?.features.map((i) => i.properties?.name as string) ?? [],
    [areaCouncils],
  );

  useEffect(() => {
    setAcGeoJSON(areaCouncils || featureCollection([]));
  }, [areaCouncils, setAcGeoJSON]);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Administrative Area
      </h3>
      <div className="space-y-2">
        <Label>Province</Label>
        <Select
          value={province || ""}
          onValueChange={(v) => startTransition(() => setProvince(v || ""))}
        >
          <SelectTrigger className="glass-select-trigger w-full">
            <SelectValue placeholder="Select a province" />
          </SelectTrigger>
          <SelectContent>
            {PROVINCES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {province && (
        <div className="space-y-2 pt-2">
          <Label>Area Council</Label>
          {areaCouncilsIsLoading ? (
            <div className="space-y-2" role="status" aria-label="Loading area councils">
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <Select
              value={ac || ""}
              onValueChange={(v) => startTransition(() => setAc(v || ""))}
            >
              <SelectTrigger className="glass-select-trigger w-full">
                <SelectValue placeholder="Select an area council" />
              </SelectTrigger>
              <SelectContent>
                {areaCouncilOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
};

export { AreaSelect };
