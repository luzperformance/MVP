import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Doctor } from '@shared/types';

interface AuthState {
  token: string | null;
  doctor: Doctor | null;
  setAuth: (token: string, doctor: Doctor) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      doctor: null,
      setAuth: (token, doctor) => set({ token, doctor }),
      logout: () => set({ token: null, doctor: null }),
    }),
    { name: 'prontuario-auth' }
  )
);
