import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';

export const inputCls =
  'w-full bg-brand-bg/90 hover:bg-brand-bg focus:bg-brand-bg rounded-xl px-3.5 py-2.5 text-sm text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:ring-1 focus:ring-brand-accent/40 transition-all duration-200';

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
        className="w-full bg-brand-bg/90 hover:bg-brand-bg rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none transition-all duration-200 flex items-center justify-between text-left disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
        <div className="absolute left-0 right-0 mt-1.5 z-[80] bg-brand-panelAlt rounded-xl shadow-2xl max-h-60 overflow-y-auto py-1.5 animate-command-palette-in">
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
              className={`w-full px-3.5 py-2 text-left text-sm transition flex items-center justify-between ${
                value === opt.value
                  ? 'bg-brand-accent/20 text-brand-accent font-semibold'
                  : 'text-brand-textSoft hover:bg-brand-panel hover:text-brand-text'
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
        className="w-full bg-brand-bg/90 hover:bg-brand-bg rounded-xl px-3.5 py-2.5 text-sm text-brand-text focus:outline-none transition-all duration-200 flex items-center justify-between text-left disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
        <div className="absolute left-0 right-0 mt-1.5 z-[80] bg-brand-panelAlt rounded-xl shadow-2xl max-h-64 overflow-y-auto py-1.5 flex flex-col animate-command-palette-in">
          <div className="px-3 py-2 flex items-center gap-1.5 sticky top-0 bg-brand-panelAlt z-10">
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
                className={`w-full px-3.5 py-2 text-left text-sm transition flex items-center justify-between ${
                  value === opt.value
                    ? 'bg-brand-accent/20 text-brand-accent font-semibold'
                    : 'text-brand-textSoft hover:bg-brand-panel hover:text-brand-text'
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
                className="w-full px-3.5 py-2 text-left text-xs text-brand-accent hover:bg-brand-panel transition flex items-center gap-2 font-medium"
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

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  id,
  disabled = false
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2.5 select-none cursor-pointer group ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      }`}
    >
      <div className="relative flex items-center justify-center flex-shrink-0">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`w-4 h-4 rounded-md transition-all duration-200 flex items-center justify-center ${
            checked
              ? 'bg-brand-accent text-brand-bg shadow-sm shadow-brand-accent/20 scale-100'
              : 'bg-brand-bg/90 border border-brand-border/60 group-hover:border-brand-accent/50 group-hover:bg-brand-bg'
          }`}
        >
          {checked && (
            <svg
              className="w-3 h-3 stroke-current animate-step-in"
              viewBox="0 0 12 10"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1.5 5 4.5 8 10.5 1.5" />
            </svg>
          )}
        </div>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-xs font-medium text-brand-text group-hover:text-brand-textSoft transition-colors">{label}</span>}
          {description && <span className="text-[11px] text-brand-mutedSoft leading-tight">{description}</span>}
        </div>
      )}
    </label>
  );
}
