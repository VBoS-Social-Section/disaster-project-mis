import { Header } from "./components/Header";
import { ErrorBoundary } from "./components/ErrorBoundary";
import type { MapRef } from "./components/Map";
import { useRef, lazy, Suspense } from "react";
import { LuRefreshCw } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { useUrlSync } from "./hooks/useUrlSync";
import { useSmartDefaults } from "./hooks/useSmartDefaults";
import { useSessionSave } from "./hooks/useSessionSave";
import { usePrefetchLayerMetadata } from "./hooks/usePrefetchLayerMetadata";
import { useClimateModeEffect } from "./hooks/useClimateModeEffect";
import { useAuth } from "./hooks/useAuth";
import { useAutoLock } from "./hooks/useAutoLock";
import { useUiStore } from "@/store/ui-store";
import { useLockStore } from "@/store/lock-store";
import { useViewStore } from "@/store/view-store";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { LeftSidebar } from "./components/LeftSidebar";
import { RightSidebar } from "./components/RightSidebar";
import { TabularLayers } from "./components/Map/TabularLayer";
import { MapEmptyState } from "./components/MapEmptyState";
import { MapBottomPanel } from "./components/Map/MapBottomPanel";
import { MapCursorRing } from "./components/Map/MapCursorRing";
import { MapModeBadge } from "./components/Map/MapModeBadge";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { LayerAnnouncer } from "./components/LayerAnnouncer";
import { LockScreen } from "./components/LockScreen";
import { Login } from "./components/Login";

// Lazy-load Map (Leaflet, layers) for faster initial paint
const Map = lazy(() => import("./components/Map").then((m) => ({ default: m.default })));

// Lazy-load overlay components – only fetched when their mode is active
const ClimateKpiCards = lazy(() =>
  import("./components/ClimateKpiCards").then((m) => ({ default: m.default })),
);
const FloatingTimeSeries = lazy(() =>
  import("./components/FloatingTimeSeries").then((m) => ({ default: m.default })),
);

function MapLoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-muted p-4">
      <div className="h-full w-full animate-pulse rounded-md bg-muted-foreground/20" />
    </div>
  );
}

function SidebarErrorFallback({
  error,
  retry,
  title,
  side,
}: {
  error: Error;
  retry: () => void;
  title: string;
  side: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex h-full min-w-[18rem] flex-col items-center justify-center gap-3 border-border bg-card p-4 text-center",
        side === "left" ? "md:border-r" : "md:border-l",
      )}
    >
      <p className="text-sm font-medium text-destructive">{title}</p>
      <p className="text-xs text-muted-foreground">{error.message}</p>
      <button
        type="button"
        onClick={retry}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
      >
        <LuRefreshCw className="size-3.5" />
        Try again
      </button>
    </div>
  );
}

function MapErrorFallback(error: Error, retry: () => void) {
  return (
    <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center">
      <p className="text-sm font-medium text-destructive">Map failed to load</p>
      <p className="max-w-sm text-xs text-muted-foreground">{error.message}</p>
      <button
        type="button"
        onClick={retry}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
      >
        <LuRefreshCw className="size-4" />
        Try again
      </button>
    </div>
  );
}

function App() {
  const mapRef = useRef<MapRef>(null);
  const { isAuthenticated } = useAuth();
  const { isMobile, mobileOpenPanel, setMobileOpenPanel } = useUiStore();
  const { isLocked } = useLockStore();
  const scenarioId = useViewStore((s) => s.scenarioId);
  const isTimeSeriesOpen = useUiStore((s) => s.isTimeSeriesOpen);
  useUrlSync();
  useSmartDefaults();
  useSessionSave();
  usePrefetchLayerMetadata();
  useClimateModeEffect();
  useKeyboardShortcuts();
  useAutoLock();

  if (!isAuthenticated) {
    return <Login />;
  }
  return (
    <div className="grid h-screen max-h-screen min-w-0 grid-rows-[max-content_1fr] overflow-hidden bg-background">
      {isLocked && <LockScreen />}
      <OfflineIndicator />
      <LayerAnnouncer />
      <Header />
      <div
        id="main"
        className="grid h-[calc(100vh-3.5rem)] min-w-0 overflow-hidden md:grid-rows-1 grid-rows-[auto_1fr_auto] md:grid-cols-[auto_1fr_28rem]"
      >
        <div className="min-h-0">
          <ErrorBoundary
            fallbackRender={(error, retry) => (
              <SidebarErrorFallback
                error={error}
                retry={retry}
                title="Data layers failed"
                side="left"
              />
            )}
          >
            <LeftSidebar />
          </ErrorBoundary>
        </div>
        <div
          className="relative map-area min-w-0 min-h-0 overflow-hidden"
          onClick={() => {
            if (isMobile && mobileOpenPanel) setMobileOpenPanel(null);
          }}
        >
          <ErrorBoundary fallbackRender={MapErrorFallback}>
            <div className="relative flex h-full min-h-0 flex-col">
              <MapCursorRing />
              <TabularLayers />
              <Suspense fallback={<MapLoadingSkeleton />}>
                <Map ref={mapRef} />
              </Suspense>
              {scenarioId === "climate" && <MapBottomPanel />}
              <MapEmptyState />
              <MapModeBadge />
              {scenarioId === "climate" && (
                <Suspense fallback={null}>
                  <ClimateKpiCards />
                </Suspense>
              )}
              {isTimeSeriesOpen && (
                <Suspense fallback={null}>
                  <FloatingTimeSeries />
                </Suspense>
              )}
            </div>
          </ErrorBoundary>
        </div>
        <div className="min-h-0">
          <ErrorBoundary
            fallbackRender={(error, retry) => (
              <SidebarErrorFallback
                error={error}
                retry={retry}
                title="Context panel failed"
                side="right"
              />
            )}
          >
            <RightSidebar />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}

export default App;
