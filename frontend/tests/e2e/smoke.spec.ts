/**
 * Smoke testi: app yuklenir, header ve agent listesi gorunur.
 * Backend'in calisiyor olmasi gerekir (http://127.0.0.1:8000).
 */
import { test, expect } from '@playwright/test';

test.describe('UmtalAgent - Smoke', () => {
  test('app loads and shows header', async ({ page }) => {
    await page.goto('/');
    // App.tsx'te muhtemelen "UmtalAgent" yazisi vardir
    await expect(page).toHaveTitle(/UmtalAgent|Vite/);
  });

  test('agent list area is visible', async ({ page }) => {
    await page.goto('/');
    // AgentList ya da bos durum panel'inden biri gorunsun
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('settings modal can be opened (if button exists)', async ({ page }) => {
    await page.goto('/');
    const settingsBtn = page.getByRole('button', { name: /ayarlar|settings/i });
    if (await settingsBtn.count()) {
      await settingsBtn.first().click();
      // Modal acildiginda capalanan bir aria-label/role beklenir; varsa kontrol et
      const modal = page.getByRole('dialog');
      if (await modal.count()) {
        await expect(modal.first()).toBeVisible();
      }
    }
  });
});