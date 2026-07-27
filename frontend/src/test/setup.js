/**
 * Vitest setup: testing-library matchers + jsdom polyfill'leri
 */
import '@testing-library/jest-dom/vitest';
// matchMedia polyfill (jsdom default'ta yok)
if (typeof window !== 'undefined' && !window.matchMedia) {
    window.matchMedia = (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false
    });
}
// IntersectionObserver polyfill
if (typeof window !== 'undefined' && !window.IntersectionObserver) {
    class IO {
        observe() { }
        unobserve() { }
        disconnect() { }
        takeRecords() { return []; }
    }
    window.IntersectionObserver = IO;
}
