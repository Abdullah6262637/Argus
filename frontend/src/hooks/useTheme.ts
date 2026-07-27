import { useEffect, useState } from 'react';

export type ThemeId = 'mono' | 'midnight' | 'sunset' | 'forest';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  description: string;
}

export const THEMES: ThemeDef[] = [
  {
    id: 'mono',
    name: 'Mono',
    description: 'Klasik siyah-beyaz',
  },
  {
    id: 'midnight',
    name: 'Argus Slate',
    description: 'Modern slate & zümrüt',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Sicak turuncu-amber',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Koyu orman yesili',
  },
];

const STORAGE_KEY = 'umtalagent.theme';

function applyTheme(theme: ThemeId) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function getInitialTheme(): ThemeId {
  if (typeof window === 'undefined') return 'midnight';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'mono' || saved === 'midnight' || saved === 'sunset' || saved === 'forest') {
    return saved;
  }
  return 'midnight';
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return {
    theme,
    setTheme: setThemeState,
    themes: THEMES,
  };
}