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

  const [systemPanelTab, setSystemPanelTab] = useState<'tasks' | 'logs'>('tasks');

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

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+N, Ctrl+Shift+N, API/MCP Tabs, Themes, Sizing, Agent Select & Edit)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const isAlt = e.altKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      // Ctrl+K -> Komut paleti
      if (isMod && key === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      // Ctrl+Shift+N -> Yeni Ajan
      else if (isMod && isShift && key === 'n') {
        e.preventDefault();
        openCreateForm();
      }
      // Ctrl+N -> Yeni sohbet
      else if (isMod && !isShift && key === 'n') {
        e.preventDefault();
        chat.newConversation();
      }
      // Ctrl+Shift+U -> Ajanları yeniden yükle
      else if (isMod && isShift && key === 'u') {
        e.preventDefault();
        reload();
      }
      // Ctrl+Shift+E -> Dışa aktar
      else if (isMod && isShift && key === 'e') {
        e.preventDefault();
        if (selectedAgent) {
          handleExport(selectedAgent.id);
        }
      }
      // Ctrl+Shift+M -> Markdown Dışa Aktar
      else if (isMod && isShift && key === 'm') {
        e.preventDefault();
        if (selectedAgent) {
          handleExportChatMD(selectedAgent.id);
        }
      }
      // Ctrl+Shift+Backspace -> Sohbeti Temizle
      else if (isMod && isShift && key === 'backspace') {
        e.preventDefault();
        handleDeleteConversation();
      }
      // Ctrl+Alt+L -> Sistem/Log Panelini Göster/Gizle
      else if (isMod && isAlt && key === 'l') {
        e.preventDefault();
        setSystemPanelTab('tasks');
        toggleSystemPanel();
      }
      // Ctrl+Alt+M -> Ajan Havuzu/Yönetim Panelini Aç
      else if (isMod && isAlt && key === 'm') {
        e.preventDefault();
        openSettings('agents');
      }
      // Ctrl+Shift+D -> API Dokümantasyonu
      else if (isMod && isShift && key === 'd') {
        e.preventDefault();
        window.open('http://127.0.0.1:8000/docs', '_blank');
      }
      // Ctrl+Shift+G -> GitHub
      else if (isMod && isShift && key === 'g') {
        e.preventDefault();
        window.open('https://github.com/Abdullah6262637/Argus', '_blank');
      }
      // Ctrl+Shift+H -> Kılavuz (About)
      else if (isMod && isShift && key === 'h') {
        e.preventDefault();
        openSettings('about');
      }
      // Ctrl+Alt+A -> API Anahtarları
      else if (isMod && isAlt && key === 'a') {
        e.preventDefault();
        openSettings('apikeys');
      }
      // Ctrl+Alt+P -> Eklentiler & MCP
      else if (isMod && isAlt && key === 'p') {
        e.preventDefault();
        openSettings('plugins_mcp');
      }
      // Ctrl+Alt+R -> Reset
      else if (isMod && isAlt && key === 'r') {
        e.preventDefault();
        openSettings('reset');
      }
      // Ctrl+Alt+I -> Sürüm & Hakkında
      else if (isMod && isAlt && key === 'i') {
        e.preventDefault();
        openSettings('about');
      }
      // Ctrl+Alt+W -> Workflow Panel
      else if (isMod && isAlt && key === 'w') {
        e.preventDefault();
        openWorkflows();
      }
      // Ctrl+, -> Ayarlar (Görünüm)
      else if (isMod && key === ',') {
        e.preventDefault();
        openSettings('theme');
      }
      // Temalar: Ctrl+Shift+1 - Ctrl+Shift+4
      else if (isMod && isShift && key === '1') {
        e.preventDefault();
        setTheme('midnight');
      }
      else if (isMod && isShift && key === '2') {
        e.preventDefault();
        setTheme('sunset');
      }
      else if (isMod && isShift && key === '3') {
        e.preventDefault();
        setTheme('forest');
      }
      else if (isMod && isShift && key === '4') {
        e.preventDefault();
        setTheme('mono');
      }
      // Density: Ctrl+Shift+5 - Ctrl+Shift+7
      else if (isMod && isShift && key === '5') {
        e.preventDefault();
        setDensity('cozy');
      }
      else if (isMod && isShift && key === '6') {
        e.preventDefault();
        setDensity('compact');
      }
      else if (isMod && isShift && key === '7') {
        e.preventDefault();
        setDensity('comfortable');
      }
      // Font sizes: Ctrl+Shift+8 - Ctrl+Shift+0
      else if (isMod && isShift && key === '8') {
        e.preventDefault();
        setFontSize('sm');
      }
      else if (isMod && isShift && key === '9') {
        e.preventDefault();
        setFontSize('md');
      }
      else if (isMod && isShift && key === '0') {
        e.preventDefault();
        setFontSize('lg');
      }
      // Ajan Seçimi: Ctrl+1 - Ctrl+9
      else if (isMod && !isAlt && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const idx = Number(e.key) - 1;
        if (agents[idx]) {
          setSelectedId(agents[idx].id);
        }
      }
      // Ajan Düzenleme: Ctrl+Alt+1 - Ctrl+Alt+9
      else if (isMod && isAlt && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const idx = Number(e.key) - 1;
        if (agents[idx]) {
          openEditForm(agents[idx].id);
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [agents, selectedAgent, chat, reload, openCreateForm, openEditForm, setTheme, setDensity, setFontSize, openSettings, openWorkflows]);

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
            defaultTab={systemPanelTab}
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