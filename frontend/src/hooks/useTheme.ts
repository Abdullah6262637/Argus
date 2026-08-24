import { useEffect, useState } from 'react';

export type BaseThemeId = 'mono' | 'midnight' | 'sunset' | 'forest';
export type ThemeVariant = 'dark' | 'light';

export type ThemeId =
  | 'mono'
  | 'midnight'
  | 'sunset'
  | 'forest'
  | 'mono-light'
  | 'midnight-light'
  | 'sunset-light'
  | 'forest-light';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  description: string;
}

export const BASE_THEMES: Array<{
  id: BaseThemeId;
  name: string;
  darkDesc: string;
  lightDesc: string;
}> = [
  {
    id: 'mono',
    name: 'Mono',
<<<<<<< HEAD
    description: 'Klasik siyah-beyaz',
  },
  {
    id: 'midnight',
    name: 'Argus Slate',
    description: 'Modern slate & zümrüt',
=======
    darkDesc: 'Minimal siyah-beyaz',
    lightDesc: 'Saf minimal beyaz',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    darkDesc: 'Koyu gece mavisi',
    lightDesc: 'Ferah gökyüzü mavisi',
>>>>>>> 31b48af (perf(core): optimize GPU rasterization, eliminate CSS blur lag, optimize RAF scroll and SQLite memory I/O)
  },
  {
    id: 'sunset',
    name: 'Sunset',
    darkDesc: 'Sıcak turuncu-amber',
    lightDesc: 'Sıcak krem & şeftali',
  },
  {
    id: 'forest',
    name: 'Forest',
    darkDesc: 'Koyu orman yeşili',
    lightDesc: 'Taze nane & bahar yeşili',
  },
];

export const THEMES: ThemeDef[] = [
  { id: 'mono', name: 'Mono (Koyu)', description: 'Minimal siyah-beyaz' },
  { id: 'midnight', name: 'Midnight (Koyu)', description: 'Koyu gece mavisi' },
  { id: 'sunset', name: 'Sunset (Koyu)', description: 'Sıcak turuncu-amber' },
  { id: 'forest', name: 'Forest (Koyu)', description: 'Koyu orman yeşili' },
  { id: 'mono-light', name: 'Mono (Açık)', description: 'Saf minimal beyaz' },
  { id: 'midnight-light', name: 'Midnight (Açık)', description: 'Ferah gökyüzü mavisi' },
  { id: 'sunset-light', name: 'Sunset (Açık)', description: 'Sıcak krem & şeftali' },
  { id: 'forest-light', name: 'Forest (Açık)', description: 'Taze nane & bahar yeşili' },
];

export function getBaseThemeId(theme: ThemeId): BaseThemeId {
  if (theme.startsWith('midnight')) return 'midnight';
  if (theme.startsWith('sunset')) return 'sunset';
  if (theme.startsWith('forest')) return 'forest';
  return 'mono';
}

export function getThemeVariant(theme: ThemeId): ThemeVariant {
  return theme.endsWith('-light') ? 'light' : 'dark';
}

export function getFullThemeId(base: BaseThemeId, variant: ThemeVariant): ThemeId {
  if (variant === 'light') {
    return `${base}-light` as ThemeId;
  }
  return base;
}

const STORAGE_KEY = 'umtalagent.theme';

function applyTheme(theme: ThemeId) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function getInitialTheme(): ThemeId {
<<<<<<< HEAD
  if (typeof window === 'undefined') return 'midnight';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'mono' || saved === 'midnight' || saved === 'sunset' || saved === 'forest') {
=======
  if (typeof window === 'undefined') return 'mono';
  const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeId;
  const validThemes: ThemeId[] = [
    'mono',
    'midnight',
    'sunset',
    'forest',
    'mono-light',
    'midnight-light',
    'sunset-light',
    'forest-light',
  ];
  if (validThemes.includes(saved)) {
>>>>>>> 31b48af (perf(core): optimize GPU rasterization, eliminate CSS blur lag, optimize RAF scroll and SQLite memory I/O)
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