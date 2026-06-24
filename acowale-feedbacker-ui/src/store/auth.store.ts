import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '../types/auth.types';

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      setAuth: (user: AuthUser) => set({ isAuthenticated: true, user }),
      clearAuth: () => set({ isAuthenticated: false, user: null }),
    }),
    {
      name: 'acowale-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
);
