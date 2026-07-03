import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { AgentList } from './components/AgentList';
import { ChatWindow } from './components/ChatWindow';
import { SystemPanel } from './components/SystemPanel';
import { AgentForm } from './components/AgentForm';
import { EmptyState } from './components/EmptyState';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Onboarding } from './components/Onboarding';
import { SetupWizard } from './components/SetupWizard';
import { ApprovalDialog } from './components/ApprovalDialog';
import { WorkflowsModal } from './components/WorkflowsModal';
import { CommandPalette } from './components/CommandPalette';
import { AgentInspectorModal } from './components/AgentInspectorModal';
import { Icon } from './components/Icon';
import { api } from './api/client';
import { useAgents } from './hooks/useAgents';
import { useChat } from './hooks/useChat';
import { useWebSocket } from './hooks/useWebSocket';
import { useTheme } from './hooks/useTheme';
import { useAppearance } from './hooks/useAppearance';
import { useFirstRun } from './hooks/useFirstRun';
import { useApprovals } from './hooks/useApprovals';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useModal } from './context/ModalContext';
import type { AgentCreate, WSMessage } from './types';

export default function App() {
  const {
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
    closeConfirm
  } = useModal();

  const { agents, loading, error, reload } = useAgents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [systemRefresh, setSystemRefresh] = useState(0);

  const [formSubmitting, setFormSubmitting] = useState(false);

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


  const toggleAgentList = () => {
    setAgentListOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('argus_agent_list_open', String(next));
      } catch {}
      return next;
    });
  };

  const toggleSystemPanel = () => {
    setSystemPanelOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('argus_system_panel_open', String(next));
      } catch {}
      return next;
    });
  };
  const { theme, setTheme } = useTheme();
  // Sprint E.6: density + font size
  const { setDensity, setFontSize } = useAppearance();

  // Keyboard shortcuts moved to bottom to capture full state closures

  const { showOnboarding, complete: completeOnboarding, reset: resetOnboarding } = useFirstRun();

  // Akıllı Kurulum Sihirbazı Durumu
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  useEffect(() => {
    api.getSetupStatus()
      .then((status) => {
        setSetupRequired(!status.initialized);
      })
      .catch(() => {
        setSetupRequired(false);
      });
  }, []);

  // Confirm state
  const [typedText, setTypedText] = useState('');

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedId) ?? null,
    [agents, selectedId],
  );

  // Sprint 1.1: SSE streaming default
  const chat = useChat(selectedId, 'sse');
  // Sprint 1.3: Approvals
  const approvals = useApprovals();

  useEffect(() => {
    if (!selectedId && agents.length > 0) {
      setSelectedId(agents[0].id);
    }
  }, [agents, selectedId]);

  const handleWSMessage = useCallback((msg: WSMessage) => {
    if (msg.type === 'task_executed') {
      setSystemRefresh((n) => n + 1);
    } else if (
      msg.type === 'tool_call_started' ||
      msg.type === 'tool_call_completed'
    ) {
      // SSE modunda zaten event tuketiliyor; REST modunda WS ile besle
      chat.onToolEvent(msg);
    } else if (
      msg.type === 'approval_required' ||
      msg.type === 'approval_decided'
    ) {
      approvals.onWSEvent(msg);
    }
  }, [chat, approvals]);

  const ws = useWebSocket({ onMessage: handleWSMessage });

  // --- Form ---
  const openCreateForm = () => {
    openForm(null);
  };

  const openEditForm = async (id: string) => {
    try {
      const detail = await api.getAgent(id);
      openForm(detail);
    } catch (err) {
      openConfirm({
        title: 'Hata',
        message: 'Ajan detayi alinamadi.',
        details: err instanceof Error ? err.message : String(err),
        confirmLabel: 'Tamam',
        hideCancel: true,
        onConfirm: closeConfirm});
    }
  };

  const handleSubmit = async (payload: AgentCreate) => {
    setFormSubmitting(true);
    try {
      if (editingAgent) {
        await api.updateAgent(editingAgent.id, payload);
      } else {
        const created = await api.createAgent(payload);
        setSelectedId(created.id);
      }
      await reload();
      closeForm();
    } finally {
      setFormSubmitting(false);
    }
  };

  // --- Ajan silme ---
  const handleDelete = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    if (!agent) return;
    openConfirm({
      title: 'Ajani sil',
      message: (
        <>
          <strong className="text-brand-text">{agent.name}</strong> ajani
          silinecek. Bu islem <strong className="text-brand-danger">geri alinamaz</strong>.
        </>
      ),
      details: (
        <div className="space-y-1">
          <div>• Ajan listeden kaldirilir</div>
          <div>• Baglı sohbet geçmişleri DB'de kalır (elle silinene kadar)</div>
          <div>• agents.yaml dosyasindan kalici olarak silinir</div>
        </div>
      ),
      variant: 'danger',
      confirmLabel: 'Evet, Sil',
      onConfirm: async () => {
        try {
          await api.deleteAgent(id);
          if (selectedId === id) setSelectedId(null);
          await reload();
          closeConfirm();
        } catch (err) {
          closeConfirm();
          openConfirm({
            title: 'Silme basarisiz',
            message: err instanceof Error ? err.message : String(err),
            confirmLabel: 'Tamam',
            onConfirm: closeConfirm});
        }
      }});
  };

  const handleDuplicate = async (id: string) => {
    try {
      const copy = await api.duplicateAgent(id);
      await reload();
      setSelectedId(copy.id);
    } catch (err) {
      openConfirm({
        title: 'Kopyalama basarisiz',
        message: err instanceof Error ? err.message : String(err),
        confirmLabel: 'Tamam',
        onConfirm: closeConfirm});
    }
  };

  const handleExport = async (id: string) => {
    try {
      const agent = agents.find((a) => a.id === id);
      const data = await api.exportAgent(id, false);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${agent?.id ?? id}.argus.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      openConfirm({
        title: 'Disa aktarim basarisiz',
        message: err instanceof Error ? err.message : String(err),
        confirmLabel: 'Tamam',
        onConfirm: closeConfirm});
    }
  };

  const handleToggleAgentActive = async (id: string) => {
    try {
      const agent = agents.find((a) => a.id === id);
      if (!agent) return;
      await api.updateAgent(id, { is_active: !agent.is_active });
      await reload();
    } catch (err) {
      openConfirm({
        title: 'Guncelleme basarisiz',
        message: err instanceof Error ? err.message : String(err),
        confirmLabel: 'Tamam',
        onConfirm: closeConfirm
      });
    }
  };

  const handleDeleteConversation = () => {
    openConfirm({
      title: 'Sohbeti Temizle',
      message: 'Mevcut sohbet gecmisinizi temizlemek istediginizden emin misiniz? Bu islem geri alinamaz.',
      confirmLabel: 'Evet, Temizle',
      variant: 'danger',
      onConfirm: () => {
        chat.newConversation();
        closeConfirm();
      }
    });
  };

  const handleExportChatMD = (id?: string) => {
    const targetId = id || selectedId;
    const targetAgent = agents.find((a) => a.id === targetId) || selectedAgent;
    if (!targetAgent || chat.messages.length === 0) return;
    let md = `# Sohbet Gecmisi — ${targetAgent.name} (${targetAgent.role || 'Uzman'})\n`;
    md += `Tarih: ${new Date().toLocaleDateString('tr-TR')}\n\n`;
    
    chat.messages.forEach((msg) => {
      const roleName = msg.role === 'user' ? 'Kullanici' : targetAgent.name;
      md += `### 👤 ${roleName}\n\n${msg.content}\n\n`;
      if (msg.tokens || msg.model) {
        md += `*Metadata: ${msg.model ? `Model: ${msg.model}` : ''} ${msg.tokens ? `| Token: ${msg.tokens}` : ''}*\n\n`;
      }
      md += `---\n\n`;
    });
    
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sohbet-${targetAgent.name}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleTestConnection = async (id: string) => {
    try {
      openConfirm({
        title: 'Bağlantı Test Ediliyor',
        message: (
          <div className="flex items-center gap-3 py-1">
            <Icon name="progress_activity" size={16} className="animate-spin-slow text-brand-accent flex-shrink-0" />
            <span>Ajan için LLM bağlantısı test ediliyor. Lütfen bekleyin...</span>
          </div>
        ),
        confirmLabel: 'Kapat',
        hideCancel: true,
        onConfirm: closeConfirm
      });
      const detail = await api.getAgent(id);
      const res = await api.testAgentConnection({
        provider: detail.provider as any,
        model: detail.model,
        agent_id: id
      });
      if (res.ok) {
        openConfirm({
          title: 'Baglanti Basarili ✅',
          message: `${detail.name} ajani, ${detail.provider} (${detail.model}) modeline basariyla baglandi. Gecikme: ${res.latency_ms || 120}ms.`,
          confirmLabel: 'Tamam',
          onConfirm: closeConfirm
        });
      } else {
        openConfirm({
          title: 'Baglanti Basarisiz ❌',
          message: `${detail.name} baglanti testi basarisiz oldu: ${res.message || 'Bilinmeyen hata'}`,
          confirmLabel: 'Tamam',
          onConfirm: closeConfirm
        });
      }
    } catch (err) {
      openConfirm({
        title: 'Baglanti Basarisiz ❌',
        message: err instanceof Error ? err.message : String(err),
        confirmLabel: 'Tamam',
        onConfirm: closeConfirm
      });
    }
  };

  const handleClearConversations = (id: string) => {
    setSelectedId(id);
    openConfirm({
      title: 'Sohbeti Temizle',
      message: 'Bu ajanin mevcut sohbet oturumunu temizlemek istediginizden emin misiniz? Bu islem geri alinamaz.',
      confirmLabel: 'Evet, Temizle',
      variant: 'danger',
      onConfirm: () => {
        chat.newConversation();
        closeConfirm();
      }
    });
  };

  const handleNewConversation = (id: string) => {
    setSelectedId(id);
    chat.newConversation();
  };

  const handleRequestReset = () => {
    closeSettings();
    openConfirm({
      title: 'Sistemi sifirla',
      message: (
        <>
          <strong className="text-brand-danger">Dikkat:</strong> Bu islem tum ajanlari,
          sohbetleri, zamanlanmis gorevleri ve loglari <strong>kalici olarak</strong>{' '}
          silecek ve kurulum sihirbazini yeniden acacak.
        </>
      ),
      details: (
        <div className="space-y-1">
          <div>• Silinecek: tum ajanlar, tum mesajlar, tum gorevler, tum loglar</div>
          <div>• Geri alinamaz</div>
          <div>• Ayarlar (tema) korunur</div>
        </div>
      ),
      variant: 'danger',
      confirmLabel: 'Evet, SIFIRLA',
      requireTypeText: 'SIFIRLA',
      onConfirm: async () => {
        try {
          await api.resetSystem();
          await reload();
          setSelectedId(null);
          closeConfirm();
          resetOnboarding(); // onboarding'i yeniden goster
        } catch (err) {
          closeConfirm();
          openConfirm({
            title: 'Sifirlama basarisiz',
            message: err instanceof Error ? err.message : String(err),
            confirmLabel: 'Tamam',
            onConfirm: closeConfirm});
        }
      }});
  };

  useKeyboardShortcuts({
    togglePalette: () => setPaletteOpen((v) => !v),
    openCreateForm,
    newConversation: chat.newConversation,
    reloadAgents: reload,
    exportAgentJson: () => {
      if (selectedAgent) {
        handleExport(selectedAgent.id);
      }
    },
    exportChatMd: () => {
      if (selectedAgent) {
        handleExportChatMD(selectedAgent.id);
      }
    },
    deleteConversation: handleDeleteConversation,
    toggleSystemPanel,
    openSettings,
    openWorkflows,
    setTheme,
    setDensity,
    setFontSize,
    selectAgentByIndex: (idx) => {
      if (agents[idx]) {
        setSelectedId(agents[idx].id);
      }
    },
    editAgentByIndex: (idx) => {
      if (agents[idx]) {
        openEditForm(agents[idx].id);
      }
    }
  }, [agents, selectedAgent, chat, reload, openCreateForm, openEditForm, setTheme, setDensity, setFontSize, openSettings, openWorkflows]);

  const hasAgents = agents.length > 0;

  // --- Akıllı Kurulum Sihirbazı ---
  if (setupRequired === true) {
    return (
      <SetupWizard
        onFinished={() => {
          setSetupRequired(false);
          reload();
        }}
      />
    );
  }

  // --- Onboarding acikken tum uygulamanin ustunde ---
  if (showOnboarding) {
    return (
      <Onboarding
        theme={theme}
        onChangeTheme={setTheme}
        onFinish={completeOnboarding}
        onCreateFirstAgent={() => {
          completeOnboarding();
          openCreateForm();
        }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-brand-bg text-brand-text">
      <Header
        wsConnected={ws.connected}
        onReloadAgents={reload}
        onCreateAgent={openCreateForm}
        onOpenSettings={openSettings}
        onOpenWorkflows={openWorkflows}
        onOpenCommandPalette={openPalette}
      />

      {!hasAgents && !loading ? (
        <EmptyState onCreate={openCreateForm} error={error} />
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <AgentList
            agents={agents}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreate={openCreateForm}
            onEdit={openEditForm}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onExport={handleExport}
            onNewConversation={handleNewConversation}
            loading={loading}
            error={error}
            isOpen={agentListOpen}
            onToggle={toggleAgentList}
            onToggleActive={handleToggleAgentActive}
            onInspect={openInspector}
            onTestConnection={handleTestConnection}
            onClearConversations={handleClearConversations}
            onExportChatMD={handleExportChatMD}
          />
          <ChatWindow
            agent={selectedAgent}
            messages={chat.messages}
            loading={chat.loading}
            sending={chat.sending}
            error={chat.error}
            liveToolCalls={chat.liveToolCalls}
            plan={chat.plan}
            lastReflection={chat.lastReflection}
            onSend={chat.send}
            onCancel={chat.cancel}
            onNewConversation={chat.newConversation}
            agentListOpen={agentListOpen}
            onToggleAgentList={toggleAgentList}
            systemPanelOpen={systemPanelOpen}
            onToggleSystemPanel={toggleSystemPanel}
          />
          <SystemPanel
            agents={agents}
            selectedAgentId={selectedId}
            refreshSignal={systemRefresh}
            isOpen={systemPanelOpen}
            onToggle={toggleSystemPanel}
          />
        </div>
      )}

      {/* Sprint 1.3: HITL Approval Dialog */}
      <ApprovalDialog
        approvals={approvals.approvals}
        onResolved={approvals.removeApproval}
      />

      {/* Sprint A: Workflow Modal (Header'dan kolay erisim) */}
      <WorkflowsModal
        open={workflowsOpen}
        onClose={closeWorkflows}
      />

      {/* Sprint E.7: Komut Paleti (Ctrl+K) */}
      <CommandPalette
        open={paletteOpen}
        onClose={closePalette}
        agents={agents}
        onSelectAgent={setSelectedId}
        onCreateAgent={openCreateForm}
        onNewConversation={() => chat.newConversation()}
        onOpenSettings={openSettings}
        onOpenWorkflows={openWorkflows}
        onReloadAgents={reload}
        onChangeTheme={setTheme}
        onChangeDensity={setDensity}
        onChangeFontSize={setFontSize}
        onEditAgent={(id) => {
          openEditForm(id);
        }}
        onExportChat={() => {
          if (selectedAgent) {
            handleExport(selectedAgent.id);
          }
        }}
        onDeleteAgent={handleDelete}
        onDuplicateAgent={handleDuplicate}
        onToggleAgentActive={handleToggleAgentActive}
        onExportAgentConfig={handleExport}
        onDeleteConversation={handleDeleteConversation}
        onToggleSystemPanel={toggleSystemPanel}
        onExportChatMD={handleExportChatMD}
        onShowShortcuts={() => {
          openSettings('about');
        }}
      />

      {formOpen && (
        <AgentForm
          initial={editingAgent}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={formSubmitting}
          onOpenEnvSettings={() => {
            closeForm();
            openSettings('apikeys');
          }}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          theme={theme}
          onChangeTheme={setTheme}
          onClose={closeSettings}
          onRequestReset={handleRequestReset}
          initialTab={settingsTab}
          onEditAgent={openEditForm}
          onDeleteAgent={handleDelete}
          onDuplicateAgent={handleDuplicate}
          onReloadAgents={reload}
        />
      )}

      <AgentInspectorModal
        open={inspectorOpen}
        onClose={closeInspector}
        agentId={inspectorAgentId}
        agents={agents}
      />

      {confirmState && (
        <ConfirmDialog
          open={!!confirmState}
          title={confirmState.title}
          message={confirmState.message}
          details={confirmState.details}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel ?? 'Iptal'}
          variant={confirmState.variant}
          requireTypeText={confirmState.requireTypeText}
          typedText={typedText}
          onTypedTextChange={setTypedText}
          onConfirm={async () => {
            await confirmState.onConfirm();
          }}
          onCancel={closeConfirm}
          hideCancel={confirmState.hideCancel}
        />
      )}
    </div>
  );
}