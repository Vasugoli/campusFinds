import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: any; // Replace 'any' with a proper User type
  token: string | null;
  isAuthenticated: boolean;
  login: (user: any, token: string) => void; // Replace 'any' with a proper User type
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
    }
  )
);

export default useAuthStore;
