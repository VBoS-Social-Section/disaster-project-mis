import { Box, Grid, Skeleton } from "@chakra-ui/react";
import { Header } from "./components/Header";
import { MapRef } from "react-map-gl/maplibre";
import { useRef, lazy, Suspense, useCallback } from "react";
import { useUrlSync } from "./hooks/useUrlSync";
import { useAuth } from "./hooks/useAuth";
import { useUiStore } from "@/store/ui-store";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { LeftSidebar } from "./components/LeftSidebar";
import { RightSidebar } from "./components/RightSidebar";
import BottomDrawer from "./components/BottomDrawer";
import { Login } from "./components/Login";
import { exportMapAndStatsToPdf } from "./utils/exportPdf";
import { toast } from "./utils/toast";

// Lazy-load Map (MapLibre, pmtiles, layers) for faster initial paint
const Map = lazy(() => import("./components/Map").then((m) => ({ default: m.default })));

function MapLoadingSkeleton() {
  return (
    <Box flex={1} display="flex" flexDir="column" bg="bg.subtle" p={4}>
      <Skeleton height="100%" borderRadius="md" />
    </Box>
  );
}

function App() {
  const mapRef = useRef<MapRef>(null);
  const { isAuthenticated } = useAuth();
  const { isMobile, mobileOpenPanel, setMobileOpenPanel } = useUiStore();
  useUrlSync();
  useKeyboardShortcuts();

  const handleExportPdf = useCallback(async () => {
    try {
      await exportMapAndStatsToPdf(mapRef.current);
      toast.success("PDF exported");
    } catch (e) {
      toast.error("Export failed", e instanceof Error ? e.message : "Could not export PDF");
    }
  }, []);

  if (!isAuthenticated) {
    return <Login />;
  }
  return (
    <Grid
      h="100vh"
      maxH="100vh"
      templateRows="max-content 1fr"
      overflow="hidden"
      minW="0"
    >
      <Header onExportPdf={handleExportPdf} />
      <Grid
        templateColumns={{ base: "0 1fr 0", md: "auto 1fr auto" }}
        height="calc(100vh - 3.75rem)"
        minW="0"
        overflow="hidden"
      >
        <Box>
          <LeftSidebar />
        </Box>
        <Box
          position="relative"
          onClick={() => {
            if (isMobile && mobileOpenPanel) setMobileOpenPanel(null);
          }}
        >
          <Box position="relative" h="100%" maxH="full" display="flex" flexDir="column">
            <Suspense fallback={<MapLoadingSkeleton />}>
              <Map ref={mapRef} />
            </Suspense>
            <BottomDrawer />
          </Box>
        </Box>
        <Box>
          <RightSidebar />
        </Box>
      </Grid>
    </Grid>
  );
}

export default App;
