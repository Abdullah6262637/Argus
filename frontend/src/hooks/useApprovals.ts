// useApprovals (FAZ 6.4): bekleyen onaylari WS event'lerinden ve API'den senkron tut

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { PendingApproval, WSMessage } from '@/types';

export function useApprovals() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);

  const refresh = useCallback(async () => {
    try {
      const data = await api.listPendingApprovals();
      setApprovals(data);
    } catch (err) {
      console.error('Approvals fetch hatasi', err);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const onWSEvent = useCallback(
    (msg: WSMessage) => {
      if (msg.type === 'approval_required') {
        // Yeni gelen item'i hemen ekle (refresh disinda)
        setApprovals((prev) => {
          if (prev.find((a) => a.id === msg.approval_id)) return prev;
          const newItem: PendingApproval = {
            id: msg.approval_id,
            agent_id: msg.agent_id,
            conversation_id: msg.conversation_id ?? null,
            tool_name: msg.tool_name,
            arguments: msg.arguments,
            risk_level: msg.risk_level,
            status: 'pending',
            created_at: new Date().toISOString(),
            plan_id: msg.plan_id ?? null,
            step_id: msg.step_id ?? null};
          return [...prev, newItem];
        });
      } else if (msg.type === 'approval_decided') {
        setApprovals((prev) => prev.filter((a) => a.id !== msg.approval_id));
      }
    },
    [],
  );

  const removeApproval = useCallback((id: number) => {
    setApprovals((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { approvals, refresh, onWSEvent, removeApproval };
}