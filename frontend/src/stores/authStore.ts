import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Doctor } from '@shared/types';

interface AuthState {
  token: string | null;
  doctor: Doctor | null;
  setAuth: (token: string, doctor: Doctor) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      doctor: null,
      setAuth: (token, doctor) => set({ token, doctor }),
      login: async (email, password) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) {
            const body = await res.json().catch(() => null);
            console.error('Login failed:', body?.error);
            return false;
          }

          const { token, doctor } = await res.json();
          set({ token, doctor });
          return true;
        } catch (err) {
          console.error('Login error:', err);
          return false;
        }
      },
      logout: () => {
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        set({ token: null, doctor: null });
      },
    }),
    { name: 'prontuario-auth' }
  )
);
