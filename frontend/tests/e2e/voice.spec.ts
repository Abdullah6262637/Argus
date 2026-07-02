/**
 * Sprint B.3: Voice STT/TTS smoke testi.
 * Voice servisi opsiyoneldir; status endpoint hep çalışmalı.
 */
import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

test.describe('Voice', () => {
  test('GET /api/voice/status döner', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/voice/status`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    // Bayraklar her zaman mevcut olmalı (true/false)
    expect(typeof data.stt_available).toBe('boolean');
    expect(typeof data.tts_available).toBe('boolean');
  });

  test('TTS endpoint var (POST /api/voice/speak)', async ({ request }) => {
    const res = await request.post(`${BACKEND_URL}/api/voice/speak`, {
      data: { text: 'merhaba dunya' }});
    // STT/TTS kurulu değilse 503 dönebilir; her iki durum da geçerli
    expect([200, 503, 501, 422]).toContain(res.status());
  });
});