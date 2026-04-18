import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Doctor } from '@shared/types';

interface AuthState {
  token: string | null;
  doctor: Doctor | null;
  setAuth: (token: string, doctor: Doctor) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
        const token = get().token;
        if (token) {
          fetch('/api/auth/logout', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        set({ token: null, doctor: null });
      },

      // Atualiza dados do médico consultando /api/auth/me
      refreshMe: async () => {
        const token = get().token;
        if (!token) return;
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const doctor = await res.json();
            set({ doctor });
          } else if (res.status === 401) {
            // Token expirado — limpar sessão
            set({ token: null, doctor: null });
          }
        } catch (err) {
          console.error('refreshMe error:', err);
        }
      },
    }),
    { name: 'prontuario-auth' }
  )
);
