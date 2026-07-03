import { useMemo, useState } from 'react';
import type { AgentInfo } from '@/types';
import { ContextMenu, type ContextMenuEntry } from './ContextMenu';
import { Icon } from './Icon';

interface AgentListProps {
  agents: AgentInfo[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onExport: (id: string) => void;
  onNewConversation: (id: string) => void;
  loading: boolean;
  error: string | null;
}

interface ContextState {
  x: number;
  y: number;
  agentId: string;
}

export function AgentList({
  agents,
  selectedId,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onDuplicate,
  onExport,
  onNewConversation,
  loading,
  error}: AgentListProps) {
  const [ctx, setCtx] = useState<ContextState | null>(null);
  const [search, setSearch] = useState('');

  const [isOpen, setIsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('argus_agent_list_open');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const togglePanel = () => {
    setIsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('argus_agent_list_open', String(next));
      } catch {}
      return next;
    });
  };

  const filteredAgents = useMemo(() => {
    if (!search.trim()) return agents;
    const q = search.toLowerCase();
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.role?.toLowerCase().includes(q) ||
        a.model?.toLowerCase().includes(q) ||
        a.provider?.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q)),
    );
  }, [agents, search]);

  const openContext = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    onSelect(id);
    setCtx({ x: e.clientX, y: e.clientY, agentId: id });
  };

  const menuItemsFor = (agentId: string): ContextMenuEntry[] => [
    {
      id: 'edit',
      label: 'Düzenle',
      icon: <Icon name="edit" size={16} />,
      onClick: () => onEdit(agentId)},
    {
      id: 'new-conv',
      label: 'Yeni Sohbet',
      icon: <Icon name="add_comment" size={16} />,
      onClick: () => onNewConversation(agentId)},
    { id: 's1', separator: true },
    {
      id: 'duplicate',
      label: 'Kopyala',
      icon: <Icon name="content_copy" size={16} />,
      onClick: () => onDuplicate(agentId)},
    {
      id: 'export',
      label: 'JSON Dışa Aktar',
      icon: <Icon name="download" size={16} />,
      onClick: () => onExport(agentId)},
    { id: 's2', separator: true },
    {
      id: 'delete',
      label: 'Sil',
      icon: <Icon name="delete" size={16} />,
      danger: true,
      onClick: () => onDelete(agentId)}];

  return (
    <aside className={`relative h-full flex-shrink-0 border-r border-brand-border bg-brand-panel flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'w-72' : 'w-0 !border-r-0'}`}>
      <div className="w-72 h-full flex flex-col overflow-hidden">
      {/* ============ Üst Başlık ============ */}
      <header className="px-3 py-3 border-b border-brand-border space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-[12px] font-semibold text-brand-text leading-tight">
              Ajanlar
            </h2>
            <p className="text-[10px] text-brand-mutedSoft leading-tight font-mono tabular-nums mt-0.5">
              {filteredAgents.length}
              {search && agents.length !== filteredAgents.length && (
                <span className="text-brand-mutedSoft">
                  /{agents.length}
                </span>
              )}
              <span className="ml-1 text-brand-mutedSoft">
                {filteredAgents.length === 1 ? 'ajan' : 'ajan'}
              </span>
            </p>
          </div>
          <button
            onClick={onCreate}
            title="Yeni ajan oluştur"
            className="w-7 h-7 rounded-md inline-flex items-center justify-center text-brand-textSoft hover:text-brand-accent hover:bg-brand-accent/10 transition-all active:scale-90"
          >
            <Icon name="add" size={17} weight={650} />
          </button>
        </div>

        {/* Arama */}
        {agents.length > 0 && (
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ajan ara..."
              className="peer w-full h-8 bg-brand-bg border border-brand-border rounded-md pl-8 pr-7 text-[12px] text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 transition-all duration-200"
            />
            <Icon
              name="search"
              size={14}
              weight={500}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-mutedSoft peer-focus:text-brand-accent pointer-events-none transition-colors duration-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md inline-flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all"
                title="Temizle"
              >
                <Icon name="close" size={12} weight={550} />
              </button>
            )}
          </div>
        )}
      </header>

      {/* ============ Liste ============ */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-xs text-brand-muted py-8">
            <Icon
              name="progress_activity"
              size={14}
              className="animate-spin-slow"
            />
            <span>Yükleniyor...</span>
          </div>
        )}
        {error && (
          <div className="m-1.5 p-2.5 text-[11px] text-brand-danger bg-brand-danger/5 rounded-md border border-brand-danger/30 flex items-start gap-1.5">
            <Icon
              name="error"
              size={13}
              weight={500}
              filled
              className="flex-shrink-0 mt-px"
            />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}
        {!loading && !error && filteredAgents.length === 0 && agents.length > 0 && (
          <div className="flex flex-col items-center justify-center text-center py-10 gap-2">
            <Icon
              name="search_off"
              size={28}
              weight={300}
              className="text-brand-mutedSoft"
            />
            <span className="text-[11px] text-brand-mutedSoft">
              Eşleşen ajan yok
            </span>
            <button
              onClick={() => setSearch('')}
              className="text-[10px] text-brand-accent hover:underline"
            >
              Aramayı temizle
            </button>
          </div>
        )}
        {!loading && agents.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center text-center py-12 gap-2">
            <Icon
              name="person_add"
              size={32}
              weight={300}
              className="text-brand-mutedSoft"
            />
            <span className="text-xs text-brand-muted">Ajan yok</span>
            <button
              onClick={onCreate}
              className="text-[10.5px] text-brand-accent hover:underline inline-flex items-center gap-1"
            >
              <Icon name="add" size={11} weight={600} />
              İlk ajanı oluştur
            </button>
          </div>
        )}

        {/* Ajan Kartları */}
        <div className="space-y-0.5">
          {filteredAgents.map((a) => (
            <AgentCard
              key={a.id}
              agent={a}
              active={a.id === selectedId}
              onSelect={() => onSelect(a.id)}
              onContextMenu={(e) => openContext(e, a.id)}
            />
          ))}
        </div>
      </div>

      {/* Alt ipucu */}
      <div className="px-3 py-2 border-t border-brand-border text-[9.5px] text-brand-mutedSoft inline-flex items-center justify-center gap-1.5">
        <Icon name="touch_app" size={11} weight={500} />
        <span>Sağ tıkla ile seçenekler</span>
      </div>

      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          items={menuItemsFor(ctx.agentId)}
          onClose={() => setCtx(null)}
        />
      )}
      </div>

      {/* Floating Toggle Handle Button */}
      <button
        onClick={togglePanel}
        title={isOpen ? 'Ajanları Gizle' : 'Ajanları Göster'}
        className="absolute top-1/2 -translate-y-1/2 -right-3 z-40 w-6 h-12 rounded-r-md border border-l-0 border-brand-border bg-brand-panel text-brand-mutedSoft hover:text-brand-accent flex items-center justify-center transition-all shadow-md group hover:bg-brand-panelAlt"
      >
        <Icon 
          name={isOpen ? 'chevron_left' : 'chevron_right'} 
          size={14} 
          className="transition-transform duration-300 group-hover:scale-110" 
        />
      </button>
    </aside>
  );
}

