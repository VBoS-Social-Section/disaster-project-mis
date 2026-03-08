import { startTransition } from "react";
import { Layers, MapPin, Table } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useLayerStore } from "@/store/layer-store";

type LayerSwitchProps = {
  title: string;
  id: number;
  dataType: "raster" | "vector" | "tabular" | "pmtiles";
};

const LayerSwitch = ({ title, id, dataType }: LayerSwitchProps) => {
  const { layers, switchLayer } = useLayerStore();
  const urlLayerId = `${dataType.slice(0, 1)}${id}`;
  const checked = layers.split(",").includes(urlLayerId);

  const Icon =
    dataType === "raster" || dataType === "pmtiles"
      ? Layers
      : dataType === "vector"
        ? MapPin
        : Table;

  return (
    <label className="flex cursor-pointer items-center gap-2">
      <Switch
        id={`layer-${urlLayerId}`}
        size="sm"
        checked={checked}
        onCheckedChange={() => startTransition(() => switchLayer(urlLayerId))}
      />
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon className="size-3.5 shrink-0 text-muted-foreground/70" />
        <span className="overflow-hidden text-ellipsis whitespace-pre font-normal">
          {title}
        </span>
      </div>
    </label>
  );
};

export { LayerSwitch };
