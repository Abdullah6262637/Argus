import { useEffect, useState } from 'react';
export const THEMES = [
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
function applyTheme(theme) {
    if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
    }
}
function getInitialTheme() {
    if (typeof window === 'undefined')
        return 'midnight';
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'mono' || saved === 'midnight' || saved === 'sunset' || saved === 'forest') {
        return saved;
    }
    return 'midnight';
}
export function useTheme() {
    const [theme, setThemeState] = useState(getInitialTheme);
    useEffect(() => {
        applyTheme(theme);
        try {
            window.localStorage.setItem(STORAGE_KEY, theme);
        }
        catch {
            /* ignore */
        }
    }, [theme]);
    return {
        theme,
        setTheme: setThemeState,
        themes: THEMES,
    };
}
