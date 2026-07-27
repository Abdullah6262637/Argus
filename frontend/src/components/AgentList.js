import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { ContextMenu } from './ContextMenu';
import { Icon } from './Icon';
import { getModelLogo } from '../utils/modelHelper';
export function AgentList({ agents, selectedId, onSelect, onCreate, onEdit, onDelete, onDuplicate, onExport, onNewConversation, loading, error, isOpen, onToggle, onToggleActive, onInspect, onTestConnection, onClearConversations, onExportChatMD }) {
    const [ctx, setCtx] = useState(null);
    const [search, setSearch] = useState('');
    const filteredAgents = useMemo(() => {
        if (!search.trim())
            return agents;
        const q = search.toLowerCase();
        return agents.filter((a) => a.name.toLowerCase().includes(q) ||
            a.role?.toLowerCase().includes(q) ||
            a.model?.toLowerCase().includes(q) ||
            a.provider?.toLowerCase().includes(q) ||
            a.tags?.some((t) => t.toLowerCase().includes(q)));
    }, [agents, search]);
    const openContext = (e, id) => {
        e.preventDefault();
        onSelect(id);
        setCtx({ x: e.clientX, y: e.clientY, agentId: id });
    };
    const menuItemsFor = (agentId) => {
        const agent = agents.find((a) => a.id === agentId);
        return [
            {
                id: 'edit',
                label: 'Ajanı Düzenle',
                icon: _jsx(Icon, { name: "edit", size: 16 }),
                onClick: () => onEdit(agentId)
            },
            {
                id: 'new-conv',
                label: 'Yeni Sohbet Başlat',
                icon: _jsx(Icon, { name: "add_comment", size: 16 }),
                onClick: () => onNewConversation(agentId)
            },
            {
                id: 'toggle-active',
                label: agent?.is_active ? 'Ajanı Pasifleştir' : 'Ajanı Aktifleştir',
                icon: _jsx(Icon, { name: agent?.is_active ? 'toggle_on' : 'toggle_off', size: 16, className: agent?.is_active ? 'text-brand-accent' : 'text-brand-muted' }),
                onClick: () => onToggleActive?.(agentId)
            },
            { id: 's1', separator: true },
            {
                id: 'inspect',
                label: 'Özellikleri Denetle (Inspector)',
                icon: _jsx(Icon, { name: "visibility", size: 16 }),
                onClick: () => onInspect?.(agentId)
            },
            {
                id: 'test-conn',
                label: 'Bağlantıyı Test Et',
                icon: _jsx(Icon, { name: "network_check", size: 16 }),
                onClick: () => onTestConnection?.(agentId)
            },
            { id: 's2', separator: true },
            {
                id: 'export-md',
                label: 'Sohbeti Markdown (.md) Olarak İndir',
                icon: _jsx(Icon, { name: "article", size: 16 }),
                onClick: () => onExportChatMD?.(agentId)
            },
            {
                id: 'clear-conv',
                label: 'Sohbet Geçmişini Temizle',
                icon: _jsx(Icon, { name: "delete_sweep", size: 16 }),
                onClick: () => onClearConversations?.(agentId)
            },
            {
                id: 'duplicate',
                label: 'Ajanı Kopyala (Çoğalt)',
                icon: _jsx(Icon, { name: "content_copy", size: 16 }),
                onClick: () => onDuplicate(agentId)
            },
            {
                id: 'export',
                label: 'JSON Olarak Dışa Aktar',
                icon: _jsx(Icon, { name: "download", size: 16 }),
                onClick: () => onExport(agentId)
            },
            { id: 's3', separator: true },
            {
                id: 'delete',
                label: 'Ajanı Sistemden Sil',
                icon: _jsx(Icon, { name: "delete", size: 16 }),
                danger: true,
                onClick: () => onDelete(agentId)
            }
        ];
    };
    return (_jsx("aside", { className: `relative h-full flex-shrink-0 border-r bg-brand-panel flex flex-col transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${isOpen ? 'w-72 border-brand-border opacity-100' : 'w-0 border-transparent opacity-0'}`, children: _jsxs("div", { className: `w-72 h-full flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${isOpen ? 'translate-x-0' : '-translate-x-8'}`, children: [_jsxs("header", { className: "px-3 py-3 border-b border-brand-border space-y-2.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "text-[12px] font-semibold text-brand-text leading-tight", children: "Ajanlar" }), _jsxs("p", { className: "text-[10px] text-brand-mutedSoft leading-tight font-mono tabular-nums mt-0.5", children: [filteredAgents.length, search && agents.length !== filteredAgents.length && (_jsxs("span", { className: "text-brand-mutedSoft", children: ["/", agents.length] })), _jsx("span", { className: "ml-1 text-brand-mutedSoft", children: filteredAgents.length === 1 ? 'ajan' : 'ajan' })] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: onCreate, title: "Yeni ajan olu\u015Ftur", className: "w-7 h-7 rounded-md inline-flex items-center justify-center text-brand-textSoft hover:text-brand-accent hover:bg-brand-accent/10 transition-all active:scale-90", children: _jsx(Icon, { name: "add", size: 17, weight: 650 }) }), _jsx("button", { onClick: onToggle, title: "Ajanlar Panelini Kapat", className: "w-7 h-7 rounded-md inline-flex items-center justify-center text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all", children: _jsx(Icon, { name: "menu_open", size: 16 }) })] })] }), agents.length > 0 && (_jsxs("div", { className: "relative", children: [_jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Ajan ara...", className: "peer w-full h-8 bg-brand-bg border border-brand-border rounded-md pl-8 pr-7 text-[12px] text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 transition-all duration-200" }), _jsx(Icon, { name: "search", size: 14, weight: 500, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-mutedSoft peer-focus:text-brand-accent pointer-events-none transition-colors duration-200" }), search && (_jsx("button", { onClick: () => setSearch(''), className: "absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md inline-flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all", title: "Temizle", children: _jsx(Icon, { name: "close", size: 12, weight: 550 }) }))] }))] }), _jsxs("div", { className: "flex-1 overflow-y-auto p-1.5", children: [loading && (_jsxs("div", { className: "flex items-center justify-center gap-2 text-xs text-brand-muted py-8", children: [_jsx(Icon, { name: "progress_activity", size: 14, className: "animate-spin-slow" }), _jsx("span", { children: "Y\u00FCkleniyor..." })] })), error && (_jsxs("div", { className: "m-1.5 p-2.5 text-[11px] text-brand-danger bg-brand-danger/5 rounded-md border border-brand-danger/30 flex items-start gap-1.5", children: [_jsx(Icon, { name: "error", size: 13, weight: 500, filled: true, className: "flex-shrink-0 mt-px" }), _jsx("span", { className: "leading-relaxed", children: error })] })), !loading && !error && filteredAgents.length === 0 && agents.length > 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center text-center py-10 gap-2", children: [_jsx(Icon, { name: "search_off", size: 28, weight: 300, className: "text-brand-mutedSoft" }), _jsx("span", { className: "text-[11px] text-brand-mutedSoft", children: "E\u015Fle\u015Fen ajan yok" }), _jsx("button", { onClick: () => setSearch(''), className: "text-[10px] text-brand-accent hover:underline", children: "Aramay\u0131 temizle" })] })), !loading && agents.length === 0 && !error && (_jsxs("div", { className: "flex flex-col items-center justify-center text-center py-12 gap-2", children: [_jsx(Icon, { name: "person_add", size: 32, weight: 300, className: "text-brand-mutedSoft" }), _jsx("span", { className: "text-xs text-brand-muted", children: "Ajan yok" }), _jsxs("button", { onClick: onCreate, className: "text-[10.5px] text-brand-accent hover:underline inline-flex items-center gap-1", children: [_jsx(Icon, { name: "add", size: 11, weight: 600 }), "\u0130lk ajan\u0131 olu\u015Ftur"] })] })), _jsx("div", { className: "space-y-0.5", children: filteredAgents.map((a) => (_jsx("div", { className: `transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-top overflow-hidden ${a.is_active
                                    ? 'max-h-[120px] opacity-100 scale-100 py-0.5 pointer-events-auto'
                                    : 'max-h-0 opacity-0 scale-90 py-0 my-0 border-0 pointer-events-none'}`, children: _jsx(AgentCard, { agent: a, active: a.id === selectedId, onSelect: () => onSelect(a.id), onContextMenu: (e) => openContext(e, a.id) }) }, a.id))) })] }), _jsxs("div", { className: "px-3 py-2 border-t border-brand-border text-[9.5px] text-brand-mutedSoft inline-flex items-center justify-center gap-1.5", children: [_jsx(Icon, { name: "touch_app", size: 11, weight: 500 }), _jsx("span", { children: "Sa\u011F t\u0131kla ile se\u00E7enekler" })] }), ctx && (_jsx(ContextMenu, { x: ctx.x, y: ctx.y, items: menuItemsFor(ctx.agentId), onClose: () => setCtx(null) }))] }) }));
}
// ============================================================
// Ajan Kartı — kurumsal sade
// ============================================================
function AgentCard({ agent, active, onSelect, onContextMenu }) {
    const hasMedia = agent.media_image || agent.media_video || agent.media_audio;
    const hasTags = agent.tags && agent.tags.length > 0;
    return (_jsxs("button", { onClick: onSelect, onContextMenu: onContextMenu, title: "Sa\u011F t\u0131kla ile se\u00E7enekler", className: `group w-full text-left px-3 py-2.5 rounded-md transition-all duration-150 relative animate-card-in ${active
            ? 'bg-brand-accent/8'
            : 'hover:bg-brand-panelAlt/60'}`, children: [_jsx("span", { className: `absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r transition-all ${active ? 'bg-brand-accent' : 'bg-transparent group-hover:bg-brand-border'}` }), _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: `text-[13px] font-semibold truncate leading-none tracking-tight ${active ? 'text-brand-text' : 'text-brand-text'}`, children: agent.name }), _jsx("span", { className: `text-[9px] font-mono font-bold uppercase tracking-wider flex-shrink-0 px-1.5 h-[18px] inline-flex items-center rounded-[4px] ${active
                            ? 'bg-brand-accent/15 text-brand-accent'
                            : 'bg-brand-panelAlt text-brand-mutedSoft'}`, children: agent.provider })] }), _jsx("div", { className: "text-[11px] text-brand-mutedSoft truncate leading-tight mt-1", children: agent.role || (_jsxs("span", { className: "inline-flex items-center gap-1 font-mono", children: [_jsx("img", { src: getModelLogo(agent.model, agent.provider), alt: "", className: "w-3.5 h-3.5 object-contain rounded-sm" }), _jsx("span", { children: agent.model })] })) }), agent.role && (_jsx("div", { className: "text-[10px] font-mono text-brand-mutedSoft/80 truncate leading-tight mt-1", children: _jsxs("span", { className: "inline-flex items-center gap-1", children: [_jsx("img", { src: getModelLogo(agent.model, agent.provider), alt: "", className: "w-3 h-3 object-contain rounded-sm" }), _jsx("span", { children: agent.model })] }) })), (hasMedia || hasTags || agent.has_base_url || agent.has_api_key) && (_jsxs("div", { className: "flex items-center gap-1 mt-2", children: [agent.tags?.slice(0, 2).map((t) => (_jsx("span", { className: "text-[9px] font-medium px-1.5 h-[15px] inline-flex items-center rounded-[3px] bg-brand-panelAlt text-brand-mutedSoft tracking-tight", children: t }, t))), agent.tags && agent.tags.length > 2 && (_jsxs("span", { className: "text-[9px] font-mono text-brand-mutedSoft", children: ["+", agent.tags.length - 2] })), _jsxs("div", { className: "ml-auto flex items-center gap-1", children: [agent.media_image && _jsx(MediaBadge, { kind: "image" }), agent.media_video && _jsx(MediaBadge, { kind: "video" }), agent.media_audio && _jsx(MediaBadge, { kind: "audio" }), agent.has_base_url && (_jsx(Icon, { name: "link", size: 10, weight: 500, className: "text-brand-mutedSoft/70", title: "\u00D6zel base URL" })), agent.has_api_key && (_jsx(Icon, { name: "key", size: 10, weight: 500, className: "text-brand-mutedSoft/70", title: "Kendi API key" }))] })] }))] }));
}
function MediaBadge({ kind }) {
    const config = {
        image: { icon: 'image', label: 'Görsel' },
        video: { icon: 'movie', label: 'Video' },
        audio: { icon: 'graphic_eq', label: 'Ses' }
    };
    const c = config[kind];
    return (_jsx(Icon, { name: c.icon, size: 11, weight: 500, className: "text-brand-mutedSoft/70", title: c.label }));
}
