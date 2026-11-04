import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null, token?: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'user-default-admin-01',
    email: 'admin@aileadfinder.io',
    name: 'Executive Director',
    role: 'ADMIN',
  },
  token: localStorage.getItem('ai_lead_finder_token') || 'demo-token',
  isAuthenticated: true,

  setUser: (user, token) => {
    if (token) {
      localStorage.setItem('ai_lead_finder_token', token);
    } else {
      localStorage.removeItem('ai_lead_finder_token');
    }
    set({ user, token: token || null, isAuthenticated: Boolean(user) });
  },

  logout: () => {
    localStorage.removeItem('ai_lead_finder_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
