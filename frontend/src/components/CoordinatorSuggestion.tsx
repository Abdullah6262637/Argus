import { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { api } from '@/api/client';

interface CoordinatorSuggestionProps {
  message: string;
  currentAgentId: string;
  onAccept: (agentId: string) => void;
  onDismiss: () => void;
}

export function CoordinatorSuggestion({
  message,
  currentAgentId,
  onAccept,
  onDismiss
}: CoordinatorSuggestionProps) {
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState<{
    primary: string;
    reason: string;
    self_handled: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSuggestion = async () => {
      if (!message.trim() || message.length < 10) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await api.coordinatorRoute(message);
        
        if (cancelled) return;

        // Eğer mevcut ajan zaten önerilen ajansa veya self_handled ise gösterme
        if (result.self_handled || result.primary === currentAgentId) {
          setLoading(false);
          return;
        }

        setSuggestion({
          primary: result.primary,
          reason: result.reason,
          self_handled: result.self_handled
        });
      } catch (err) {
        if (cancelled) return;
        console.error('Coordinator route hatası:', err);
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSuggestion();

    return () => {
      cancelled = true;
    };
  }, [message, currentAgentId]);

  if (loading || error || !suggestion) {
    return null;
  }

  return (
    <div className="mx-3 mb-2 p-3 rounded-xl border border-brand-accent/30 bg-brand-accent/5 backdrop-blur-sm animate-slide-in-down">
      <div className="flex items-start gap-3">
        {/* İkon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-accent/15 flex items-center justify-center">
          <Icon
            name="route"
            size={18}
            weight={550}
            filled
            className="text-brand-accent"
          />
        </div>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-brand-text">
              Ajan Önerisi
            </span>
            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-accent/20 text-brand-accent font-mono">
              Coordinator
            </span>
          </div>
          
          <p className="text-[11.5px] text-brand-textSoft leading-relaxed mb-2">
            {suggestion.reason}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAccept(suggestion.primary)}
              className="h-7 px-3 rounded-lg bg-brand-accent text-brand-bg text-[11px] font-semibold hover:bg-brand-accentDim active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Icon name="check" size={14} weight={600} />
              <span>{suggestion.primary} ajanına geç</span>
            </button>
            
            <button
              onClick={onDismiss}
              className="h-7 px-3 rounded-lg border border-brand-border text-brand-textSoft text-[11px] font-medium hover:bg-brand-panelAlt active:scale-95 transition-all"
            >
              Devam et
            </button>
          </div>
        </div>

        {/* Kapat butonu */}
        <button
          onClick={onDismiss}
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-colors"
          title="Kapat"
        >
          <Icon name="close" size={14} weight={500} />
        </button>
      </div>
    </div>
  );
}