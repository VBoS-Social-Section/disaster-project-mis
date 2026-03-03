import { startTransition } from "react";
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

  return (
    <label className="flex cursor-pointer items-center gap-2">
      <Switch
        id={`layer-${urlLayerId}`}
        size="sm"
        checked={checked}
        onCheckedChange={() =>
          startTransition(() => switchLayer(urlLayerId))
        }
      />
      <span className="overflow-hidden text-ellipsis whitespace-pre font-normal">
        {title}
      </span>
    </label>
  );
};

export { LayerSwitch };
