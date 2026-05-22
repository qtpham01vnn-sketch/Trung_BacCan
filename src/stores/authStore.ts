import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  role: 'admin' | 'office' | 'field_worker' | null;
  setAuth: (session: Session | null, role?: 'admin' | 'office' | 'field_worker' | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: null,
  setAuth: (session, role) => set({
    user: session?.user ?? null,
    session,
    role: role ?? null
  }),
  clearAuth: () => set({ user: null, session: null, role: null }),
}));
