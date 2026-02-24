import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  setAuth: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
    (set) => ({
      token: null,
      user: null,

      setAuth: (token, user) => set({ token, user }),

      clearAuth: () => set({ token: null, user: null }),

      setUser: (user) => set({ user }),
    }),
    {
      name: "vbos-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
