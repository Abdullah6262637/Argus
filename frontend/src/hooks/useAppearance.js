// Sprint E.6: UI yogunluk + yazi boyutu (CSS custom property uzerinden runtime swap)
import { useEffect, useState } from 'react';
const DENSITY_KEY = 'umtalagent.density';
const FONT_KEY = 'umtalagent.fontSize';
function applyAppearance(density, fontSize) {
    if (typeof document === 'undefined')
        return;
    document.documentElement.setAttribute('data-density', density);
    document.documentElement.setAttribute('data-font-size', fontSize);
}
function getInitialDensity() {
    if (typeof window === 'undefined')
        return 'cozy';
    const saved = window.localStorage.getItem(DENSITY_KEY);
    if (saved === 'compact' || saved === 'cozy' || saved === 'comfortable')
        return saved;
    return 'cozy';
}
function getInitialFontSize() {
    if (typeof window === 'undefined')
        return 'md';
    const saved = window.localStorage.getItem(FONT_KEY);
    if (saved === 'sm' || saved === 'md' || saved === 'lg')
        return saved;
    return 'md';
}
export function useAppearance() {
    const [density, setDensityState] = useState(getInitialDensity);
    const [fontSize, setFontSizeState] = useState(getInitialFontSize);
    useEffect(() => {
        applyAppearance(density, fontSize);
        try {
            window.localStorage.setItem(DENSITY_KEY, density);
            window.localStorage.setItem(FONT_KEY, fontSize);
        }
        catch {
            /* ignore */
        }
    }, [density, fontSize]);
    return {
        density,
        setDensity: setDensityState,
        fontSize,
        setFontSize: setFontSizeState
    };
}
