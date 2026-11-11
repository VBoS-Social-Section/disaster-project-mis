import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Low-data mode: fewer, lighter map tiles for slow or metered connections.
 * "auto" follows what the browser reports about the connection (Save-Data, 2G/3G).
 */
export type LowDataPreference = "auto" | "on" | "off";

interface LowDataState {
  preference: LowDataPreference;
  setPreference: (p: LowDataPreference) => void;
}

export const useLowDataStore = create<LowDataState>()(
  persist(
    (set) => ({
      preference: "auto",
      setPreference: (preference) => set({ preference }),
    }),
    { name: "drmis-low-data" },
  ),
);

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

export function connectionIsSlow(): boolean {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (!connection) return false;
  return !!connection.saveData || ["slow-2g", "2g", "3g"].includes(connection.effectiveType ?? "");
}

/** Whether low-data mode is in effect, and whether that was decided automatically. */
export function useLowData(): { active: boolean; automatic: boolean } {
  const preference = useLowDataStore((s) => s.preference);
  if (preference === "on") return { active: true, automatic: false };
  if (preference === "off") return { active: false, automatic: false };
  const slow = connectionIsSlow();
  return { active: slow, automatic: slow };
}
