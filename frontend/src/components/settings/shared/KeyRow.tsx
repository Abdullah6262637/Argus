import { useState } from 'react';
import { Icon } from '../../Icon';

export interface KeyRowProps {
  providerId: string;
  label: string;
  logoUrl: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hasExisting: boolean;
  maskedExisting: string | null | undefined;
  onClear: () => void;
  baseLabel?: string;
  basePlaceholder?: string;
  baseValue?: string;
  onBaseChange?: (v: string) => void;
}

export function KeyRow({
  label,
  logoUrl,
  placeholder,
  value,
  onChange,
  hasExisting,
  maskedExisting,
  onClear,
  basePlaceholder,
  baseValue = '',
  onBaseChange,
}: KeyRowProps) {
  const [show, setShow] = useState(false);
  const [showBase, setShowBase] = useState(!!baseValue);

  return (
    <div className="p-4 rounded-2xl bg-brand-panelAlt/50 space-y-3 transition-all hover:bg-brand-panelAlt/70 border border-transparent hover:border-brand-border/40">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Real Provider Brand Logo */}
          <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img
              src={logoUrl}
              alt={label}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-brand-text truncate">{label}</h4>
            <div className="flex items-center gap-1.5 text-[10.5px] mt-0.5">
              {hasExisting ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-success flex-shrink-0 animate-pulse" />
                  <span className="font-mono text-brand-textSoft truncate">
                    {maskedExisting ?? '••••••••'}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-mutedSoft/60 flex-shrink-0" />
                  <span className="text-brand-mutedSoft">Anahtar Yok</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onBaseChange && (
            <button
              type="button"
              onClick={() => setShowBase((v) => !v)}
              title="Custom Base URL"
              className={`h-7 px-2 rounded-lg text-[10.5px] font-medium transition-all flex items-center gap-1 ${
                showBase || baseValue
                  ? 'bg-brand-accent/15 text-brand-accent font-semibold'
                  : 'text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt'
              }`}
            >
              <Icon name="link" size={13} />
              <span>Base URL</span>
            </button>
          )}

          {hasExisting && (
            <button
              type="button"
              onClick={onClear}
              title="Anahtarı Temizle"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-brand-mutedSoft hover:text-brand-danger hover:bg-brand-danger/10 transition-all active:scale-95"
            >
              <Icon name="delete" size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Input Field Area */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={hasExisting ? '(Değiştirmek için yeni anahtar giriniz)' : placeholder}
            autoComplete="new-password"
            className="w-full bg-brand-bg/80 border border-brand-border/40 focus:border-brand-accent rounded-xl pl-3.5 pr-9 py-2 text-xs font-mono text-brand-text placeholder:text-brand-mutedSoft/60 focus:outline-none transition-all shadow-inner"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            title={show ? 'Gizle' : 'Göster'}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-brand-mutedSoft hover:text-brand-text transition-all"
          >
            <Icon
              name={show ? 'visibility_off' : 'visibility'}
              size={14}
            />
          </button>
        </div>

        {/* Optional Base URL Input */}
        {onBaseChange && (showBase || baseValue) && (
          <div className="pt-1 animate-fade-in">
            <div className="flex items-center justify-between text-[10.5px] text-brand-mutedSoft mb-1 font-medium px-0.5">
              <span>Özel Base URL</span>
            </div>
            <input
              type="text"
              value={baseValue}
              onChange={(e) => onBaseChange(e.target.value)}
              placeholder={basePlaceholder}
              className="w-full bg-brand-bg/60 border border-brand-border/30 focus:border-brand-accent rounded-xl px-3.5 py-1.5 text-xs font-mono text-brand-text placeholder:text-brand-mutedSoft/50 focus:outline-none transition-all"
            />
          </div>
        )}
      </div>
    </div>
  );
}
