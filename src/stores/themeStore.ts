import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '@/types';

interface ThemeState {
  theme: ThemeMode;
  systemTheme: 'light' | 'dark';
}

interface ThemeActions {
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

type ThemeStore = ThemeState & ThemeActions;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      systemTheme: 'light',

      // Actions
      setTheme: (theme: ThemeMode) => {
        set({ theme });
      },

      toggleTheme: () => {
        const { theme, systemTheme } = get();
        const currentEffectiveTheme = theme === 'system' ? systemTheme : theme;
        const newTheme = currentEffectiveTheme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
      },

      initializeTheme: () => {
        // Detect system theme
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const systemTheme = mediaQuery.matches ? 'dark' : 'light';
        set({ systemTheme });

        // Listen for system theme changes
        const handleChange = (e: MediaQueryListEvent) => {
          set({ systemTheme: e.matches ? 'dark' : 'light' });
        };

        mediaQuery.addEventListener('change', handleChange);
      },
    }),
    {
      name: 'ohcs-theme-storage',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Selector for effective theme (resolves 'system' to actual theme)
export const useEffectiveTheme = () => {
  const { theme, systemTheme } = useThemeStore();
  return theme === 'system' ? systemTheme : theme;
};
