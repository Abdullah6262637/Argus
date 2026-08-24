import { useEffect, useRef, useState } from 'react';
import type { AgentInfo, ChatMessage, Plan, ToolCallInfo } from '@/types';
import type { ReflectionInfo } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { Icon } from './Icon';
import { TaskTimeline } from './TaskTimeline';
import { VoiceButton } from './VoiceButton';
import { useModal } from '../context/ModalContext';
import { getModelLogo, getProviderLogo } from '../utils/modelHelper';
import { FilePreviewPanel, type AttachedFileItem } from './FilePreviewPanel';
import { api } from '@/api/client';
import {
  WorkflowIcon,
  KnowledgeIcon,
  PreviewIcon,
  TasksLogsIcon,
  PlusIcon,
  EmptyStateChatIcon,
} from './icons/HeaderIcons';
import { TokenIcon } from './icons/MessageActionIcons';

interface ChatWindowProps {
  agent: AgentInfo | null;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  liveToolCalls?: ToolCallInfo[];
  plan?: Plan | null;
  lastReflection?: ReflectionInfo | null;
  onSend: (content: string) => void;
  onNewConversation: () => void;
  onCancel?: () => void;
  agentListOpen: boolean;
  onToggleAgentList: () => void;
  systemPanelOpen: boolean;
  onToggleSystemPanel: () => void;
}

import { LiveToolCard } from './LiveToolCard';
import { ReflectionCard } from './ReflectionCard';
import { HintPill } from './HintPill';
import { ThinkingIndicator } from './ThinkingIndicator';




