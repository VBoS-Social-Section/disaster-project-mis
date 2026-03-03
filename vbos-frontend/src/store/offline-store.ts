import { create } from "zustand";

interface OfflineState {
  isOnline: boolean;
  queuedActions: number;
  setOnline: (online: boolean) => void;
  incrementQueued: () => void;
  clearQueued: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  queuedActions: 0,

  setOnline: (online) => set({ isOnline: online }),

  incrementQueued: () => set((s) => ({ queuedActions: s.queuedActions + 1 })),

  clearQueued: () => set({ queuedActions: 0 }),
}));
