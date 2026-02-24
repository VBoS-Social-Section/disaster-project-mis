import { Box, Grid, Spinner } from "@chakra-ui/react";
import { Header } from "./components/Header";
import { MapRef } from "react-map-gl/maplibre";
import { useRef, lazy, Suspense } from "react";
import { useUrlSync } from "./hooks/useUrlSync";
import { useAuth } from "./hooks/useAuth";
import { LeftSidebar } from "./components/LeftSidebar";
import { RightSidebar } from "./components/RightSidebar";
import BottomDrawer from "./components/BottomDrawer";
import { Login } from "./components/Login";

// Lazy-load Map (MapLibre, pmtiles, layers) for faster initial paint
const Map = lazy(() => import("./components/Map").then((m) => ({ default: m.default })));

function App() {
  const mapRef = useRef<MapRef>(null);
  const { isAuthenticated } = useAuth();
  useUrlSync();

  if (!isAuthenticated) {
    return <Login />;
  }
  return (
    <Grid h="100vh" maxH="100vh" templateRows="max-content 1fr">
      <Header />
      <Grid templateColumns="auto 1fr auto" height="calc(100vh - 3.75rem)">
        <Box>
          <LeftSidebar />
        </Box>
        <Box>
          <Box position="relative" h="100%" maxH="full" display="flex" flexDir="column">
            <Suspense
              fallback={
                <Box
                  flex={1}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="gray.50"
                >
                  <Spinner size="xl" />
                </Box>
              }
            >
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
