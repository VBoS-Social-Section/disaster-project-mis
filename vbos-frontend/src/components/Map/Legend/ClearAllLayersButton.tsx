import { startTransition, useState } from "react";
import { LuTrash2 } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLayerStore } from "@/store/layer-store";
import { useT } from "@/i18n";

/** Removes every layer from the map, after confirmation. Lives in the legend header. */
export function ClearAllLayersButton() {
  const { t } = useT();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { layers, setLayers, setTabularLayerData } = useLayerStore();
  const count = layers ? layers.split(",").filter(Boolean).length : 0;

  const handleClearAll = () => {
    setConfirmOpen(false);
    startTransition(() => {
      setTabularLayerData([]);
      setLayers("");
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon-xs"
        className="shrink-0 text-muted-foreground hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
        aria-label={t("legend.clearAll")}
        title={t("legend.clearAll")}
      >
        <LuTrash2 className="size-3.5" />
      </Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent showCloseButton={true} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove all datasets?</DialogTitle>
            <DialogDescription>
              This will clear all {count} selected dataset{count === 1 ? "" : "s"} from the
              map. You can add them back from the Data Layers panel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearAll}>
              Remove all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
