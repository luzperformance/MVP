import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Doctor {
  id: number;
  name: string;
  email: string;
  crm: string;
}

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
