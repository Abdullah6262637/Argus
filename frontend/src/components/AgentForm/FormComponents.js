import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon';
export const inputCls = 'w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent transition';
export function StepHeading({ title, desc }) {
    return (_jsxs("div", { className: "space-y-1 pb-2", children: [_jsx("h3", { className: "text-[15px] font-bold text-brand-text leading-tight", children: title }), _jsx("p", { className: "text-[11.5px] text-brand-textSoft leading-normal", children: desc })] }));
}
export function Field({ label, icon, hint, children }) {
    return (_jsxs("label", { className: "block space-y-1", children: [_jsxs("span", { className: "text-[9.5px] text-brand-mutedSoft uppercase tracking-wider font-bold inline-flex items-center gap-1", children: [icon && _jsx(Icon, { name: icon, size: 10, weight: 500 }), label] }), children, hint && (_jsx("span", { className: "block text-[11px] text-brand-mutedSoft leading-snug", children: hint }))] }));
}
export function CustomSelect({ value, onChange, options, placeholder = 'Seçiniz...', disabled = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    useEffect(() => {
        const onClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);
    const selectedOpt = options.find((o) => o.value === value);
    return (_jsxs("div", { ref: containerRef, className: "relative w-full", children: [_jsxs("button", { type: "button", disabled: disabled, onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!disabled)
                        setIsOpen(!isOpen);
                }, className: "w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent transition flex items-center justify-between text-left disabled:opacity-40 disabled:cursor-not-allowed", children: [_jsx("span", { className: "truncate", children: selectedOpt ? selectedOpt.label : placeholder }), _jsx(Icon, { name: "expand_more", size: 16, className: `text-brand-mutedSoft transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-accent' : ''}` })] }), isOpen && (_jsx("div", { className: "absolute left-0 right-0 mt-1 z-[80] bg-brand-panel border border-brand-borderStrong rounded-md shadow-xl max-h-60 overflow-y-auto py-1 animate-command-palette-in", children: options.map((opt) => (_jsxs("button", { type: "button", onClick: (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(false);
                        onChange(opt.value);
                    }, className: `w-full px-3 py-2 text-left text-sm transition flex items-center justify-between ${value === opt.value
                        ? 'bg-brand-accent/15 text-brand-accent font-semibold'
                        : 'text-brand-textSoft hover:bg-brand-panelAlt hover:text-brand-text'}`, children: [_jsx("span", { className: "truncate", children: opt.label }), value === opt.value && _jsx(Icon, { name: "check", size: 14, className: "text-brand-accent" })] }, opt.value))) }))] }));
}
export function SearchableCustomSelect({ value, onChange, options, placeholder = 'Seçiniz...', disabled = false, onCustomAdd }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    useEffect(() => {
        const onClick = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);
    useEffect(() => {
        if (isOpen)
            setSearch('');
    }, [isOpen]);
    const selectedOpt = options.find((o) => o.value === value);
    const filtered = options.filter((o) => o.searchString.toLowerCase().includes(search.toLowerCase()));
    return (_jsxs("div", { ref: containerRef, className: "relative w-full", children: [_jsxs("button", { type: "button", disabled: disabled, onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!disabled)
                        setIsOpen(!isOpen);
                }, className: "w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent transition flex items-center justify-between text-left disabled:opacity-40 disabled:cursor-not-allowed", children: [_jsx("span", { className: "truncate", children: selectedOpt ? selectedOpt.label : (value || placeholder) }), _jsx(Icon, { name: "expand_more", size: 16, className: `text-brand-mutedSoft transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-accent' : ''}` })] }), isOpen && (_jsxs("div", { className: "absolute left-0 right-0 mt-1 z-[80] bg-brand-panel border border-brand-borderStrong rounded-md shadow-xl max-h-64 overflow-y-auto py-1 flex flex-col animate-command-palette-in", children: [_jsxs("div", { className: "px-2 py-1.5 border-b border-brand-border flex items-center gap-1.5 sticky top-0 bg-brand-panel z-10", children: [_jsx(Icon, { name: "search", size: 14, className: "text-brand-mutedSoft flex-shrink-0" }), _jsx("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Model ara veya \u00F6zel yaz...", onClick: (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }, className: "w-full bg-transparent border-none text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none" })] }), _jsxs("div", { className: "overflow-y-auto flex-1 max-h-48 py-1", children: [filtered.map((opt) => (_jsxs("button", { type: "button", onClick: (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    onChange(opt.value);
                                }, className: `w-full px-3 py-2 text-left text-sm transition flex items-center justify-between ${value === opt.value
                                    ? 'bg-brand-accent/15 text-brand-accent font-semibold'
                                    : 'text-brand-textSoft hover:bg-brand-panelAlt hover:text-brand-text'}`, children: [_jsx("span", { className: "truncate", children: opt.label }), value === opt.value && _jsx(Icon, { name: "check", size: 14, className: "text-brand-accent" })] }, opt.value))), filtered.length === 0 && search.trim() && onCustomAdd && (_jsxs("button", { type: "button", onClick: (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onCustomAdd(search.trim());
                                    setIsOpen(false);
                                }, className: "w-full px-3 py-2 text-left text-xs text-brand-accent hover:bg-brand-panelAlt transition flex items-center gap-2 font-medium", children: [_jsx(Icon, { name: "add", size: 12 }), _jsxs("span", { className: "truncate", children: ["\"", search.trim(), "\" modelini kullan"] })] })), filtered.length === 0 && !search.trim() && (_jsx("div", { className: "px-3 py-2 text-xs text-brand-mutedSoft text-center", children: "Sonu\u00E7 bulunamad\u0131." }))] })] }))] }));
}
