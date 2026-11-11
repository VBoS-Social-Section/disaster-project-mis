/**
 * One pill at the bottom centre of the screen with two jobs:
 *  - "Reload page" when a newer build has been deployed while this page was open;
 *  - "Install app" when the browser offers to install DRMIS on the device.
 * Reload wins when both apply. Both states use the same pill, so it never changes size.
 *
 * How a new build is noticed: the service worker takes control as soon as it is installed
 * (skipWaiting + clientsClaim), which fires "controllerchange" on every open page. The
 * page keeps running the old code until reloaded, so that is the moment to offer a reload.
 */
import { useEffect, useState } from "react";
import { LuDownload, LuRefreshCw, LuX } from "react-icons/lu";
import { useT } from "@/i18n";

/** Chrome/Edge/Android install event; not in the standard DOM typings. */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "drmis-install-dismissed-at";
const DISMISS_DAYS = 30;
const UPDATE_CHECK_MS = 5 * 60 * 1000;

function installWasDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function AppPrompt() {
  const { t } = useT();
  const [updateReady, setUpdateReady] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [installHidden, setInstallHidden] = useState(installWasDismissed);

  // Register the service worker and watch for a newer build
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    // No controller yet means first visit: the first worker taking control is not an update
    let hadController = !!sw.controller;
    const onControllerChange = () => {
      if (hadController) setUpdateReady(true);
      hadController = true;
    };
    sw.addEventListener("controllerchange", onControllerChange);

    let registration: ServiceWorkerRegistration | undefined;
    const checkForUpdate = () => {
      if (navigator.onLine) void registration?.update().catch(() => undefined);
    };
    void sw
      .register("/sw.js")
      .then((r) => {
        registration = r;
      })
      .catch(() => undefined);

    const interval = window.setInterval(checkForUpdate, UPDATE_CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", checkForUpdate);
    return () => {
      sw.removeEventListener("controllerchange", onControllerChange);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", checkForUpdate);
    };
  }, []);

  // The browser decides when the app is installable and tells us with this event
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // keep the browser's own mini-bar away; we show the pill instead
      setInstallEvent(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const showInstall = !!installEvent && !installHidden && !isInstalled();
  if (!updateReady && !showInstall) return null;

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => undefined);
    // The event can be used once, whatever the answer
    setInstallEvent(null);
  };

  const dismissInstall = () => {
    setInstallHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode: hidden for this visit only */
    }
  };

  const Icon = updateReady ? LuRefreshCw : LuDownload;

  return (
    <div
      className="fixed bottom-9 left-1/2 z-[9997] flex h-11 w-[min(22rem,calc(100vw-1.5rem))] -translate-x-1/2 items-center gap-1 rounded-full border border-border bg-card p-1 shadow-lg print:hidden"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={updateReady ? () => window.location.reload() : handleInstall}
        title={updateReady ? t("pwa.updateReady") : t("pwa.installHint")}
        className="flex h-full min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{updateReady ? t("pwa.reload") : t("pwa.install")}</span>
      </button>
      {/* A new build should not be waved away, so only the install offer can be closed.
          The slot keeps its width either way so the pill is the same size in both states. */}
      <span className="flex size-9 shrink-0 items-center justify-center">
        {!updateReady && (
          <button
            type="button"
            onClick={dismissInstall}
            aria-label={t("pwa.dismiss")}
            title={t("pwa.dismiss")}
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LuX className="size-4" />
          </button>
        )}
      </span>
    </div>
  );
}
