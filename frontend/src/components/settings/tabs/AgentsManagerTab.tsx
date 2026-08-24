import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import type { AgentInfo } from '@/types';
import { Icon } from '../../Icon';
import { getModelLogo } from '../../../utils/modelHelper';

export function AgentsManagerTab({
  onEditAgent,
  onDeleteAgent,
  onDuplicateAgent,
  onReloadAgents
}: {
  onEditAgent?: (id: string) => void;
  onDeleteAgent?: (id: string) => void;
  onDuplicateAgent?: (id: string) => void;
  onReloadAgents?: () => void;
}) {
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAgents = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const list = await api.listAgents(true); // includeInactive = true
      setAllAgents(list);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    // 1. Optimistic UI update: Toggle state instantly in the UI with no flash
    setAllAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_active: !currentStatus } : a))
    );

    try {
      await api.updateAgent(id, { is_active: !currentStatus });
      await loadAgents(true); // Silent reload behind the scenes
      onReloadAgents?.(); // Notify App.tsx to reload active agents list
    } catch (err) {
      console.error(err);
      // Rollback to the previous state on error
      setAllAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_active: currentStatus } : a))
      );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-brand-text">Ajan Havuzu (Tüm Ajanlar)</h3>
        <p className="text-[11px] text-brand-mutedSoft mt-0.5">
          Sistemdeki aktif ve pasif tüm uzman ajanları buradan yönetebilir, pasif ajanları tekrar aktifleştirebilirsiniz.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-brand-mutedSoft font-mono">
          Yükleniyor...
        </div>
      ) : allAgents.length === 0 ? (
        <div className="text-center py-8 text-xs text-brand-mutedSoft font-mono">
          Sistemde tanımlı ajan bulunamadı.
        </div>
      ) : (
        <div className="divide-y divide-brand-border/20 max-h-[50vh] overflow-y-auto pr-1">
          {allAgents.map((agent) => (
            <div
              key={agent.id}
              className={`flex items-center justify-between py-2.5 px-2 rounded-lg transition-all duration-200 hover:bg-brand-panelAlt/50 ${
                agent.is_active ? 'opacity-100' : 'opacity-50 hover:opacity-75'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={getModelLogo(agent.model, agent.provider)}
                  alt=""
                  className={`w-7 h-7 object-contain flex-shrink-0 transition-all duration-300 ${
                    agent.is_active ? 'scale-100' : 'scale-95 filter grayscale opacity-75'
                  }`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-semibold text-xs truncate transition-colors duration-300 ${
                      agent.is_active ? 'text-brand-text' : 'text-brand-mutedSoft'
                    }`}>{agent.name}</span>
                    <span className={`text-[9px] font-bold tracking-wide font-mono uppercase ${
                      agent.is_active ? 'text-brand-accent' : 'text-brand-mutedSoft'
                    }`}>
                      {agent.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-brand-mutedSoft font-mono truncate mt-0.5">
                    {agent.provider} / {agent.model}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Switch (Durum değiştirme) */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(agent.id, agent.is_active)}
                  className={`w-8 h-4.5 rounded-full p-0.5 transition-all duration-300 ease-in-out focus:outline-none ${
                    agent.is_active 
                      ? 'bg-brand-accent' 
                      : 'bg-brand-mutedSoft/30'
                  }`}
                >
                  <div
                    className={`bg-brand-bg w-3.5 h-3.5 rounded-full shadow transform transition-all duration-300 ${
                      agent.is_active ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Düzenle */}
                <button
                  type="button"
                  onClick={() => onEditAgent?.(agent.id)}
                  title="Düzenle"
                  className="p-1.5 rounded-md hover:bg-brand-panelAlt text-brand-muted hover:text-brand-text transition-all duration-200"
                >
                  <Icon name="edit" size={15} />
                </button>

                {/* Kopyala */}
                <button
                  type="button"
                  onClick={() => {
                    onDuplicateAgent?.(agent.id);
                    setTimeout(() => loadAgents(true), 1200);
                  }}
                  title="Kopyala"
                  className="p-1.5 rounded-md hover:bg-brand-panelAlt text-brand-muted hover:text-brand-text transition-all duration-200"
                >
                  <Icon name="content_copy" size={15} />
                </button>

                {/* Sil */}
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAgent?.(agent.id);
                    setTimeout(() => loadAgents(true), 1200);
                  }}
                  title="Sil"
                  className="p-1.5 rounded-md hover:bg-brand-danger/10 text-brand-muted hover:text-brand-danger transition-all duration-200"
                >
                  <Icon name="delete" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
