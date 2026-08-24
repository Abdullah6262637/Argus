import { useState, useCallback } from 'react';

export function useLayoutState() {
  const [agentListOpen, setAgentListOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('argus_agent_list_open');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const [systemPanelOpen, setSystemPanelOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('argus_system_panel_open');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const toggleAgentList = useCallback(() => {
    setAgentListOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('argus_agent_list_open', String(next));
      } catch {}
      return next;
    });
  }, []);

  const toggleSystemPanel = useCallback(() => {
    setSystemPanelOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('argus_system_panel_open', String(next));
      } catch {}
      return next;
    });
  }, []);

  return {
    agentListOpen,
    systemPanelOpen,
    toggleAgentList,
    toggleSystemPanel,
  };
}