export function ChatWindow({
  agent,
  messages,
  loading,
  sending,
  error,
  liveToolCalls = [],
  plan = null,
  lastReflection = null,
  onSend,
  onNewConversation,
  onCancel,
  agentListOpen,
  onToggleAgentList,
  systemPanelOpen,
  onToggleSystemPanel}: ChatWindowProps) {
  const { openKG, openWorkflows } = useModal();
  const [draft, setDraft] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([]);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [previewPanelOpen, setPreviewPanelOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const removeFile = (id: string) => {
    setAttachedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRemoving: true } : item)),
    );
    setTimeout(() => {
      setAttachedFiles((prev) => prev.filter((item) => item.id !== id));
    }, 220);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !agent) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${Date.now()}-${Math.random()}`;
      const ext = file.name.includes('.') ? file.name.split('.').pop()!.toUpperCase() : 'FILE';

      let textContent = '';
      try {
        textContent = await file.text();
      } catch {
        textContent = '(İkili dosya içeriği önizlenemiyor)';
      }

      const newItem: AttachedFileItem = {
        id: fileId,
        name: file.name,
        ext,
        status: 'uploading' as const,
        content: textContent,
        size: file.size,
      };

      setAttachedFiles((prev) => [...prev, newItem]);
      setActivePreviewId(fileId);

      try {
        const result = await api.memoryIngestFile(file, agent.id);
        setAttachedFiles((prev) =>
          prev.map((item) =>
            item.id === fileId ? { ...item, status: 'done', chunks: result.chunks } : item,
          ),
        );
      } catch (err) {
        setAttachedFiles((prev) =>
          prev.map((item) =>
            item.id === fileId
              ? { ...item, status: 'error', error: err instanceof Error ? err.message : String(err) }
              : item,
          ),
        );
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalTokens = messages.reduce((acc, m) => acc + (m.tokens || 0), 0);

  useEffect(() => {
    // Smooth RAF scroll without layout thrashing
    const rafId = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: sending ? 'auto' : 'smooth' });
    });
    return () => cancelAnimationFrame(rafId);
  }, [messages, sending, liveToolCalls.length, plan?.steps.length]);

  if (!agent) {
    return (
      <main className="flex-1 flex items-center justify-center text-brand-muted bg-brand-bg animate-fade-in-up animate-stagger-2">
        <div className="text-center">
          <Icon
            name="forum"
            size={48}
            weight={300}
            className="text-brand-mutedSoft mb-3"
          />
          <p className="text-base text-brand-text">Başlamak için bir ajan seç</p>
          <p className="text-xs mt-2 text-brand-muted">
            Sol panelden bir ajan seçiniz.
          </p>
        </div>
      </main>
    );
  }

  const handleSubmit = () => {
    const content = draft.trim();
    if ((!content && attachedFiles.length === 0) || sending) return;
    onSend(content);
    setDraft('');
    setAttachedFiles([]);
  };

  const planActive = plan && plan.steps.length > 0;
  const isEmpty = !loading && messages.length === 0 && !planActive;

  const renderComposer = (isCentered: boolean) => (
    <div className={isCentered ? 'w-full max-w-xl px-2' : 'px-4 pb-3 pt-1 bg-transparent animate-composer-dock'}>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept=".pdf,.docx,.xlsx,.csv,.html,.htm,.txt,.md,.json,.png,.jpg,.jpeg,.css,.js,.ts,.tsx"
      />

      {/* Attachment Tab Chips — OUTSIDE composer form, borderless, compact & docked to top */}
      {attachedFiles.length > 0 && (
        <div className="flex items-center gap-1.5 pl-0 pr-3 overflow-x-auto scrollbar-none animate-fade-in-up -mb-px relative z-10">
          {attachedFiles.map((file, idx) => (
            <div
              key={file.id}
              onDoubleClick={() => {
                setActivePreviewId(file.id);
                setPreviewPanelOpen(true);
              }}
              title={`${file.name} (Çift tıklayarak önizle)`}
              className={`group relative h-8 bg-brand-panelAlt flex items-center gap-2 transition-all duration-200 flex-shrink-0 shadow-sm cursor-pointer select-none ${
                file.isRemoving ? 'animate-tab-dock-exit pointer-events-none' : 'animate-tab-dock-enter'
              } ${
                idx === 0
                  ? 'rounded-tl-2xl rounded-tr-xl pl-3 pr-2.5'
                  : 'rounded-t-xl px-2.5'
              }`}
            >
              {/* Extension Badge */}
              <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-bg/70 text-brand-accent">
                {file.ext}
              </span>

              {/* File Name */}
              <span className="text-xs font-medium text-brand-text truncate max-w-[140px]" title={file.name}>
                {file.name}
              </span>

              {/* Status Indicator */}
              {file.status === 'uploading' ? (
                <Icon name="progress_activity" size={11} className="animate-spin-slow text-brand-accent flex-shrink-0" />
              ) : file.status === 'done' ? (
                <Icon name="check_circle" size={11} className="text-brand-success flex-shrink-0" filled />
              ) : (
                <span className="text-[10px] text-brand-danger font-bold flex-shrink-0" title={file.error}>!</span>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="w-4 h-4 rounded flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-bg/60 transition-all flex-shrink-0 ml-0.5"
                title="Kaldır"
              >
                <Icon name="close" size={11} weight={600} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Composer Form Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className={`flex items-end gap-1 bg-brand-panelAlt/60 hover:bg-brand-panelAlt focus-within:bg-brand-panelAlt pl-2 pr-1.5 py-1.5 transition-all duration-200 shadow-lg ${
          attachedFiles.length > 0 ? 'rounded-b-2xl rounded-tr-2xl rounded-tl-none' : 'rounded-2xl'
        }`}
      >
        {/* Dosya Yükleme (sol) */}
        <div className="pb-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Dosya yükle (PDF, DOCX, TXT vb.)"
            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-brand-mutedSoft hover:text-brand-accent hover:bg-brand-panelAlt transition-all active:scale-95"
          >
            <Icon name="attach_file" size={18} weight={500} />
          </button>
        </div>

        {/* Voice (sol) */}
        <div className="pb-1 flex-shrink-0">
          <VoiceButton
            disabled={sending}
            onTranscribed={(text) =>
              setDraft((prev) => (prev ? prev + ' ' + text : text))
            }
          />
        </div>

        {/* Textarea — auto-grow */}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          rows={1}
          placeholder={`${agent.name} ajanına mesaj yaz...`}
          className="flex-1 resize-none bg-transparent text-sm text-brand-text placeholder:text-brand-mutedSoft focus:outline-none py-1.5 leading-relaxed max-h-32 min-h-[24px]"
          style={{
            height: 'auto',
            minHeight: '24px'}}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 128) + 'px';
          }}
        />

        {/* Karakter sayacı (sadece yazıyorken) */}
        {draft.length > 0 && !sending && (
          <span className="pb-2 text-[10px] font-mono text-brand-mutedSoft tabular-nums select-none flex-shrink-0">
            {draft.length}
          </span>
        )}

        {/* Gönder / İptal — kompakt yuvarlak */}
        {sending && onCancel ? (
          <button
            onClick={onCancel}
            title="Çalışmayı iptal et"
            className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-brand-danger text-brand-bg hover:opacity-90 active:scale-90 transition-all flex-shrink-0"
            aria-label="İptal"
          >
            <Icon name="stop" size={16} weight={650} filled />
          </button>
        ) : (
          <button
            disabled={sending || (!draft.trim() && attachedFiles.length === 0)}
            onClick={handleSubmit}
            title="Mesajı gönder (Enter)"
            className={`h-8 w-8 inline-flex items-center justify-center rounded-lg transition-all flex-shrink-0 ${
              draft.trim() || attachedFiles.length > 0
                ? 'bg-brand-accent text-brand-bg hover:bg-brand-accentDim active:scale-90 shadow-sm'
                : 'bg-brand-panelAlt text-brand-mutedSoft cursor-not-allowed'
            }`}
            aria-label="Gönder"
          >
            <Icon name="arrow_upward" size={17} weight={700} />
          </button>
        )}
      </form>

      {/* Yardım barı — çerçevesiz, minimal & simetrik kısayol kapsülleri */}
      <div className="flex items-center justify-between mt-2 px-1 select-none">
        <div className="flex items-center gap-2.5">
          <HintPill keys={['Enter']} label="gönder" />
          <span className="text-brand-mutedSoft/40 text-[10px]">·</span>
          <HintPill keys={['Shift', 'Enter']} label="yeni satır" />
          <span className="hidden md:inline-block text-brand-mutedSoft/40 text-[10px]">·</span>
          <span className="hidden md:inline-flex">
            <HintPill keys={['Ctrl', 'K']} label="komut paleti" />
          </span>
        </div>
        {sending && (
          <span className="text-[10.5px] font-mono tracking-tight text-brand-accent font-medium select-none animate-fade-in flex items-center gap-1.5">
            <Icon name="progress_activity" size={11} className="animate-spin-slow" />
            Yanıt üretiliyor...
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex overflow-hidden min-w-0 bg-brand-bg relative">
      <main className="flex-1 flex flex-col min-w-0 bg-brand-bg animate-fade-in-up animate-stagger-2">
      {/* Üst başlık — kurumsal sade conversation header */}
      <header className="h-11 px-3 flex items-center justify-between bg-brand-panel flex-shrink-0">
        {/* Sol: Ajan kimliği */}
        <div className="min-w-0 flex items-center gap-2.5 flex-1">
          {!agentListOpen && (
            <button
              onClick={onToggleAgentList}
              title="Ajanlar Listesini Göster"
              className="w-7 h-7 rounded-md inline-flex items-center justify-center text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all flex-shrink-0 animate-fade-in"
            >
              <Icon name="menu" size={16} />
            </button>
          )}

          {/* Model Logo Avatar Badge */}
          <div className="w-7 h-7 rounded-lg bg-brand-panelAlt/80 flex items-center justify-center flex-shrink-0">
            <img
              src={getModelLogo(agent.model, agent.provider)}
              alt=""
              className="w-4 h-4 object-contain"
            />
          </div>

          {/* Bilgi kolonu */}
          <div className="min-w-0 flex-1">
            {/* Üst satır: Ajan adı ve sade rolü */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-brand-text truncate leading-none">
                {agent.name}
              </span>
              {agent.role && (
                <span className="hidden md:inline text-[10.5px] text-brand-mutedSoft font-normal truncate leading-none">
                  — {agent.role}
                </span>
              )}
            </div>

            {/* Alt satır: Model Pill + Provider Status + Token Counter */}
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              {/* Model Pill */}
              <span
                className="inline-flex items-center px-1.5 py-0.2 rounded bg-brand-panelAlt/60 text-[9.5px] font-mono text-brand-textSoft min-w-0 leading-tight"
                title={agent.model}
              >
                <span className="truncate">{agent.model}</span>
              </span>

              {/* Provider Logo + Name (Yeşil nokta kaldırıldı, resmi logo eklendi) */}
              <span
                className="hidden sm:inline-flex items-center gap-1 text-[9.5px] font-mono text-brand-mutedSoft capitalize flex-shrink-0 leading-tight"
                title={`${agent.provider} sağlayıcısı`}
              >
                <img
                  src={getProviderLogo(agent.provider)}
                  alt=""
                  className="w-3 h-3 object-contain flex-shrink-0"
                />
                <span>{agent.provider}</span>
              </span>

              {/* Token sayacı */}
              <span
                className="inline-flex items-center gap-1 text-[9.5px] font-mono text-brand-mutedSoft tabular-nums flex-shrink-0 leading-tight"
                title={`Bu sohbette toplam ${totalTokens.toLocaleString()} token harcandı`}
              >
                <span className="text-brand-mutedSoft/40">·</span>
                <TokenIcon size={10} className="text-brand-accent/70 flex-shrink-0" />
                <span>{totalTokens.toLocaleString()} tok</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sağ: Toolbar + birincil aksiyon */}
        {/* Sağ: Toolbar + birincil aksiyon */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* İkon butonları (çerçevesiz, minimalist) */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => openWorkflows()}
              title="Workflow Çalıştır"
              className="w-7 h-7 rounded-md flex items-center justify-center text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-200 active:scale-95"
            >
              <WorkflowIcon size={15} />
            </button>
            <button
              onClick={() => agent && openKG(agent.id)}
              title="Knowledge Graph"
              className="w-7 h-7 rounded-md flex items-center justify-center text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all duration-200 active:scale-95"
            >
              <KnowledgeIcon size={15} />
            </button>
          </div>

          {/* Birincil aksiyon: Yeni Sohbet (Arka plansız, minimalist, temaya uyumlu) */}
          <button
            onClick={onNewConversation}
            className="h-7 px-2 rounded-md text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt active:scale-95 transition-all flex items-center gap-1.5 text-[11.5px] font-semibold select-none"
            title="Yeni sohbet başlat"
          >
            <PlusIcon size={13} />
            <span className="hidden md:inline">Yeni Sohbet</span>
          </button>

          {!previewPanelOpen && (
            <button
              onClick={() => setPreviewPanelOpen(true)}
              title="Dosya Önizleme Panelini Göster"
              className="w-7 h-7 rounded-md inline-flex items-center justify-center text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all ml-0.5 flex-shrink-0 animate-fade-in"
            >
              <PreviewIcon size={15} />
            </button>
          )}

          {!systemPanelOpen && (
            <button
              onClick={onToggleSystemPanel}
              title="Görevler & Loglar Panelini Göster"
              className="w-7 h-7 rounded-md inline-flex items-center justify-center text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all ml-0.5 flex-shrink-0 animate-fade-in"
            >
              <TasksLogsIcon size={15} />
            </button>
          )}
        </div>
      </header>

      {/* Mesaj alanı & İlk Giriş Durumu */}
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center p-4 select-none">
          <div className="w-full max-w-xl flex flex-col items-center -mt-12 gap-5 animate-fade-in-up">
            <div className="flex flex-col items-center gap-2 text-center">
              <EmptyStateChatIcon
                size={30}
                className="text-brand-textSoft/50 hover:text-brand-accent transition-colors duration-300"
              />
              <h2 className="text-xs font-medium text-brand-textSoft tracking-tight">
                İlk mesajını gönder...
              </h2>
            </div>
            {renderComposer(true)}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="flex items-center justify-center text-sm text-brand-muted gap-2 py-4">
              <Icon
                name="progress_activity"
                size={16}
                className="animate-spin-slow"
              />
              <span>Yükleniyor...</span>
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} agentName={agent.name} />
          ))}

          {/* Çok Adımlı Plan / Düşünce Akışı (Mesaj akışı içinde, kompakt ve ekranı kaplamayan kart) */}
          {planActive && (
            <div className="flex justify-start my-2 animate-fade-in-up">
              <div className="max-w-[85%] md:max-w-2xl w-full">
                <TaskTimeline plan={plan} />
              </div>
            </div>
          )}

          {/* Canlı tool akışı — Çerçevesiz, minimalist kart */}
          {sending && liveToolCalls.length > 0 && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="max-w-[85%] md:max-w-2xl w-full">
                <div className="rounded-2xl bg-brand-panelAlt/30 backdrop-blur-md p-2.5 space-y-1.5">
                  {/* Kompakt başlık */}
                  <div className="flex items-center gap-2 px-1 py-0.5">
                    <div className="flex items-center justify-center w-5 h-5 rounded-md bg-brand-accent/10 text-brand-accent">
                      <Icon
                        name="build"
                        size={11}
                        weight={600}
                      />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-mutedSoft">
                      Araçlar
                    </span>
                    <span className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded bg-brand-accent/10 text-[9.5px] font-mono font-medium text-brand-accent tabular-nums">
                      {liveToolCalls.length}
                    </span>
                  </div>
                  {/* Tool satırları */}
                  <div className="space-y-1">
                    {liveToolCalls.map((tc, i) => (
                      <LiveToolCard key={tc.id} tc={tc} index={i} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reflection kartı */}
          {sending && lastReflection && (
            <div className="flex justify-start">
              <div className="max-w-[85%] w-full">
                <ReflectionCard reflection={lastReflection} />
              </div>
            </div>
          )}

          {/* Asistan Yanıt Hazırlıyor / Düşünüyor — Minimalist & Çizgisiz Gösterge */}
          {sending && (
            <ThinkingIndicator liveToolCalls={liveToolCalls} plan={plan} />
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Hata bandı */}
      {error && (
        <div className="mx-4 mb-2 p-2.5 text-xs rounded-lg bg-brand-danger/10 text-brand-danger flex items-start gap-2 animate-slide-in-right">
          <Icon
            name="error"
            size={15}
            weight={500}
            filled
            className="flex-shrink-0 mt-px"
          />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Mesaj varken altta sabit composer */}
      {!isEmpty && renderComposer(false)}
    </main>

    {/* Right-side File Preview Drawer Panel */}
    <FilePreviewPanel
      attachedFiles={attachedFiles}
      activeFileId={activePreviewId}
      onSelectFile={(id) => setActivePreviewId(id)}
      isOpen={previewPanelOpen}
      onClose={() => setPreviewPanelOpen(false)}
    />
    </div>
  );
}