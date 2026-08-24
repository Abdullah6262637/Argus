import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Seçiniz...',
  className = '',
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-9 px-3 flex items-center justify-between gap-2 text-xs text-left rounded-xl bg-brand-bg/90 hover:bg-brand-panelAlt/80 transition-all ${
          open ? 'ring-1 ring-brand-accent/40 bg-brand-panelAlt' : ''
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="truncate flex items-center gap-1.5 min-w-0">
          {selectedOption?.icon && (
            <Icon name={selectedOption.icon} size={14} className="text-brand-accent flex-shrink-0" />
          )}
          <span className="text-brand-text truncate font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.sublabel && (
            <span className="text-[10px] text-brand-mutedSoft font-mono truncate hidden sm:inline">
              {selectedOption.sublabel}
            </span>
          )}
        </span>
        <Icon
          name="unfold_more"
          size={15}
          className={`text-brand-mutedSoft flex-shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-brand-accent' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-brand-panelAlt rounded-xl shadow-2xl overflow-hidden p-1 max-h-56 overflow-y-auto space-y-0.5 animate-fade-in-up">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-brand-mutedSoft italic text-center">
              Seçenek yok
            </div>
          ) : (
            options.map((opt) => {
              const active = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between gap-2 transition-all ${
                    active
                      ? 'bg-brand-accent/15 text-brand-accent font-semibold'
                      : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-bg/60'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0 truncate">
                    {opt.icon && (
                      <Icon
                        name={opt.icon}
                        size={14}
                        className={active ? 'text-brand-accent' : 'text-brand-mutedSoft'}
                      />
                    )}
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-brand-mutedSoft font-mono truncate">
                        {opt.sublabel}
                      </span>
                    )}
                  </span>
                  {active && (
                    <Icon name="check" size={14} weight={650} className="text-brand-accent flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
