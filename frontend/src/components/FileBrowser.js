import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// FileBrowser: tool sonuclarini tree gorunumunde modal (Material Symbols)
import { useState } from 'react';
import { Icon } from './Icon';
export function FileBrowser({ open, onClose, title = 'Dosyalar', entries }) {
    const [filter, setFilter] = useState('');
    const [selected, setSelected] = useState(null);
    if (!open)
        return null;
    const filtered = filter
        ? entries.filter((e) => e.name.toLowerCase().includes(filter.toLowerCase()))
        : entries;
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4 animate-backdrop-in", onClick: onClose, children: _jsxs("div", { className: "bg-brand-bg border border-brand-border rounded-lg w-full max-w-3xl max-h-[80vh] flex flex-col animate-modal-in", onClick: (e) => e.stopPropagation(), children: [_jsxs("div", { className: "px-4 py-3 border-b border-brand-border flex items-center justify-between", children: [_jsxs("h3", { className: "text-sm font-semibold text-brand-text flex items-center gap-2", children: [_jsx(Icon, { name: "folder_open", size: 18, weight: 500, className: "text-brand-accent" }), title] }), _jsx("button", { className: "w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-panelAlt transition-all", onClick: onClose, title: "Kapat", children: _jsx(Icon, { name: "close", size: 18, weight: 500 }) })] }), _jsx("div", { className: "px-4 py-2 border-b border-brand-border", children: _jsx("input", { value: filter, onChange: (e) => setFilter(e.target.value), placeholder: "Filtrele...", className: "w-full bg-brand-panel border border-brand-border rounded px-3 py-1.5 text-sm text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent" }) }), _jsx("div", { className: "flex-1 overflow-y-auto p-2", children: filtered.length === 0 ? (_jsx("div", { className: "text-center text-sm text-brand-muted py-8", children: filter ? 'Eslesme yok' : 'Bos' })) : (_jsx("ul", { className: "space-y-0.5", children: filtered.map((e, i) => (_jsxs("li", { className: `px-2 py-1.5 rounded cursor-pointer hover:bg-brand-panel transition flex items-center gap-2 ${selected?.path === e.path ? 'bg-brand-panel' : ''}`, onClick: () => setSelected(e), children: [_jsx(Icon, { name: e.is_dir ? 'folder' : 'description', size: 16, weight: 500, filled: e.is_dir, className: `flex-shrink-0 ${e.is_dir ? 'text-brand-accent' : 'text-brand-muted'}` }), _jsx("span", { className: "text-sm text-brand-text flex-1 truncate", children: e.name }), e.size !== undefined && !e.is_dir && (_jsx("span", { className: "text-[10px] text-brand-mutedSoft flex-shrink-0", children: formatSize(e.size) }))] }, i))) })) }), selected && (_jsxs("div", { className: "border-t border-brand-border p-3 bg-brand-panel/40", children: [_jsx("div", { className: "text-xs text-brand-mutedSoft mb-1", children: "Secili:" }), _jsx("div", { className: "text-sm text-brand-text font-mono break-all", children: selected.path })] }))] }) }));
}
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
