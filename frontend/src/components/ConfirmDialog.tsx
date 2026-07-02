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
  /** ekstra detay paragrafi */
  details?: React.ReactNode;
  /** confirm butonuna basmadan once yazilmasi zorunlu metin (reset gibi) */
  requireTypeText?: string;
  typedText?: string;
  onTypedTextChange?: (v: string) => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Onayla',
  cancelLabel = 'Iptal',
  variant = 'default',
  onConfirm,
  onCancel,
  details,
  requireTypeText,
  typedText = '',
  onTypedTextChange,
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-lg border border-brand-borderStrong bg-brand-panel shadow-2xl overflow-hidden">
        {/* Baslik */}
        <div
          className={`px-5 py-3 border-b border-brand-border flex items-center gap-3 ${
            isDanger ? 'bg-brand-danger/10' : 'bg-brand-panelAlt'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isDanger
                ? 'bg-brand-danger/20 text-brand-danger'
                : 'bg-brand-accent/15 text-brand-accent'
            }`}
          >
            <Icon
              name={isDanger ? 'warning' : 'info'}
              size={22}
              filled
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-text">{title}</h3>
          </div>
        </div>

        {/* Icerik */}
        <div className="p-5 space-y-3 text-sm text-brand-textSoft leading-relaxed">
          <div>{message}</div>

          {details && (
            <div className="rounded border border-brand-border bg-brand-panelAlt p-3 text-xs text-brand-muted">
              {details}
            </div>
          )}

          {requireTypeText && (
            <div className="space-y-1.5 pt-2">
              <div className="text-xs text-brand-textSoft">
                Devam etmek icin asagiya{' '}
                <code className="text-brand-accent bg-brand-panelAlt px-1.5 py-0.5 rounded font-mono">
                  {requireTypeText}
                </code>{' '}
                yaz:
              </div>
              <input
                type="text"
                value={typedText}
                onChange={(e) => onTypedTextChange?.(e.target.value)}
                placeholder={requireTypeText}
                className="w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent transition font-mono"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-brand-border bg-brand-panelAlt">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded border border-brand-border text-brand-textSoft hover:text-brand-text hover:border-brand-borderStrong transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`px-5 py-2 text-sm rounded font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
              isDanger
                ? 'bg-brand-danger text-white hover:bg-brand-danger/80'
                : 'bg-brand-accent text-brand-bg hover:bg-brand-accentDim'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
