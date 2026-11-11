/**
 * Province → Area council picker in the header, next to Year → Event. Together they are
 * the dashboard's four global filters; keeping them in the top bar leaves the right panel
 * for results.
 */
import { startTransition, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { featureCollection } from "@turf/helpers";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useAreaCouncils from "@/hooks/useAreaCouncils";
import { useAreaStore } from "@/store/area-store";
import { PROVINCES } from "@/config/provinces";
import { useT } from "@/i18n";
import { cn } from "@/lib/utils";

const TRIGGER =
  "flex h-8 min-w-0 items-center gap-2 rounded-md border border-input bg-background/60 px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export function AreaPicker() {
  const { t } = useT();
  const { provinces, acList, setProvinces, setAcList, setAcGeoJSON } = useAreaStore();
  const { data: areaCouncils, isPending: councilsLoading } = useAreaCouncils(provinces);

  const councilOptions = useMemo(
    () => areaCouncils?.features.map((i) => i.properties?.name as string) ?? [],
    [areaCouncils],
  );

  // Keeps the map's area council outlines in step with the selection. Lives here because
  // the header is always mounted, whereas the side panels can be collapsed.
  useEffect(() => {
    if (!areaCouncils) {
      setAcGeoJSON(featureCollection([]));
      return;
    }
    if (acList.length === 0) {
      setAcGeoJSON(areaCouncils);
    } else {
      setAcGeoJSON({
        ...areaCouncils,
        features: areaCouncils.features.filter((f) =>
          acList.includes((f.properties?.name as string) ?? ""),
        ),
      });
    }
  }, [areaCouncils, acList, setAcGeoJSON]);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((x) => x !== value) : [...list, value];

  const provinceLabel =
    provinces.length === 0
      ? t("area.allProvinces")
      : provinces.length <= 2
        ? provinces.join(", ")
        : t("area.nProvinces", { n: provinces.length });

  const councilLabel =
    provinces.length > 0 && councilsLoading
      ? t("picker.loading")
      : acList.length === 0
        ? t("area.allCouncils")
        : acList.length <= 2
          ? acList.join(", ")
          : t("area.nCouncils", { n: acList.length });

  return (
    <div className="flex min-w-0 items-center gap-2" role="group" aria-label={t("area.groupLabel")}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(TRIGGER, "max-w-[10rem] xl:max-w-[14rem]")}
          aria-label={`${t("area.province")}: ${provinceLabel}`}
          title={t("area.province")}
        >
          <span className="hidden text-xs text-muted-foreground xl:inline">{t("area.province")}</span>
          <span className="truncate">{provinceLabel}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 min-w-[12rem]">
          <DropdownMenuItem
            disabled={provinces.length === 0}
            onSelect={() => startTransition(() => setProvinces([]))}
          >
            {t("area.allProvinces")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {PROVINCES.map((p) => (
            <DropdownMenuCheckboxItem
              key={p}
              checked={provinces.includes(p)}
              onCheckedChange={() => startTransition(() => setProvinces(toggle(provinces, p)))}
              // Stay open so several provinces can be ticked in one go
              onSelect={(e) => e.preventDefault()}
            >
              {p}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(TRIGGER, "max-w-[10rem] xl:max-w-[15rem]")}
          // Area councils belong to a province, so one has to be chosen first
          disabled={provinces.length === 0 || councilsLoading}
          aria-label={`${t("area.council")}: ${councilLabel}`}
          title={provinces.length === 0 ? t("area.chooseProvinceFirst") : t("area.council")}
        >
          <span className="hidden text-xs text-muted-foreground xl:inline">{t("area.council")}</span>
          <span className="truncate">{councilLabel}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 min-w-[13rem]">
          <DropdownMenuItem
            disabled={acList.length === 0}
            onSelect={() => startTransition(() => setAcList([]))}
          >
            {t("area.allCouncils")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {councilOptions.map((name) => (
            <DropdownMenuCheckboxItem
              key={name}
              checked={acList.includes(name)}
              onCheckedChange={() => startTransition(() => setAcList(toggle(acList, name)))}
              onSelect={(e) => e.preventDefault()}
            >
              {name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
