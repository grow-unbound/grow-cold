import { create } from 'zustand';

export type AppRole = 'OWNER' | 'MANAGER' | 'STAFF';

interface SessionState {
  role: AppRole;
  setRole: (role: AppRole) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  role: 'STAFF',
  setRole: (role) => set({ role }),
}));
