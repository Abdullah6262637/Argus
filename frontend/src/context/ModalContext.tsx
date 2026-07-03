import React, { createContext, useContext, useState, useCallback } from 'react';

export type SettingsTabId = 'agents' | 'theme' | 'apikeys' | 'plugins_mcp' | 'reset' | 'about';

interface ConfirmConfig {
  title: string;
  message: React.ReactNode;
  details?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  requireTypeText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  hideCancel?: boolean;
}

interface ModalContextType {
  settingsOpen: boolean;
  settingsTab: SettingsTabId;
  openSettings: (tab?: SettingsTabId) => void;
  closeSettings: () => void;

  workflowsOpen: boolean;
  openWorkflows: () => void;
  closeWorkflows: () => void;

  paletteOpen: boolean;
  setPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  openPalette: () => void;
  closePalette: () => void;

  inspectorOpen: boolean;
  inspectorAgentId: string | null;
  openInspector: (agentId: string) => void;
  closeInspector: () => void;

  formOpen: boolean;
  editingAgent: any; // AgentDetail | null
  openForm: (agent?: any) => void;
  closeForm: () => void;

  confirmState: ConfirmConfig | null;
  openConfirm: (config: ConfirmConfig) => void;
  closeConfirm: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTabId>('agents');

  const [workflowsOpen, setWorkflowsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorAgentId, setInspectorAgentId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);

  const [confirmState, setConfirmState] = useState<ConfirmConfig | null>(null);

  const openSettings = useCallback((tab?: any) => {
    const validTabs: SettingsTabId[] = ['agents', 'theme', 'apikeys', 'plugins_mcp', 'reset', 'about'];
    const selectedTab = (typeof tab === 'string' && validTabs.includes(tab as SettingsTabId))
      ? (tab as SettingsTabId)
      : 'agents';
    setSettingsTab(selectedTab);
    setSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const openWorkflows = useCallback(() => setWorkflowsOpen(true), []);
  const closeWorkflows = useCallback(() => setWorkflowsOpen(false), []);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  const openInspector = useCallback((agentId: string) => {
    setInspectorAgentId(agentId);
    setInspectorOpen(true);
  }, []);

  const closeInspector = useCallback(() => {
    setInspectorOpen(false);
    setInspectorAgentId(null);
  }, []);

  const openForm = useCallback((agent: any = null) => {
    setEditingAgent(agent);
    setFormOpen(true);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingAgent(null);
  }, []);

  const openConfirm = useCallback((config: ConfirmConfig) => {
    setConfirmState(config);
  }, []);

  const closeConfirm = useCallback(() => {
    if (confirmState?.onCancel) {
      confirmState.onCancel();
    }
    setConfirmState(null);
  }, [confirmState]);

  return (
    <ModalContext.Provider
      value={{
        settingsOpen,
        settingsTab,
        openSettings,
        closeSettings,
        workflowsOpen,
        openWorkflows,
        closeWorkflows,
        paletteOpen,
        setPaletteOpen,
        openPalette,
        closePalette,
        inspectorOpen,
        inspectorAgentId,
        openInspector,
        closeInspector,
        formOpen,
        editingAgent,
        openForm,
        closeForm,
        confirmState,
        openConfirm,
        closeConfirm,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
