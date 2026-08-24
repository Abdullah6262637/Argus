import React, { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { Header } from './components/Header';
import { AgentList } from './components/AgentList';
import { ChatWindow } from './components/ChatWindow';
import { SystemPanel } from './components/SystemPanel';
import { AgentForm } from './components/AgentForm';
import { EmptyState } from './components/EmptyState';
import { ConfirmDialog } from './components/ConfirmDialog';
import { SplashScreen } from './components/SplashScreen';
import { ResetScreen } from './components/ResetScreen';
import { ApprovalDialog } from './components/ApprovalDialog';
import { ConversationHistoryModal } from './components/ConversationHistoryModal';
import KnowledgeGraphModal from './components/KnowledgeGraphModal';

import { useAgents } from './hooks/useAgents';
import { useChat } from './hooks/useChat';
import { useWebSocket } from './hooks/useWebSocket';
import { useTheme } from './hooks/useTheme';
import { useAppearance } from './hooks/useAppearance';
import { useApprovals } from './hooks/useApprovals';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useModal } from './context/ModalContext';
import type { WSMessage } from './types';

// The 4 new hooks
import { useLayoutState } from './hooks/useLayoutState';
import { useAgentActions } from './hooks/useAgentActions';
import { useSystemSetup } from './hooks/useSystemSetup';
import { useChatActions } from './hooks/useChatActions';

// React.lazy components
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));
const WorkflowsModal = React.lazy(() => import('./components/WorkflowsModal'));
const CommandPalette = React.lazy(() => import('./components/CommandPalette'));
const AgentInspectorModal = React.lazy(() => import('./components/AgentInspectorModal'));
const SetupWizard = React.lazy(() => import('./components/SetupWizard'));

export default function App() {
  const {
    settingsOpen,
    settingsTab,
    openSettings,
    closeSettings,
    workflowsOpen,
    openWorkflows,
    closeWorkflows,
    kgOpen,
    kgAgentId,
    closeKG,
    paletteOpen,
    setPaletteOpen,
    openPalette,
    closePalette,
    inspectorOpen,
    inspectorAgentId,
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

  const {
    agentListOpen,
    systemPanelOpen,
    toggleAgentList,
    toggleSystemPanel,
  } = useLayoutState();

  const { theme, setTheme } = useTheme();
  // Sprint E.6: density + font size
  const { setDensity, setFontSize } = useAppearance();

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
      chat.onToolEvent(msg as any);
    } else if (
      msg.type === 'approval_required' ||
      msg.type === 'approval_decided'
    ) {
      approvals.onWSEvent(msg);
    }
  }, [chat, approvals]);

  const ws = useWebSocket({ onMessage: handleWSMessage });

  const {
    formSubmitting,
    openCreateForm,
    openEditForm,
    handleSubmit,
    handleDelete,
    handleDuplicate,
    handleExport,
    handleToggleAgentActive,
    handleTestConnection,
  } = useAgentActions({
    agents,
    selectedId,
    setSelectedId,
    reload,
    editingAgent,
    openForm,
    closeForm,
    openConfirm,
    closeConfirm,
  });

  const {
    setupRequired,
    setSetupRequired,
    showSplash,
    setShowSplash,
    showReset,
    setShowReset,
    deletedSize,
    setDeletedSize,
    typedText,
    setTypedText,
    handleRequestReset,
  } = useSystemSetup({
    closeSettings,
    openConfirm,
    closeConfirm,
    reload,
    setSelectedId,
  });

  const {
    handleDeleteConversation,
    handleExportChatMD,
    handleClearConversations,
    handleNewConversation,
  } = useChatActions({
    chat,
    agents,
    selectedId,
    selectedAgent,
    setSelectedId,
    openConfirm,
    closeConfirm,
  });

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyAgentId, setHistoryAgentId] = useState<string | null>(null);

  const handleShowHistory = useCallback((agentId: string) => {
    setSelectedId(agentId);
    setHistoryAgentId(agentId);
    setHistoryModalOpen(true);
  }, [setSelectedId]);

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
  }, [agents, selectedAgent, chat.newConversation, reload, openCreateForm, openEditForm, setTheme, setDensity, setFontSize, openSettings, openWorkflows]);

  const hasAgents = agents.length > 0;

  // --- Akıllı Kurulum Sihirbazı ---
  // Reset screen overlay
  if (showReset) {
    return (
      <ResetScreen
        deletedSizeMb={deletedSize}
        onDone={() => {
          setShowReset(false);
          setDeletedSize(null);
          setSetupRequired(true); // Show setup wizard after reset
        }}
      />
    );
  }

  // Splash screen overlay (after setup finish)
  if (showSplash) {
    return (
      <SplashScreen
        onDone={() => {
          setShowSplash(false);
        }}
      />
    );
  }

  if (setupRequired === true) {
    return (
      <Suspense fallback={null}>
        <SetupWizard
          theme={theme}
          onChangeTheme={setTheme}
          onFinished={() => {
            setSetupRequired(false);
            reload();
            setShowSplash(true); // Show splash after setup completes
          }}
        />
      </Suspense>
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
            onTestConnection={handleTestConnection}
            onClearConversations={handleClearConversations}
            onExportChatMD={handleExportChatMD}
            onShowHistory={handleShowHistory}
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
      <Suspense fallback={null}>
        <WorkflowsModal
          open={workflowsOpen}
          onClose={closeWorkflows}
        />
      </Suspense>

      {/* Knowledge Graph Modal — Tüm Ekranı Kaplayan Üst Düzey Modal */}
      <KnowledgeGraphModal
        open={kgOpen}
        onClose={closeKG}
        agentId={kgAgentId || selectedId}
      />

      {/* Sprint E.7: Komut Paleti (Ctrl+K) */}
      <Suspense fallback={null}>
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
      </Suspense>

      {formOpen && (
        <AgentForm
          initial={editingAgent}
          onSubmit={handleSubmit}
          onCancel={closeForm}
          submitting={formSubmitting}
        />
      )}

      {settingsOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      <Suspense fallback={null}>
        <AgentInspectorModal
          open={inspectorOpen}
          onClose={closeInspector}
          agentId={inspectorAgentId}
          agents={agents}
        />
      </Suspense>

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

      <ConversationHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        agent={agents.find((a) => a.id === historyAgentId) || selectedAgent}
        currentConversationId={chat.conversationId}
        onSelectConversation={(convId) => {
          chat.loadConversation(convId);
        }}
        onNewConversation={() => {
          chat.newConversation();
        }}
      />
    </div>
  );
}