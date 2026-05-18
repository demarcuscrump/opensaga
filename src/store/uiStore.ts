import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'noir' | 'paper';

const DEFAULT_THEME: Theme = 'paper';

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

applyTheme(DEFAULT_THEME);

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
      theme: DEFAULT_THEME,
      isAISettingsOpen: false,
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'noir' ? 'paper' : 'noir';
        applyTheme(next);
        set({ theme: next });
      },
      setAISettingsOpen: (isOpen) => set({ isAISettingsOpen: isOpen }),
    }),
    {
      name: 'opensaga-ui',
      onRehydrateStorage: () => (state) => {
        // Apply persisted theme on page load
        if (state?.theme) {
          applyTheme(state.theme);
        }
      },
    }
  )
);
