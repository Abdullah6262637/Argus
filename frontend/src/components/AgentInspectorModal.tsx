import { useEffect, useRef } from 'react';
import type { AgentInfo } from '@/types';
import { AgentInspector } from './AgentInspector';
import { Icon } from './Icon';

interface AgentInspectorModalProps {
  open: boolean;
  onClose: () => void;
  agentId: string | null;
  agents: AgentInfo[];
}

export function AgentInspectorModal({
  open,
  onClose,
  agentId,
  agents
}: AgentInspectorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const agent = agents.find((a) => a.id === agentId) || null;

  // Escape key close listener
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Click outside close listener
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!open || !agent) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        className="bg-brand-bg border border-brand-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-modal-in ease-out duration-300"
      >
        {/* Header */}
        <header className="px-5 py-4 border-b border-brand-border bg-brand-panel flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shadow-[0_0_12px_rgba(20,163,127,0.15)]">
              <Icon name="analytics" size={16} weight={600} filled />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-brand-text leading-tight">
                Ajan Denetleme (Capabilities Inspector)
              </h3>
              <p className="text-[10px] text-brand-mutedSoft mt-0.5 leading-none">
                Ajan çalışma logları, API başarı oranları ve yetenek analizi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95"
            title="Kapat"
          >
            <Icon name="close" size={14} weight={600} />
          </button>
        </header>

        {/* Content scroll area */}
        <div className="flex-1 overflow-y-auto p-5">
          <AgentInspector agent={agent} />
        </div>

        {/* Footer */}
        <footer className="px-5 py-3 border-t border-brand-border bg-brand-panel/30 flex items-center justify-between text-[10px] text-brand-mutedSoft">
          <span className="font-mono">ID: {agent.id}</span>
          <button
            type="button"
            onClick={onClose}
            className="h-7 px-4 rounded-lg bg-brand-panelAlt hover:bg-brand-border border border-brand-border text-brand-text text-xs font-medium transition-all active:scale-95"
          >
            Kapat
          </button>
        </footer>
      </div>
    </div>
  );
}
