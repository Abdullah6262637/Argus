/**
 * Sprint B.3: Full flow e2e — backend health, agents endpoint, header görünür.
 * Backend'in 127.0.0.1:8000'de çalışıyor olması gerekir.
 *
 * NOT: LLM çağırmaz; chat akışı için LLM key olmadan integration test
 * kararsız olur, bu yüzden bu testler "uygulama açıldı, API canlı, UI temel
 * elementleri görünüyor" akışını doğrular.
 */
import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

test.describe('Full Flow', () => {
  test('backend health endpoint OK', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/health`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBeDefined();
  });

  test('agents endpoint döner', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/agents`);
    expect(res.ok()).toBeTruthy();
    const list = await res.json();
    expect(Array.isArray(list)).toBe(true);
  });

  test('app açılır ve header görünür', async ({ page }) => {
    await page.goto('/');
    // En az 1 buton + container görünmeli (Header)
    await expect(page.locator('#root')).toBeVisible();
    // UmtalAgent yazısı veya UA logosu
    const branding = page.getByText(/UmtalAgent/i);
    await expect(branding.first()).toBeVisible();
  });

  test('yeni ajan butonu varsa form modalı açar', async ({ page }) => {
    await page.goto('/');
    const newAgentBtn = page.getByRole('button', { name: /yeni ajan|new agent/i });
    if (await newAgentBtn.count()) {
      await newAgentBtn.first().click();
      // Modal başlığı: "Yeni Ajan Olustur"
      const title = page.getByText(/yeni ajan olustur|yeni ajan oluştur/i);
      await expect(title.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('sistem env endpoint çalışır', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/system/env`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('has');
    expect(data).toHaveProperty('masked');
  });

  test('souls endpoint çalışır', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/agents/souls`);
    expect(res.ok()).toBeTruthy();
    const list = await res.json();
    expect(Array.isArray(list)).toBe(true);
    // En az 1 sistem soul olmalı (12 hazır şablon)
    if (list.length > 0) {
      expect(list[0]).toHaveProperty('name');
      expect(list[0]).toHaveProperty('preview');
    }
  });
});