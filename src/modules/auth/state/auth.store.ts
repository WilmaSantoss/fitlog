import { create } from 'zustand';

type AuthState = {
  ready: boolean;
  accountId: string | null;
  email: string | null;
  signIn: (accountId: string, email: string) => void;
  signOut: () => void;
  markReady: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  ready: false,
  accountId: null,
  email: null,
  signIn: (accountId, email) => set({ accountId, email }),
  signOut: () => set({ accountId: null, email: null }),
  markReady: () => set({ ready: true }),
}));
