/**
 * api/client.ts - URL resolution mantığı testleri.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('API client', () => {
  beforeEach(() => {
    // Her testten once localStorage'i temizle
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    // Module cache'i temizle ki re-import yeni env okusun
    vi.resetModules();
  });

  it('default API_BASE is http://127.0.0.1:8000/api', async () => {
    const { API_BASE } = await import('./client');
    expect(API_BASE).toBe('http://127.0.0.1:8000/api');
  });

  it('localStorage override is respected', async () => {
    localStorage.setItem('argus_api_base', 'http://example.com:9000/api');
    const { API_BASE } = await import('./client');
    expect(API_BASE).toBe('http://example.com:9000/api');
  });

  it('WS_BASE is derived from API_BASE', async () => {
    const { WS_BASE } = await import('./client');
    expect(WS_BASE).toBe('ws://127.0.0.1:8000');
  });

  it('voiceSpeakUrl returns absolute URL', async () => {
    const { api } = await import('./client');
    expect(api.voiceSpeakUrl()).toMatch(/\/voice\/speak$/);
  });

  it('chatStreamUrl returns absolute URL', async () => {
    const { api } = await import('./client');
    expect(api.chatStreamUrl()).toMatch(/\/chat\/stream$/);
  });
});