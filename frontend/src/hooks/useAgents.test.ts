// Sprint B.2: useAgents hook testleri
import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAgents } from './useAgents';

// API client'i mockla
vi.mock('@/api/client', () => ({
  api: {
    listAgents: vi.fn(),
    reloadAgents: vi.fn()}}));

import { api } from '@/api/client';

const mockedApi = api as unknown as {
  listAgents: ReturnType<typeof vi.fn>;
  reloadAgents: ReturnType<typeof vi.fn>;
};

const fakeAgents = [
  {
    id: 'a1',
    name: 'Agent One',
    role: 'Tester',
    provider: 'openai',
    model: 'gpt-4o',
    is_active: true,
    tags: [],
    has_api_key: false,
    has_base_url: false}];

describe('useAgents', () => {
  beforeEach(() => {
    mockedApi.listAgents.mockReset();
    mockedApi.reloadAgents.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('mount sonrası listAgents çağırır ve sonucu state\'e koyar', async () => {
    mockedApi.listAgents.mockResolvedValue(fakeAgents);

    const { result } = renderHook(() => useAgents());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedApi.listAgents).toHaveBeenCalledTimes(1);
    expect(result.current.agents).toEqual(fakeAgents);
    expect(result.current.error).toBeNull();
  });

  it('listAgents hatası error state\'i doldurur', async () => {
    mockedApi.listAgents.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useAgents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.agents).toEqual([]);
    expect(result.current.error).toBe('boom');
  });

  it('reload() reloadAgents çağırır ve listeyi günceller', async () => {
    mockedApi.listAgents.mockResolvedValue([]);
    mockedApi.reloadAgents.mockResolvedValue(fakeAgents);

    const { result } = renderHook(() => useAgents());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.reload();
    });

    expect(mockedApi.reloadAgents).toHaveBeenCalledTimes(1);
    expect(result.current.agents).toEqual(fakeAgents);
  });
});