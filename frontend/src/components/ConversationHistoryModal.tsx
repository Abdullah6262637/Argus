import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ConversationSummary, AgentInfo } from '@/types';
import { api } from '@/api/client';
import { Icon } from './Icon';

interface ConversationHistoryModalProps {
  open: boolean;
  onClose: () => void;
  agent: AgentInfo | null;
  currentConversationId: number | null;
  onSelectConversation: (conversationId: number) => void;
  onNewConversation: () => void;
}

export function ConversationHistoryModal({
  open,
  onClose,
  agent,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationHistoryModalProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!agent) return;
    setLoading(true);
    setError(null);
    try {
      const list = await api.listAgentConversations(agent.id);
      setConversations(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sohbet geçmişi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [agent]);

  useEffect(() => {
    if (open && agent) {
      fetchConversations();
      setSearch('');
      setDeletingId(null);
    }
  }, [open, agent, fetchConversations]);

  // Escape tuşu ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        onNewConversation();
      }
    } catch (err) {
      console.error('Sohbet silinemedi:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        new Date(c.updated_at).toLocaleDateString('tr-TR').includes(q),
    );
  }, [conversations, search]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;

    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!open || !agent) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-brand-bg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2 bg-transparent">
          <div>
            <h2 className="text-base font-semibold text-brand-text">
              Geçmiş Sohbetler
            </h2>
            <p className="text-xs text-brand-mutedSoft mt-0.5">
              {agent.name} ile yapılan önceki oturumlar
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewConversation();
                onClose();
              }}
              className="h-8 px-3 rounded-lg bg-brand-accent text-brand-bg text-xs font-semibold hover:bg-brand-accentDim active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
              title="Yeni sohbet başlat"
            >
              <Icon name="add" size={15} weight={650} />
              <span>Yeni Sohbet</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt flex items-center justify-center transition-colors"
              aria-label="Kapat"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-2.5 bg-transparent">
          <div className="relative flex items-center">
            <Icon
              name="search"
              size={16}
              className="absolute left-3 text-brand-mutedSoft pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sohbet başlığında ara..."
              className="w-full bg-brand-panelAlt/60 rounded-xl pl-9 pr-8 py-2 text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 text-brand-mutedSoft hover:text-brand-text p-0.5"
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-1.5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-brand-mutedSoft">
              <Icon name="progress_activity" size={24} className="animate-spin-slow" />
              <span className="text-xs">Sohbetler yükleniyor...</span>
            </div>
          )}

          {!loading && error && (
            <div className="p-4 rounded-xl bg-brand-danger/10 text-brand-danger text-xs text-center">
              {error}
            </div>
          )}

          {!loading && !error && conversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-brand-mutedSoft gap-2.5 select-none">
              <p className="text-sm font-medium text-brand-text">
                Kayıtlı sohbet bulunmuyor
              </p>
              <p className="text-xs text-brand-mutedSoft">
                Bu ajanla henüz bir konuşma geçmişi oluşturulmamış.
              </p>
              <button
                onClick={() => {
                  onNewConversation();
                  onClose();
                }}
                className="mt-2 h-8 px-4 rounded-lg bg-brand-panelAlt hover:bg-brand-accent hover:text-brand-bg text-brand-text text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <Icon name="add" size={15} />
                <span>İlk Sohbeti Başlat</span>
              </button>
            </div>
          )}

          {!loading && !error && conversations.length > 0 && filteredConversations.length === 0 && (
            <div className="py-12 text-center text-xs text-brand-mutedSoft">
              Aramanızla eşleşen bir sohbet bulunamadı.
            </div>
          )}

          {!loading && !error && filteredConversations.map((conv) => {
            const isCurrent = currentConversationId === conv.id;
            const isDeleting = deletingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectConversation(conv.id);
                  onClose();
                }}
                className={`group relative flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-brand-accent/10'
                    : 'hover:bg-brand-panelAlt/70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      isCurrent
                        ? 'bg-brand-accent text-brand-bg'
                        : 'bg-brand-panelAlt text-brand-mutedSoft group-hover:text-brand-accent'
                    }`}
                  >
                    <Icon name="chat" size={16} weight={400} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-brand-text truncate group-hover:text-brand-accent transition-colors">
                        {conv.title || 'Başlıksız Sohbet'}
                      </h4>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-brand-accent/15 text-brand-accent flex-shrink-0">
                          Aktif
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-brand-mutedSoft font-mono">
                      <span>{formatDate(conv.updated_at)}</span>
                      {conv.message_count != null && (
                        <>
                          <span>·</span>
                          <span>{conv.message_count} mesaj</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Eylemler */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isDeleting ? (
                    <div className="flex items-center gap-1 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        className="h-7 px-2.5 rounded bg-brand-danger text-brand-bg text-[11px] font-semibold hover:opacity-90 active:scale-95 transition-all"
                      >
                        Sil
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                        className="h-7 px-2 rounded text-[11px] text-brand-mutedSoft hover:text-brand-text transition-colors"
                      >
                        Vazgeç
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(conv.id);
                      }}
                      title="Sohbeti sil"
                      className="w-7 h-7 rounded-lg text-brand-mutedSoft hover:text-brand-danger hover:bg-brand-danger/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                    >
                      <Icon name="delete" size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-transparent flex items-center justify-between text-[11px] text-brand-mutedSoft font-mono">
          <span>Toplam {conversations.length} sohbet kaydı</span>
          <span className="text-brand-mutedSoft">Seçmek için tıkla</span>
        </div>
      </div>
    </div>
  );
}
