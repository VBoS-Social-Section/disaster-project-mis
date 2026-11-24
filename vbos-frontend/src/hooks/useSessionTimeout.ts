/**
 * Ends the sign-in session after 30 minutes of inactivity or 8 hours in total.
 * The backend enforces the same limits; this keeps the UI in step with it, and also
 * covers a tab that was closed or asleep for a long time.
 */
import { useEffect } from "react";
import { enforceSessionLimits, useAuthStore } from "@/store/auth-store";
import { IDLE_TIMEOUT_MS } from "@/utils/sessionTimeout";
import { toast } from "@/utils/toast";

const CHECK_INTERVAL_MS = 15 * 1000;
const ACTIVITY_THROTTLE_MS = 15 * 1000;
const WARN_BEFORE_MS = 60 * 1000;
const STORAGE_KEY = "vbos-auth-token";
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "wheel", "touchstart", "scroll"];

export function useSessionTimeout() {
  const isAuthenticated = useAuthStore((s) => !!s.token);

  useEffect(() => {
    if (!isAuthenticated) return;

    let lastWrite = 0;
    let warned = false;

    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_THROTTLE_MS) return;
      lastWrite = now;
      warned = false;
      useAuthStore.getState().touch();
    };

    const check = () => {
      if (enforceSessionLimits()) return;
      const { lastActive } = useAuthStore.getState();
      if (!warned && lastActive && Date.now() - lastActive > IDLE_TIMEOUT_MS - WARN_BEFORE_MS) {
        warned = true;
        toast.warning(
          "Signing out soon",
          "You'll be signed out in about a minute due to inactivity.",
        );
      }
    };

    // Another tab signed in/out or was active: pick up its state.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) void useAuthStore.persist.rehydrate();
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, onActivity, { passive: true }),
    );
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    const id = window.setInterval(check, CHECK_INTERVAL_MS);
    check();

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, onActivity));
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(id);
    };
  }, [isAuthenticated]);
}
