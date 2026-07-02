/**
 * Sprint B.3: Workflow YAML CRUD ve listeleme e2e.
 */
import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

test.describe('Workflow CRUD', () => {
  const wfName = `e2e_test_${Date.now()}`;
  const yamlContent = `name: ${wfName}
description: e2e test workflow
inputs:
  - topic
steps:
  - id: greet
    agent: sa
    prompt: "Selam, konu: {{ inputs.topic }}"
`;

  test('GET /api/workflows liste döner', async ({ request }) => {
    const res = await request.get(`${BACKEND_URL}/api/workflows`);
    expect(res.ok()).toBeTruthy();
    const list = await res.json();
    expect(Array.isArray(list)).toBe(true);
  });

  test('PUT /api/workflows/{name} yeni workflow oluşturur', async ({ request }) => {
    const res = await request.put(`${BACKEND_URL}/api/workflows/${wfName}`, {
      data: { content: yamlContent, overwrite: true }});
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.name).toBe(wfName);
    expect(data.bytes).toBeGreaterThan(0);
  });

  test('GET /api/workflows/{name}/raw kaynağı verir', async ({ request }) => {
    // Önceki testte oluşturduğumuzu varsayıyoruz
    await request.put(`${BACKEND_URL}/api/workflows/${wfName}`, {
      data: { content: yamlContent, overwrite: true }});

    const res = await request.get(`${BACKEND_URL}/api/workflows/${wfName}/raw`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.content).toContain(wfName);
  });

  test('Geçersiz YAML 400 döner', async ({ request }) => {
    const res = await request.put(`${BACKEND_URL}/api/workflows/${wfName}_bad`, {
      data: { content: ': : invalid yaml :', overwrite: true }});
    expect(res.status()).toBe(400);
  });

  test('Geçersiz workflow adı reddedilir', async ({ request }) => {
    const res = await request.put(`${BACKEND_URL}/api/workflows/with spaces`, {
      data: { content: yamlContent, overwrite: true }});
    expect(res.status()).toBe(400);
  });

  test('DELETE /api/workflows/{name} siler', async ({ request }) => {
    // Önce oluştur
    await request.put(`${BACKEND_URL}/api/workflows/${wfName}_del`, {
      data: { content: yamlContent.replace(wfName, `${wfName}_del`), overwrite: true }});

    const delRes = await request.delete(`${BACKEND_URL}/api/workflows/${wfName}_del`);
    expect(delRes.status()).toBe(204);

    // Tekrar GET 404
    const getRes = await request.get(`${BACKEND_URL}/api/workflows/${wfName}_del/raw`);
    expect(getRes.status()).toBe(404);
  });

  test.afterAll(async ({ request }) => {
    // Temizlik
    await request.delete(`${BACKEND_URL}/api/workflows/${wfName}`).catch(() => null);
    await request.delete(`${BACKEND_URL}/api/workflows/${wfName}_bad`).catch(() => null);
  });
});