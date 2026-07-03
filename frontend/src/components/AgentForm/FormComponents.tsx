import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';

export const inputCls =
  'w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent transition';

export function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-1 pb-2">
      <h3 className="text-[15px] font-bold text-brand-text leading-tight">{title}</h3>
      <p className="text-[11.5px] text-brand-textSoft leading-normal">{desc}</p>
    </div>
  );
}

export function Field({
  label,
  icon,
  hint,
  children
}: {
  label: string;
  icon?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[9.5px] text-brand-mutedSoft uppercase tracking-wider font-bold inline-flex items-center gap-1">
        {icon && <Icon name={icon} size={10} weight={500} />}
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-[11px] text-brand-mutedSoft leading-snug">
          {hint}
        </span>
      )}
    </label>
  );
}

interface CustomSelectProps<T> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  placeholder?: string;
  disabled?: boolean;
}

export function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Seçiniz...',
  disabled = false
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectedOpt = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
        className="w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent transition flex items-center justify-between text-left disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : placeholder}</span>
        <Icon
          name="expand_more"
          size={16}
          className={`text-brand-mutedSoft transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-accent' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-[80] bg-brand-panel border border-brand-borderStrong rounded-md shadow-xl max-h-60 overflow-y-auto py-1 animate-command-palette-in">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                onChange(opt.value);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition flex items-center justify-between ${
                value === opt.value
                  ? 'bg-brand-accent/15 text-brand-accent font-semibold'
                  : 'text-brand-textSoft hover:bg-brand-panelAlt hover:text-brand-text'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Icon name="check" size={14} className="text-brand-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface SearchableCustomSelectProps<T> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; searchString: string }[];
  placeholder?: string;
  disabled?: boolean;
  onCustomAdd?: (val: string) => void;
}

export function SearchableCustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Seçiniz...',
  disabled = false,
  onCustomAdd
}: SearchableCustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (isOpen) setSearch('');
  }, [isOpen]);

  const selectedOpt = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.searchString.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
        className="w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent transition flex items-center justify-between text-left disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : (value || placeholder)}</span>
        <Icon
          name="expand_more"
          size={16}
          className={`text-brand-mutedSoft transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-accent' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-[80] bg-brand-panel border border-brand-borderStrong rounded-md shadow-xl max-h-64 overflow-y-auto py-1 flex flex-col animate-command-palette-in">
          <div className="px-2 py-1.5 border-b border-brand-border flex items-center gap-1.5 sticky top-0 bg-brand-panel z-10">
            <Icon name="search" size={14} className="text-brand-mutedSoft flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Model ara veya özel yaz..."
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-full bg-transparent border-none text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none"
            />
          </div>

          <div className="overflow-y-auto flex-1 max-h-48 py-1">
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                  onChange(opt.value);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition flex items-center justify-between ${
                  value === opt.value
                    ? 'bg-brand-accent/15 text-brand-accent font-semibold'
                    : 'text-brand-textSoft hover:bg-brand-panelAlt hover:text-brand-text'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {value === opt.value && <Icon name="check" size={14} className="text-brand-accent" />}
              </button>
            ))}

            {filtered.length === 0 && search.trim() && onCustomAdd && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCustomAdd(search.trim());
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-brand-accent hover:bg-brand-panelAlt transition flex items-center gap-2 font-medium"
              >
                <Icon name="add" size={12} />
                <span className="truncate">"{search.trim()}" modelini kullan</span>
              </button>
            )}

            {filtered.length === 0 && !search.trim() && (
              <div className="px-3 py-2 text-xs text-brand-mutedSoft text-center">
                Sonuç bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
