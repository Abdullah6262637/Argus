import { useEffect } from 'react';
import { Icon } from './Icon';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  details?: React.ReactNode;
  requireTypeText?: string;
  typedText?: string;
  onTypedTextChange?: (v: string) => void;
  hideCancel?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Onayla',
  cancelLabel = 'İptal',
  variant = 'default',
  onConfirm,
  onCancel,
  details,
  requireTypeText,
  typedText = '',
  onTypedTextChange,
  hideCancel = false,
}: ConfirmDialogProps) {
  // ESC ile kapat
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === 'danger';
  const confirmDisabled =
    !!requireTypeText && typedText.trim() !== requireTypeText.trim();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-backdrop-in select-none">
      <div className="w-full max-w-md rounded-2xl bg-brand-panel shadow-2xl p-6 relative overflow-hidden transition-all animate-scale-in">
        {/* Baslik & Ikon */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
              isDanger
                ? 'bg-brand-danger/15 text-brand-danger'
                : 'bg-brand-accent/15 text-brand-accent'
            }`}
          >
            <Icon
              name={isDanger ? 'warning' : 'info'}
              size={20}
              filled
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-brand-text leading-tight">{title}</h3>
            <div className="mt-2 text-xs text-brand-textSoft leading-relaxed">{message}</div>
          </div>
        </div>

        {/* Detaylar */}
        {details && (
          <div className="mt-4 p-3.5 rounded-xl bg-brand-panelAlt/80 text-xs font-mono text-brand-mutedSoft overflow-x-auto select-text">
            {details}
          </div>
        )}

        {/* Metin Onayi */}
        {requireTypeText && (
          <div className="space-y-1.5 mt-4">
            <div className="text-xs text-brand-textSoft">
              Devam etmek için aşağıya{' '}
              <code className="text-brand-accent bg-brand-panelAlt px-1.5 py-0.5 rounded font-mono">
                {requireTypeText}
              </code>{' '}
              yazınız:
            </div>
            <input
              type="text"
              value={typedText}
              onChange={(e) => onTypedTextChange?.(e.target.value)}
              placeholder={requireTypeText}
              className="w-full bg-brand-bg rounded-xl px-3.5 py-2 text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:ring-1 focus:ring-brand-accent transition font-mono"
              autoFocus
            />
          </div>
        )}

        {/* Aksiyon Butonlari */}
        <div className="flex items-center justify-end gap-2.5 mt-6">
          {!hideCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-9 px-4 rounded-xl text-xs font-medium text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`h-9 px-5 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
              isDanger
                ? 'bg-brand-danger text-white hover:bg-brand-danger/90'
                : 'bg-brand-accent text-brand-userText hover:bg-brand-accentDim'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
