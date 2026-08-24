import { useMemo, useState } from 'react';
import type { AgentInfo } from '@/types';
import { ContextMenu, type ContextMenuEntry } from './ContextMenu';
import { Icon } from './Icon';
import { getModelLogo } from '../utils/modelHelper';
import {
  MenuNewChatIcon,
  MenuHistoryIcon,
  MenuEditIcon,
  MenuToggleIcon,
  MenuTestConnectionIcon,
  MenuExportMdIcon,
  MenuClearHistoryIcon,
  MenuDuplicateIcon,
  MenuExportJsonIcon,
  MenuDeleteIcon,
} from './icons/AgentMenuIcons';

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
  isOpen: boolean;
  onToggle: () => void;
  onToggleActive?: (id: string) => void;
  onTestConnection?: (id: string) => void;
  onClearConversations?: (id: string) => void;
  onExportChatMD?: (id: string) => void;
  onShowHistory?: (id: string) => void;
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
  error,
  isOpen,
  onToggle,
  onToggleActive,
  onTestConnection,
  onClearConversations,
  onExportChatMD,
  onShowHistory}: AgentListProps) {
  const [ctx, setCtx] = useState<ContextState | null>(null);
  const [search, setSearch] = useState('');

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

  const menuItemsFor = (agentId: string): ContextMenuEntry[] => {
    const agent = agents.find((a) => a.id === agentId);
    return [
      {
        id: 'new-conv',
        label: 'Yeni Sohbet Başlat',
        icon: <MenuNewChatIcon size={15} />,
        onClick: () => onNewConversation(agentId)
      },
      {
        id: 'history',
        label: 'Geçmiş Sohbetler',
        icon: <MenuHistoryIcon size={15} />,
        onClick: () => onShowHistory?.(agentId)
      },
      {
        id: 'edit',
        label: 'Ajanı Düzenle',
        icon: <MenuEditIcon size={15} />,
        onClick: () => onEdit(agentId)
      },
      {
        id: 'toggle-active',
        label: agent?.is_active ? 'Ajanı Pasifleştir' : 'Ajanı Aktifleştir',
        icon: (
          <MenuToggleIcon
            active={!!agent?.is_active}
            size={15}
            className={agent?.is_active ? 'text-brand-accent' : 'text-brand-muted'}
          />
        ),
        onClick: () => onToggleActive?.(agentId)
      },
      { id: 's1', separator: true },
      {
        id: 'test-conn',
        label: 'Bağlantıyı Test Et',
        icon: <MenuTestConnectionIcon size={15} />,
        onClick: () => onTestConnection?.(agentId)
      },
      { id: 's2', separator: true },
      {
        id: 'export-md',
        label: 'Sohbeti Markdown (.md) Olarak İndir',
        icon: <MenuExportMdIcon size={15} />,
        onClick: () => onExportChatMD?.(agentId)
      },
      {
        id: 'clear-conv',
        label: 'Sohbet Geçmişini Temizle',
        icon: <MenuClearHistoryIcon size={15} />,
        onClick: () => onClearConversations?.(agentId)
      },
      {
        id: 'duplicate',
        label: 'Ajanı Kopyala (Çoğalt)',
        icon: <MenuDuplicateIcon size={15} />,
        onClick: () => onDuplicate(agentId)
      },
      {
        id: 'export',
        label: 'JSON Olarak Dışa Aktar',
        icon: <MenuExportJsonIcon size={15} />,
        onClick: () => onExport(agentId)
      },
      { id: 's3', separator: true },
      {
        id: 'delete',
        label: 'Ajanı Sistemden Sil',
        icon: <MenuDeleteIcon size={15} />,
        danger: true,
        onClick: () => onDelete(agentId)
      }
    ];
  };

  return (
    <aside className={`relative h-full flex-shrink-0 bg-brand-panel flex flex-col transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${isOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'}`}>
      <div className={`w-72 h-full flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : '-translate-x-8'}`}>
      {/* ============ Üst Başlık ============ */}
      <header className="px-3 py-3 space-y-2.5">
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
          <div className="flex items-center gap-1">
            <button
              onClick={onCreate}
              title="Yeni ajan oluştur"
              className="w-7 h-7 rounded-md inline-flex items-center justify-center text-brand-textSoft hover:text-brand-accent hover:bg-brand-accent/10 transition-all active:scale-90"
            >
              <Icon name="add" size={17} weight={650} />
            </button>
            <button
              onClick={onToggle}
              title="Ajanlar Panelini Kapat"
              className="w-7 h-7 rounded-md inline-flex items-center justify-center text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all"
            >
              <Icon name="menu_open" size={16} />
            </button>
          </div>
        </div>

        {/* Arama — Komut ara ile %100 aynı koyu tasarım */}
        {agents.length > 0 && (
          <div className="relative flex items-center h-9 px-2.5 rounded-xl bg-brand-bg/60 text-brand-mutedSoft hover:bg-brand-panelAlt/80 transition-all duration-200 focus-within:bg-brand-panelAlt">
            <Icon
              name="search"
              size={15}
              weight={550}
              className="text-brand-mutedSoft flex-shrink-0 pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ajan ara..."
              className="w-full h-full bg-transparent border-none outline-none pl-2 pr-4 text-xs text-brand-text placeholder:text-brand-mutedSoft focus:ring-0 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="w-4 h-4 rounded inline-flex items-center justify-center text-brand-mutedSoft hover:text-brand-text transition-all flex-shrink-0"
                title="Temizle"
              >
                <Icon name="close" size={13} weight={550} />
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
          <div className="m-1.5 p-2.5 text-[11px] text-brand-danger bg-brand-danger/5 rounded-md flex items-start gap-1.5">
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
            <div
              key={a.id}
              className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top overflow-hidden ${
                a.is_active
                  ? 'max-h-[120px] opacity-100 scale-100 py-0.5 pointer-events-auto'
                  : 'max-h-0 opacity-0 scale-90 py-0 my-0 border-0 pointer-events-none'
              }`}
            >
              <AgentCard
                agent={a}
                active={a.id === selectedId}
                onSelect={() => onSelect(a.id)}
                onContextMenu={(e) => openContext(e, a.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Alt ipucu */}
      <div className="px-3 py-2 text-[9.5px] text-brand-mutedSoft inline-flex items-center justify-center gap-1.5">
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

      {/* Satır 1: Logo + Ad (sol) + Provider rozet (sağ) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <img
            src={getModelLogo(agent.model, agent.provider)}
            alt=""
            className="w-4 h-4 object-contain flex-shrink-0"
          />
          <span
            className={`text-[13px] font-semibold truncate leading-none tracking-tight ${
              active ? 'text-brand-text' : 'text-brand-text'
            }`}
          >
            {agent.name}
          </span>
        </div>
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

      {/* Satır 2: Rol (varsa) */}
      {agent.role && (
        <div className="text-[11px] text-brand-mutedSoft truncate leading-tight mt-1">
          {agent.role}
        </div>
      )}

      {/* Satır 3: Model adı */}
      <div className="text-[10px] font-mono text-brand-mutedSoft/80 truncate leading-tight mt-0.5">
        {agent.model}
      </div>

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