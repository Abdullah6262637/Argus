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
import { ApprovalDialog } from './components/ApprovalDialog';
import { WorkflowsModal } from './components/WorkflowsModal';
import { CommandPalette } from './components/CommandPalette';
import { api } from './api/client';
import { useAgents } from './hooks/useAgents';
import { useChat } from './hooks/useChat';
import { useWebSocket } from './hooks/useWebSocket';
import { useTheme } from './hooks/useTheme';
import { useAppearance } from './hooks/useAppearance';
import { useFirstRun } from './hooks/useFirstRun';
import { useApprovals } from './hooks/useApprovals';
import type { AgentCreate, AgentDetail, WSMessage } from './types';

// --------- Confirm state (imperatif kullanim icin) ---------

interface ConfirmState {
  open: boolean;
  title: string;
  message: React.ReactNode;
  details?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  requireTypeText?: string;
  onConfirm: () => void | Promise<void>;
}

export default function App() {
  const { agents, loading, error, reload } = useAgents();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [systemRefresh, setSystemRefresh] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentDetail | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'theme' | 'apikeys' | 'reset' | 'about'>('theme');
  const [workflowsOpen, setWorkflowsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  // Sprint E.6: density + font size
  useAppearance();

  // Sprint E.7: Klavye kisayollari
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      // Ctrl+K -> Komut paleti
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      // Ctrl+N -> Yeni sohbet
      else if (isMod && !e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        chat.newConversation();
      }
      // Ctrl+, -> Ayarlar
      else if (isMod && e.key === ',') {
        e.preventDefault();
        setSettingsInitialTab('theme');
        setSettingsOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { showOnboarding, complete: completeOnboarding, reset: resetOnboarding } = useFirstRun();

  // Confirm state
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [typedText, setTypedText] = useState('');

  const openConfirm = (state: Omit<ConfirmState, 'open'>) => {
    setTypedText('');
    setConfirmState({ ...state, open: true });
  };
  const closeConfirm = () => {
    setConfirmState(null);
    setTypedText('');
  };

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
    setEditingAgent(null);
    setFormOpen(true);
  };

  const openEditForm = async (id: string) => {
    try {
      const detail = await api.getAgent(id);
      setEditingAgent(detail);
      setFormOpen(true);
    } catch (err) {
      openConfirm({
        title: 'Hata',
        message: 'Ajan detayi alinamadi.',
        details: err instanceof Error ? err.message : String(err),
        confirmLabel: 'Tamam',
        cancelLabel: '',
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
      setFormOpen(false);
      setEditingAgent(null);
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

  const handleNewConversation = (id: string) => {
    setSelectedId(id);
    chat.newConversation();
  };

  // --- Sistemi sifirla ---
  const handleRequestReset = () => {
    setSettingsOpen(false);
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

  const hasAgents = agents.length > 0;

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
        onOpenSettings={() => {
          setSettingsInitialTab('theme');
          setSettingsOpen(true);
        }}
        onOpenWorkflows={() => setWorkflowsOpen(true)}
        onOpenCommandPalette={() => setPaletteOpen(true)}
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
          />
          <SystemPanel
            agents={agents}
            selectedAgentId={selectedId}
            refreshSignal={systemRefresh}
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
        onClose={() => setWorkflowsOpen(false)}
      />

      {/* Sprint E.7: Komut Paleti (Ctrl+K) */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        agents={agents}
        onSelectAgent={setSelectedId}
        onCreateAgent={openCreateForm}
        onNewConversation={() => chat.newConversation()}
        onOpenSettings={() => {
          setSettingsInitialTab('theme');
          setSettingsOpen(true);
        }}
        onOpenWorkflows={() => setWorkflowsOpen(true)}
        onReloadAgents={reload}
      />

      {formOpen && (
        <AgentForm
          initial={editingAgent}
          onSubmit={handleSubmit}
          onCancel={() => {
            setFormOpen(false);
            setEditingAgent(null);
          }}
          submitting={formSubmitting}
          onOpenEnvSettings={() => {
            setFormOpen(false);
            setSettingsInitialTab('apikeys');
            setSettingsOpen(true);
          }}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          theme={theme}
          onChangeTheme={setTheme}
          onClose={() => setSettingsOpen(false)}
          onRequestReset={handleRequestReset}
          initialTab={settingsInitialTab}
        />
      )}

      {confirmState && (
        <ConfirmDialog
          open={confirmState.open}
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
        />
      )}
    </div>
  );
}