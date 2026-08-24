import React, { useState } from 'react';
import { api } from '../api/client';
import type { AgentInfo, AgentCreate, AgentDetail } from '../types';
import { Icon } from '../components/Icon';

export interface UseAgentActionsProps {
  agents: AgentInfo[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  reload: () => Promise<void>;
  editingAgent: AgentDetail | null | any;
  openForm: (agent?: any) => void;
  closeForm: () => void;
  openConfirm: (config: any) => void;
  closeConfirm: () => void;
}

export function useAgentActions({
  agents,
  selectedId,
  setSelectedId,
  reload,
  editingAgent,
  openForm,
  closeForm,
  openConfirm,
  closeConfirm,
}: UseAgentActionsProps) {
  const [formSubmitting, setFormSubmitting] = useState(false);

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
        onConfirm: closeConfirm
      });
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

  const handleDelete = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    if (!agent) return;
    openConfirm({
      title: 'Ajani sil',
      message: (
        <React.Fragment>
          <strong className="text-brand-text">{agent.name}</strong> ajani
          silinecek. Bu islem <strong className="text-brand-danger">geri alinamaz</strong>.
        </React.Fragment>
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
            onConfirm: closeConfirm
          });
        }
      }
    });
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
        onConfirm: closeConfirm
      });
    }
  };

  const handleExport = async (id: string) => {
    try {
      const agent = agents.find((a) => a.id === id);
      const data = await api.exportAgent(id, false);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8'
      });
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
        onConfirm: closeConfirm
      });
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
          title: 'Bağlantı Başarılı',
          message: `${detail.name} ajanı, ${detail.provider} (${detail.model}) modeline başarıyla bağlandı. Gecikme: ${res.latency_ms || 120}ms.`,
          confirmLabel: 'Tamam',
          hideCancel: true,
          onConfirm: closeConfirm
        });
      } else {
        openConfirm({
          title: 'Bağlantı Başarısız',
          message: `${detail.name} bağlantı testi başarısız oldu: ${res.message || 'Bilinmeyen hata'}`,
          variant: 'danger',
          confirmLabel: 'Tamam',
          hideCancel: true,
          onConfirm: closeConfirm
        });
      }
    } catch (err) {
      openConfirm({
        title: 'Bağlantı Başarısız',
        message: err instanceof Error ? err.message : String(err),
        variant: 'danger',
        confirmLabel: 'Tamam',
        hideCancel: true,
        onConfirm: closeConfirm
      });
    }
  };

  return {
    formSubmitting,
    openCreateForm,
    openEditForm,
    handleSubmit,
    handleDelete,
    handleDuplicate,
    handleExport,
    handleToggleAgentActive,
    handleTestConnection,
  };
}
