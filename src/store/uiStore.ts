import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'noir' | 'paper';

interface UIState {
  theme: Theme;
  isAISettingsOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAISettingsOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'noir',
      isAISettingsOpen: false,
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'noir' ? 'paper' : 'noir';
        document.documentElement.setAttribute('data-theme', next);
        set({ theme: next });
      },
      setAISettingsOpen: (isOpen) => set({ isAISettingsOpen: isOpen }),
    }),
    {
      name: 'opensaga-ui',
      onRehydrateStorage: () => (state) => {
        // Apply persisted theme on page load
        if (state?.theme) {
          document.documentElement.setAttribute('data-theme', state.theme);
        }
      },
    }
  )
);
