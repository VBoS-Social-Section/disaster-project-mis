import { create } from "zustand";
import { persist } from "zustand/middleware";
import { EXPIRY_MESSAGES, getExpiry, type ExpiryReason } from "@/utils/sessionTimeout";

const AUTH_TOKEN_KEY = "vbos-auth-token";

export interface AuthUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  groups: string[];
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  /** When the user signed in (ms epoch); the 8 hour cap counts from here. */
  loginAt: number | null;
  /** Last user activity (ms epoch); the 30 minute idle limit counts from here. */
  lastActive: number | null;
  /** Message shown on the sign-in page after an automatic sign-out. Not persisted. */
  signOutMessage: string | null;
  setAuth: (token: string, user: AuthUser | null) => void;
  clearAuth: () => void;
  setUser: (user: AuthUser | null) => void;
  touch: () => void;
  expireSession: (reason: ExpiryReason) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      loginAt: null,
      lastActive: null,
      signOutMessage: null,

      setAuth: (token, user) => {
        const now = Date.now();
        // Keep the original loginAt when only the user profile is being filled in.
        set((s) => ({
          token,
          user,
          loginAt: s.token === token && s.loginAt ? s.loginAt : now,
          lastActive: now,
          signOutMessage: null,
        }));
      },

      clearAuth: () =>
        set({ token: null, user: null, loginAt: null, lastActive: null }),

      setUser: (user) => set({ user }),

      touch: () => set({ lastActive: Date.now() }),

      expireSession: (reason) =>
        set({
          token: null,
          user: null,
          loginAt: null,
          lastActive: null,
          signOutMessage: EXPIRY_MESSAGES[reason],
        }),
    }),
    {
      name: AUTH_TOKEN_KEY,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        loginAt: state.loginAt,
        lastActive: state.lastActive,
      }),
    }
  )
);

/** Signs the user out if the stored session has outlived its limits. */
export function enforceSessionLimits(): boolean {
  const { token, loginAt, lastActive, expireSession } = useAuthStore.getState();
  if (!token) return false;
  const reason = getExpiry(Date.now(), loginAt, lastActive);
  if (!reason) return false;
  expireSession(reason);
  return true;
}

// Run before the app renders, so reopening a long-closed tab lands on the sign-in page
// instead of firing API calls with a stale token.
enforceSessionLimits();
