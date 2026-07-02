import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright e2e test config.
 * Vite dev server otomatik baslatilir; backend ayrica calisiyor olmali
 * (npm run backend:dev).
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'},
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }},
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }}],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000}});