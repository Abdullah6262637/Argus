// Sprint B.2: useApprovals WS event reducer testleri
import { renderHook, act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useApprovals } from './useApprovals';
import type { PendingApproval } from '@/types';

vi.mock('@/api/client', () => ({
  api: {
    listPendingApprovals: vi.fn()}}));

import { api } from '@/api/client';

const mockedApi = api as unknown as {
  listPendingApprovals: ReturnType<typeof vi.fn>;
};

const sample: PendingApproval = {
  id: 1,
  agent_id: 'a1',
  conversation_id: null,
  tool_name: 'run_command',
  arguments: { command: 'ls' },
  risk_level: 'high',
  status: 'pending',
  created_at: new Date().toISOString()};

describe('useApprovals', () => {
  beforeEach(() => {
    mockedApi.listPendingApprovals.mockReset();
    mockedApi.listPendingApprovals.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('mount sonrasında listPendingApprovals çağırır', async () => {
    mockedApi.listPendingApprovals.mockResolvedValue([sample]);
    const { result } = renderHook(() => useApprovals());

    await waitFor(() => expect(mockedApi.listPendingApprovals).toHaveBeenCalled());
    await waitFor(() => expect(result.current.approvals.length).toBe(1));
    expect(result.current.approvals[0].id).toBe(1);
  });

  it('approval_required event yeni item ekler', async () => {
    const { result } = renderHook(() => useApprovals());
    await waitFor(() => expect(mockedApi.listPendingApprovals).toHaveBeenCalled());

    act(() => {
      result.current.onWSEvent({
        type: 'approval_required',
        approval_id: 42,
        agent_id: 'a1',
        tool_name: 'shutdown',
        arguments: {},
        risk_level: 'high'});
    });

    expect(result.current.approvals.find((a) => a.id === 42)).toBeDefined();
  });

  it('aynı id\'yi tekrar göndermek duplicate eklemez', async () => {
    const { result } = renderHook(() => useApprovals());
    await waitFor(() => expect(mockedApi.listPendingApprovals).toHaveBeenCalled());

    const evt = {
      type: 'approval_required' as const,
      approval_id: 7,
      agent_id: 'a',
      tool_name: 'x',
      arguments: {},
      risk_level: 'high'};

    act(() => {
      result.current.onWSEvent(evt);
      result.current.onWSEvent(evt);
    });

    const matches = result.current.approvals.filter((a) => a.id === 7);
    expect(matches.length).toBe(1);
  });

  it('approval_decided event item\'i kaldırır', async () => {
    mockedApi.listPendingApprovals.mockResolvedValue([sample]);
    const { result } = renderHook(() => useApprovals());

    await waitFor(() => expect(result.current.approvals.length).toBe(1));

    act(() => {
      result.current.onWSEvent({
        type: 'approval_decided',
        approval_id: 1,
        status: 'approved'});
    });

    expect(result.current.approvals.length).toBe(0);
  });

  it('removeApproval helper item\'i kaldırır', async () => {
    mockedApi.listPendingApprovals.mockResolvedValue([sample]);
    const { result } = renderHook(() => useApprovals());

    await waitFor(() => expect(result.current.approvals.length).toBe(1));

    act(() => {
      result.current.removeApproval(1);
    });

    expect(result.current.approvals.length).toBe(0);
  });
});