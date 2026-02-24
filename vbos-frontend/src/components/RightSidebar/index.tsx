import { Sidebar } from "../Sidebar";
import { Accordion, Box, Button } from "@chakra-ui/react";
import { AreaSelect } from "./AreaSelect";
import { SidebarSectionHeading } from "../SidebarSectionHeading";
import { LuDownload } from "react-icons/lu";
import { DateSelect } from "./DateSelect";
import { Stats } from "./Stats";
import { DownloadDataDialog } from "./DownloadDataDialog";
import { useState } from "react";
import { useLayerStore } from "@/store/layer-store";

const RightSidebar = () => {
  const [downloadDialogIsOpen, setDownloadDialogIsOpen] = useState(false);
  const { layers } = useLayerStore();

  // Check if there are any active layers
  const hasActiveLayers = layers.length > 0;

  const handleDownload = () => {
    setDownloadDialogIsOpen(true);
  };

  return (
    <Sidebar direction="right" title="Analysis">
      <Box
        px={6}
        py={2}
        borderBottom="1px solid"
        borderColor="border.emphasized"
      >
        <AreaSelect />
      </Box>
      <Box flex="1" overflow="scroll">
        <Accordion.Root multiple defaultValue={["0"]}>
          <Accordion.Item value="0">
            <Accordion.ItemTrigger
              cursor="pointer"
              px={6}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <SidebarSectionHeading>Selected Indicators</SidebarSectionHeading>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody px={6}>
                <DateSelect />
                <Stats />
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </Box>
      <Box
        borderTop="1px solid"
        borderColor="border.emphasized"
        px={6}
        py={2}
        mt="auto"
        position="sticky"
        bottom="0"
        bg="bg"
      >
        <Button
          w="full"
          colorPalette="blue"
          variant="outline"
          onClick={handleDownload}
          disabled={!hasActiveLayers}
        >
          <LuDownload />
          Download Data
        </Button>
      </Box>
      <DownloadDataDialog
        isOpen={downloadDialogIsOpen}
        setIsOpen={setDownloadDialogIsOpen}
      />
    </Sidebar>
  );
};

export { RightSidebar };