// ============================================================
// Ajan Kartı — kurumsal sade
// ============================================================

function AgentCard({
  agent,
  active,
  onSelect,
  onContextMenu}: {
  agent: AgentInfo;
  active: boolean;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const hasMedia =
    agent.media_image || agent.media_video || agent.media_audio;
  const hasTags = agent.tags && agent.tags.length > 0;

  return (
    <button
      onClick={onSelect}
      onContextMenu={onContextMenu}
      title="Sağ tıkla ile seçenekler"
      className={`group w-full text-left px-3 py-2.5 rounded-md transition-all duration-150 relative animate-card-in ${
        active
          ? 'bg-brand-accent/8'
          : 'hover:bg-brand-panelAlt/60'
      }`}
    >
      {/* Active sol indicator — Linear/Slack stili */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r transition-all ${
          active ? 'bg-brand-accent' : 'bg-transparent group-hover:bg-brand-border'
        }`}
      />

      {/* Satır 1: Ad (sol) + Provider rozet (sağ) */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[13px] font-semibold truncate leading-none tracking-tight ${
            active ? 'text-brand-text' : 'text-brand-text'
          }`}
        >
          {agent.name}
        </span>
        <span
          className={`text-[9px] font-mono font-bold uppercase tracking-wider flex-shrink-0 px-1.5 h-[18px] inline-flex items-center rounded-[4px] ${
            active
              ? 'bg-brand-accent/15 text-brand-accent'
              : 'bg-brand-panelAlt text-brand-mutedSoft'
          }`}
        >
          {agent.provider}
        </span>
      </div>

      {/* Satır 2: Rol veya model (font-mono ile model) */}
      <div className="text-[11px] text-brand-mutedSoft truncate leading-tight mt-1">
        {agent.role || (
          <code className="font-mono">{agent.model}</code>
        )}
      </div>

      {/* Satır 3: Model (sadece rol varsa) — diskret mono */}
      {agent.role && (
        <div className="text-[10px] font-mono text-brand-mutedSoft/80 truncate leading-tight mt-0.5">
          {agent.model}
        </div>
      )}

      {/* Alt meta: Tag'ler + Media + Auth ikonları (tek satır) */}
      {(hasMedia || hasTags || agent.has_base_url || agent.has_api_key) && (
        <div className="flex items-center gap-1 mt-2">
          {/* Tag'ler — küçük diskret rozet */}
          {agent.tags?.slice(0, 2).map((t) => (
            <span
              key={t}
              className="text-[9px] font-medium px-1.5 h-[15px] inline-flex items-center rounded-[3px] bg-brand-panelAlt text-brand-mutedSoft tracking-tight"
            >
              {t}
            </span>
          ))}
          {agent.tags && agent.tags.length > 2 && (
            <span className="text-[9px] font-mono text-brand-mutedSoft">
              +{agent.tags.length - 2}
            </span>
          )}

          {/* Sağ taraf: media + auth ikonları */}
          <div className="ml-auto flex items-center gap-1">
            {agent.media_image && <MediaBadge kind="image" />}
            {agent.media_video && <MediaBadge kind="video" />}
            {agent.media_audio && <MediaBadge kind="audio" />}
            {agent.has_base_url && (
              <Icon
                name="link"
                size={10}
                weight={500}
                className="text-brand-mutedSoft/70"
                title="Özel base URL"
              />
            )}
            {agent.has_api_key && (
              <Icon
                name="key"
                size={10}
                weight={500}
                className="text-brand-mutedSoft/70"
                title="Kendi API key"
              />
            )}
          </div>
        </div>
      )}
    </button>
  );
}

function MediaBadge({
  kind}: {
  kind: 'image' | 'video' | 'audio';
}) {
  const config: Record<string, { icon: string; label: string }> = {
    image: { icon: 'image', label: 'Görsel' },
    video: { icon: 'movie', label: 'Video' },
    audio: { icon: 'graphic_eq', label: 'Ses' }};
  const c = config[kind];
  return (
    <Icon
      name={c.icon}
      size={11}
      weight={500}
      className="text-brand-mutedSoft/70"
      title={c.label}
    />
  );
}