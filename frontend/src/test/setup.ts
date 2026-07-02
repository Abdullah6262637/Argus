/**
 * Vitest setup: testing-library matchers + jsdom polyfill'leri
 */
import '@testing-library/jest-dom/vitest';

// matchMedia polyfill (jsdom default'ta yok)
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false} as MediaQueryList);
}

// IntersectionObserver polyfill
if (typeof window !== 'undefined' && !(window as any).IntersectionObserver) {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
  }
  (window as any).IntersectionObserver = IO;
}