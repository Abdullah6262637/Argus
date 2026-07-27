import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// KnowledgeGraphModal: KG node + edge listesi (kurumsal sade tasarım)
import { useEffect, useMemo, useState, useRef } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';
export function KnowledgeGraphModal({ open, onClose, agentId }) {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('nodes');
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    useEffect(() => {
        if (!open)
            return;
        setLoading(true);
        setError(null);
        setSelectedNodeId(null);
        api
            .memoryGraph(agentId ?? undefined, 500)
            .then((data) => {
            setNodes((data.nodes || []));
            setEdges((data.edges || []));
        })
            .catch((err) => setError(err instanceof Error ? err.message : String(err)))
            .finally(() => setLoading(false));
    }, [open, agentId]);
    const filteredNodes = useMemo(() => {
        if (!search.trim())
            return nodes;
        const q = search.toLowerCase();
        return nodes.filter((n) => {
            const label = String(n.data.label || n.data.id).toLowerCase();
            const type = String(n.data.type || '').toLowerCase();
            const id = String(n.data.id).toLowerCase();
            return label.includes(q) || type.includes(q) || id.includes(q);
        });
    }, [nodes, search]);
    const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => String(n.data.id))), [filteredNodes]);
    const filteredEdges = useMemo(() => edges.filter((e) => visibleNodeIds.has(String(e.data.source)) &&
        visibleNodeIds.has(String(e.data.target))), [edges, visibleNodeIds]);
    // Node tiplerini grupla (istatistik için)
    const nodeTypeStats = useMemo(() => {
        const counts = {};
        nodes.forEach((n) => {
            const t = String(n.data.type || 'untyped');
            counts[t] = (counts[t] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [nodes]);
    // Seçili node'un komşuları
    const selectedNodeNeighbors = useMemo(() => {
        if (!selectedNodeId)
            return null;
        const incoming = edges.filter((e) => String(e.data.target) === selectedNodeId);
        const outgoing = edges.filter((e) => String(e.data.source) === selectedNodeId);
        return { incoming, outgoing };
    }, [selectedNodeId, edges]);
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-in", children: _jsxs("div", { className: "bg-brand-bg border border-brand-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-modal-in", children: [_jsxs("header", { className: "px-5 py-3.5 border-b border-brand-border flex items-center justify-between bg-brand-panel", children: [_jsx("div", { className: "flex items-center gap-3", children: _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-brand-text leading-tight", children: "Knowledge Graph" }), _jsxs("div", { className: "text-[10.5px] text-brand-mutedSoft inline-flex items-center gap-1.5 mt-0.5", children: [_jsxs("span", { className: "font-mono tabular-nums", children: [nodes.length, " d\u00FC\u011F\u00FCm"] }), _jsx("span", { className: "text-brand-border", children: "\u00B7" }), _jsxs("span", { className: "font-mono tabular-nums", children: [edges.length, " ili\u015Fki"] }), agentId && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-brand-border", children: "\u00B7" }), _jsx("code", { className: "font-mono text-brand-accent", children: agentId })] }))] })] }) }), _jsx("button", { onClick: onClose, title: "Kapat", className: "w-9 h-9 rounded-lg flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95", children: _jsx(Icon, { name: "close", size: 20, weight: 550 }) })] }), _jsxs("div", { className: "px-5 py-3 border-b border-brand-border bg-brand-panel/40", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Icon, { name: "search", size: 14, weight: 500, className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-mutedSoft pointer-events-none" }), _jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "D\u00FC\u011F\u00FCm, tip veya id ara...", className: "w-full h-9 bg-brand-bg border border-brand-border rounded-md pl-8 pr-8 text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 transition-all" }), search && (_jsx("button", { onClick: () => setSearch(''), className: "absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded inline-flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all", title: "Temizle", children: _jsx(Icon, { name: "close", size: 13, weight: 550 }) }))] }), nodeTypeStats.length > 0 && nodes.length > 0 && (_jsxs("div", { className: "hidden md:flex items-center gap-1.5 ml-auto", children: [_jsx("span", { className: "text-[10px] uppercase tracking-wider text-brand-mutedSoft font-bold", children: "Tipler" }), nodeTypeStats.slice(0, 4).map(([type, count]) => (_jsxs("span", { className: "inline-flex items-center gap-1 h-6 px-2 rounded-md bg-brand-panelAlt border border-brand-border text-[10px] text-brand-textSoft font-mono", title: `${count} düğüm`, children: [_jsx("span", { className: "text-brand-mutedSoft", children: type }), _jsx("span", { className: "text-brand-accent font-bold tabular-nums", children: count })] }, type)))] }))] }), _jsxs("div", { className: "flex items-center bg-brand-bg/40 border border-brand-border rounded-md p-0.5 mt-3 w-fit", children: [_jsx(ViewTabBtn, { active: tab === 'nodes', onClick: () => setTab('nodes'), icon: "circle", label: "D\u00FC\u011F\u00FCmler", count: filteredNodes.length }), _jsx(ViewTabBtn, { active: tab === 'edges', onClick: () => setTab('edges'), icon: "share", label: "\u0130li\u015Fkiler", count: filteredEdges.length }), _jsx(ViewTabBtn, { active: tab === 'visual', onClick: () => setTab('visual'), icon: "hub", label: "G\u00F6rsel Grafik", count: nodes.length })] })] }), _jsxs("div", { className: "flex-1 overflow-hidden flex", children: [_jsxs("div", { className: `flex-1 min-w-0 relative ${tab === 'visual' ? 'overflow-hidden p-0' : 'overflow-y-auto p-3'}`, children: [loading && (_jsxs("div", { className: "flex items-center justify-center gap-2 text-sm text-brand-muted py-12", children: [_jsx(Icon, { name: "progress_activity", size: 14, className: "animate-spin-slow" }), _jsx("span", { children: "Y\u00FCkleniyor..." })] })), error && (_jsxs("div", { className: "p-3 text-xs rounded-lg border border-brand-danger/40 bg-brand-danger/5 text-brand-danger flex items-start gap-2", children: [_jsx(Icon, { name: "error", size: 14, weight: 500, filled: true, className: "flex-shrink-0 mt-px" }), _jsx("span", { className: "leading-relaxed", children: error })] })), !loading && !error && nodes.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center text-center py-16 gap-3", children: [_jsx(Icon, { name: "hub", size: 40, weight: 300, className: "text-brand-mutedSoft" }), _jsx("h3", { className: "text-sm font-semibold text-brand-text", children: "Hen\u00FCz knowledge graph yok" }), _jsxs("p", { className: "text-[11px] text-brand-mutedSoft max-w-md leading-relaxed", children: ["Ajanlar", ' ', _jsx("code", { className: "px-1.5 py-0.5 rounded bg-brand-panelAlt border border-brand-border font-mono text-brand-accent text-[10px]", children: "kg_add_entity" }), ' ', "ve", ' ', _jsx("code", { className: "px-1.5 py-0.5 rounded bg-brand-panelAlt border border-brand-border font-mono text-brand-accent text-[10px]", children: "kg_add_relation" }), ' ', "ara\u00E7lar\u0131yla bilgi graf\u0131n\u0131 b\u00FCy\u00FCtebilir."] })] })), !loading &&
                                    !error &&
                                    nodes.length > 0 &&
                                    filteredNodes.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center text-center py-12 gap-2", children: [_jsx(Icon, { name: "search_off", size: 28, weight: 300, className: "text-brand-mutedSoft" }), _jsx("span", { className: "text-xs text-brand-mutedSoft", children: "E\u015Fle\u015Fen d\u00FC\u011F\u00FCm yok" }), _jsx("button", { onClick: () => setSearch(''), className: "text-[10.5px] text-brand-accent hover:underline", children: "Aramay\u0131 temizle" })] })), !loading && tab === 'nodes' && filteredNodes.length > 0 && (_jsx("div", { className: "space-y-1", children: filteredNodes.map((n) => {
                                        const id = String(n.data.id);
                                        const label = String(n.data.label || id);
                                        const type = String(n.data.type || '');
                                        const incomingCount = edges.filter((e) => String(e.data.target) === id).length;
                                        const outgoingCount = edges.filter((e) => String(e.data.source) === id).length;
                                        const active = selectedNodeId === id;
                                        return (_jsxs("button", { onClick: () => setSelectedNodeId(active ? null : id), className: `group w-full text-left px-3 py-2 rounded-md transition-all flex items-center gap-2.5 relative ${active
                                                ? 'bg-brand-accent/10 ring-1 ring-brand-accent/40'
                                                : 'hover:bg-brand-panelAlt'}`, children: [active && (_jsx("span", { className: "absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-brand-accent" })), _jsx("div", { className: `w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${active
                                                        ? 'bg-brand-accent/20 text-brand-accent'
                                                        : 'bg-brand-panelAlt text-brand-mutedSoft group-hover:text-brand-accent'}`, children: _jsx(Icon, { name: "circle", size: 11, weight: 550, filled: true }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: `text-[12px] font-semibold truncate leading-tight ${active ? 'text-brand-text' : 'text-brand-text'}`, children: label }), _jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-brand-mutedSoft mt-0.5", children: [_jsx("code", { className: "font-mono truncate", children: id }), type && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-brand-border", children: "\u00B7" }), _jsx("span", { className: "font-mono", children: type })] }))] })] }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0 text-[10px] font-mono text-brand-mutedSoft tabular-nums", children: [incomingCount > 0 && (_jsxs("span", { className: "inline-flex items-center gap-0.5", title: "Gelen ili\u015Fki", children: [_jsx(Icon, { name: "south_west", size: 11, weight: 500 }), incomingCount] })), outgoingCount > 0 && (_jsxs("span", { className: "inline-flex items-center gap-0.5", title: "Giden ili\u015Fki", children: [_jsx(Icon, { name: "north_east", size: 11, weight: 500 }), outgoingCount] }))] })] }, id));
                                    }) })), !loading && tab === 'edges' && filteredEdges.length > 0 && (_jsx("div", { className: "space-y-1", children: filteredEdges.map((e) => {
                                        const rel = String(e.data.relation || e.data.label || 'ilişki');
                                        return (_jsx("div", { className: "px-3 py-2 rounded-md hover:bg-brand-panelAlt transition-colors group", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("code", { className: "text-[11px] font-mono text-brand-text bg-brand-panelAlt px-2 h-6 inline-flex items-center rounded border border-brand-border truncate max-w-[35%]", children: String(e.data.source) }), _jsxs("span", { className: "flex items-center gap-1 flex-shrink-0", children: [_jsx(Icon, { name: "arrow_forward", size: 12, weight: 500, className: "text-brand-mutedSoft" }), _jsx("span", { className: "text-[10px] font-mono italic text-brand-accent px-1", children: rel }), _jsx(Icon, { name: "arrow_forward", size: 12, weight: 500, className: "text-brand-mutedSoft" })] }), _jsx("code", { className: "text-[11px] font-mono text-brand-text bg-brand-panelAlt px-2 h-6 inline-flex items-center rounded border border-brand-border truncate max-w-[35%]", children: String(e.data.target) })] }) }, String(e.data.id)));
                                    }) })), !loading && !error && tab === 'visual' && nodes.length > 0 && (_jsx(InteractiveGraphCanvas, { nodes: nodes, edges: edges, selectedNodeId: selectedNodeId, onSelectNode: setSelectedNodeId }))] }), selectedNodeId && selectedNodeNeighbors && (_jsxs("aside", { className: "w-72 flex-shrink-0 border-l border-brand-border bg-brand-panel overflow-y-auto p-3.5 space-y-3 animate-slide-in-right", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-[10px] uppercase tracking-wider text-brand-mutedSoft font-bold inline-flex items-center gap-1.5", children: [_jsx(Icon, { name: "info", size: 11, weight: 500 }), "Detay"] }), _jsx("button", { onClick: () => setSelectedNodeId(null), className: "w-6 h-6 rounded inline-flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all", title: "Kapat", children: _jsx(Icon, { name: "close", size: 13, weight: 550 }) })] }), (() => {
                                    const n = nodes.find((x) => String(x.data.id) === selectedNodeId);
                                    if (!n)
                                        return null;
                                    const label = String(n.data.label || n.data.id);
                                    const type = String(n.data.type || '');
                                    return (_jsxs("div", { className: "rounded-lg border border-brand-accent/30 bg-brand-accent/5 p-3", children: [_jsx("div", { className: "text-[12.5px] font-semibold text-brand-text leading-tight", children: label }), _jsxs("div", { className: "mt-1.5 space-y-1 text-[10px] text-brand-mutedSoft font-mono", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Icon, { name: "tag", size: 10, weight: 500 }), _jsx("span", { children: n.data.id })] }), type && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Icon, { name: "category", size: 10, weight: 500 }), _jsx("span", { children: type })] }))] })] }));
                                })(), selectedNodeNeighbors.incoming.length > 0 && (_jsx(NeighborSection, { icon: "south_west", title: "Gelen", count: selectedNodeNeighbors.incoming.length, children: selectedNodeNeighbors.incoming.map((e) => (_jsxs("button", { onClick: () => setSelectedNodeId(String(e.data.source)), className: "w-full text-left px-2 py-1.5 rounded-md hover:bg-brand-panelAlt transition-colors group", children: [_jsx("code", { className: "text-[10px] font-mono text-brand-text truncate block", children: String(e.data.source) }), _jsxs("div", { className: "text-[9.5px] italic text-brand-accent truncate mt-0.5", children: ["\u2014 ", String(e.data.relation || e.data.label || 'ilişki'), " \u2192"] })] }, String(e.data.id)))) })), selectedNodeNeighbors.outgoing.length > 0 && (_jsx(NeighborSection, { icon: "north_east", title: "Giden", count: selectedNodeNeighbors.outgoing.length, children: selectedNodeNeighbors.outgoing.map((e) => (_jsxs("button", { onClick: () => setSelectedNodeId(String(e.data.target)), className: "w-full text-left px-2 py-1.5 rounded-md hover:bg-brand-panelAlt transition-colors", children: [_jsxs("div", { className: "text-[9.5px] italic text-brand-accent truncate", children: ["\u2192 ", String(e.data.relation || e.data.label || 'ilişki'), " \u2192"] }), _jsx("code", { className: "text-[10px] font-mono text-brand-text truncate block mt-0.5", children: String(e.data.target) })] }, String(e.data.id)))) })), selectedNodeNeighbors.incoming.length === 0 &&
                                    selectedNodeNeighbors.outgoing.length === 0 && (_jsx("div", { className: "text-[10.5px] text-brand-mutedSoft text-center py-4 italic", children: "Bu d\u00FC\u011F\u00FCm\u00FCn ili\u015Fkisi yok" }))] }))] }), _jsxs("footer", { className: "px-5 py-2.5 border-t border-brand-border bg-brand-panel/40 flex items-center justify-between", children: [_jsxs("div", { className: "text-[10px] text-brand-mutedSoft inline-flex items-center gap-1.5", children: [_jsx(Icon, { name: "info", size: 11, weight: 500 }), _jsx("span", { children: "Bir d\u00FC\u011F\u00FCme t\u0131klayarak detay\u0131n\u0131 g\u00F6rebilirsin" })] }), _jsxs("button", { onClick: onClose, className: "h-8 px-3 inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-md border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95", children: [_jsx(Icon, { name: "close", size: 13, weight: 550 }), "Kapat"] })] })] }) }));
}
// ============================================================
// Yardımcılar
// ============================================================
function ViewTabBtn({ active, onClick, icon, label, count }) {
    return (_jsxs("button", { onClick: onClick, className: `h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold rounded transition-all ${active
            ? 'bg-brand-accent/15 text-brand-accent'
            : 'text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt'}`, children: [_jsx(Icon, { name: icon, size: 12, weight: 550, filled: active }), _jsx("span", { children: label }), _jsx("span", { className: `text-[9.5px] font-mono tabular-nums px-1.5 h-4 inline-flex items-center rounded ${active
                    ? 'bg-brand-accent/20 text-brand-accent'
                    : 'bg-brand-panelAlt text-brand-mutedSoft'}`, children: count })] }));
}
function NeighborSection({ icon, title, count, children }) {
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1.5 mb-1.5 px-1", children: [_jsx(Icon, { name: icon, size: 11, weight: 500, className: "text-brand-mutedSoft" }), _jsx("h4", { className: "text-[10px] font-bold text-brand-mutedSoft uppercase tracking-wider", children: title }), _jsx("span", { className: "ml-auto text-[9.5px] font-mono font-bold tabular-nums px-1.5 h-4 inline-flex items-center rounded bg-brand-panelAlt text-brand-textSoft", children: count })] }), _jsx("div", { className: "space-y-0.5", children: children })] }));
}
const TYPE_COLORS = {
    concept: '#38bdf8', // light blue
    person: '#fb7185', // rose
    kisi: '#fb7185',
    tool: '#34d399', // emerald
    arac: '#34d399',
    document: '#fbbf24', // amber
    dokuman: '#fbbf24',
    project: '#a78bfa', // purple
    proje: '#a78bfa',
};
function InteractiveGraphCanvas({ nodes, edges, selectedNodeId, onSelectNode, }) {
    const canvasRef = useRef(null);
    const physNodesRef = useRef([]);
    const dragNodeIdRef = useRef(null);
    const panOffsetRef = useRef({ x: 0, y: 0 });
    const scaleRef = useRef(1);
    const isPanningRef = useRef(false);
    const startPanRef = useRef({ x: 0, y: 0 });
    const mousePosRef = useRef({ x: 0, y: 0 });
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const clickStartRef = useRef(null);
    useEffect(() => {
        const currentNodes = nodes.map((n) => {
            const id = String(n.data.id);
            const label = String(n.data.label || n.data.id);
            const type = String(n.data.type || 'concept');
            const existing = physNodesRef.current.find((x) => x.id === id);
            if (existing) {
                return { ...existing, label, type };
            }
            const angle = Math.random() * Math.PI * 2;
            const radius = 50 + Math.random() * 80;
            return {
                id,
                label,
                type,
                x: 350 + Math.cos(angle) * radius,
                y: 250 + Math.sin(angle) * radius,
                vx: 0,
                vy: 0,
                fx: 0,
                fy: 0,
            };
        });
        physNodesRef.current = currentNodes;
    }, [nodes]);
    useEffect(() => {
        let animId;
        const tick = () => {
            const canvas = canvasRef.current;
            if (!canvas) {
                animId = requestAnimationFrame(tick);
                return;
            }
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                animId = requestAnimationFrame(tick);
                return;
            }
            const pNodes = physNodesRef.current;
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;
            const centerY = height / 2;
            const kRepulsion = 2200;
            const kAttraction = 0.05;
            const kGravity = 0.015;
            const restLength = 110;
            const damping = 0.85;
            for (let i = 0; i < pNodes.length; i++) {
                const u = pNodes[i];
                for (let j = i + 1; j < pNodes.length; j++) {
                    const v = pNodes[j];
                    let dx = v.x - u.x;
                    let dy = v.y - u.y;
                    if (dx === 0)
                        dx = 0.1;
                    const distSqr = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSqr);
                    if (dist < 1)
                        continue;
                    const force = kRepulsion / distSqr;
                    const fx = (dx / dist) * force;
                    const fy = (dy / dist) * force;
                    u.fx -= fx;
                    u.fy -= fy;
                    v.fx += fx;
                    v.fy += fy;
                }
            }
            edges.forEach((e) => {
                const srcId = String(e.data.source);
                const tgtId = String(e.data.target);
                const u = pNodes.find((n) => n.id === srcId);
                const v = pNodes.find((n) => n.id === tgtId);
                if (!u || !v)
                    return;
                let dx = v.x - u.x;
                let dy = v.y - u.y;
                if (dx === 0)
                    dx = 0.1;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 1)
                    return;
                const force = kAttraction * (dist - restLength);
                const fx = (dx / dist) * force;
                const fy = (dy / dist) * force;
                u.fx += fx;
                u.fy += fy;
                v.fx -= fx;
                v.fy -= fy;
            });
            pNodes.forEach((u) => {
                const dx = centerX - u.x;
                const dy = centerY - u.y;
                u.fx += dx * kGravity;
                u.fy += dy * kGravity;
            });
            pNodes.forEach((u) => {
                if (u.id === dragNodeIdRef.current) {
                    u.vx = 0;
                    u.vy = 0;
                    u.fx = 0;
                    u.fy = 0;
                    return;
                }
                u.vx = (u.vx + u.fx) * damping;
                u.vy = (u.vy + u.fy) * damping;
                const speed = Math.sqrt(u.vx * u.vx + u.vy * u.vy);
                if (speed > 12) {
                    u.vx = (u.vx / speed) * 12;
                    u.vy = (u.vy / speed) * 12;
                }
                u.x += u.vx;
                u.y += u.vy;
                u.fx = 0;
                u.fy = 0;
            });
            const parent = canvas.parentElement;
            if (parent) {
                const rect = parent.getBoundingClientRect();
                if (canvas.width !== rect.width || canvas.height !== rect.height) {
                    canvas.width = rect.width;
                    canvas.height = rect.height;
                }
            }
            ctx.clearRect(0, 0, width, height);
            ctx.save();
            ctx.translate(panOffsetRef.current.x, panOffsetRef.current.y);
            ctx.scale(scaleRef.current, scaleRef.current);
            edges.forEach((e) => {
                const srcId = String(e.data.source);
                const tgtId = String(e.data.target);
                const u = pNodes.find((n) => n.id === srcId);
                const v = pNodes.find((n) => n.id === tgtId);
                if (!u || !v)
                    return;
                ctx.beginPath();
                ctx.moveTo(u.x, u.y);
                ctx.lineTo(v.x, v.y);
                ctx.strokeStyle = selectedNodeId === u.id || selectedNodeId === v.id ? 'rgba(56, 189, 248, 0.45)' : 'rgba(148, 163, 184, 0.15)';
                ctx.lineWidth = selectedNodeId === u.id || selectedNodeId === v.id ? 2.0 : 1.0;
                ctx.stroke();
                const midX = (u.x + v.x) / 2;
                const midY = (u.y + v.y) / 2;
                const label = String(e.data.relation || e.data.label || '');
                if (label && scaleRef.current > 0.5) {
                    ctx.font = 'italic 7px monospace';
                    ctx.fillStyle = '#64748b';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(label, midX, midY - 6);
                }
                const r = 16;
                const angle = Math.atan2(v.y - u.y, v.x - u.x);
                const arrowX = v.x - r * Math.cos(angle);
                const arrowY = v.y - r * Math.sin(angle);
                ctx.beginPath();
                ctx.moveTo(arrowX, arrowY);
                ctx.lineTo(arrowX - 6 * Math.cos(angle - Math.PI / 8), arrowY - 6 * Math.sin(angle - Math.PI / 8));
                ctx.lineTo(arrowX - 6 * Math.cos(angle + Math.PI / 8), arrowY - 6 * Math.sin(angle + Math.PI / 8));
                ctx.closePath();
                ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
                ctx.fill();
            });
            pNodes.forEach((u) => {
                const isSelected = selectedNodeId === u.id;
                const color = TYPE_COLORS[u.type.toLowerCase()] || '#94a3b8';
                if (isSelected) {
                    ctx.beginPath();
                    ctx.arc(u.x, u.y, 14, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
                    ctx.fill();
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.arc(u.x, u.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
                ctx.strokeStyle = '#1e293b';
                ctx.lineWidth = 1.0;
                ctx.stroke();
                ctx.font = isSelected ? 'bold 9px sans-serif' : '9px sans-serif';
                ctx.fillStyle = isSelected ? '#38bdf8' : '#e2e8f0';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(u.label, u.x, u.y + 11);
                if (u.type && u.type !== 'concept' && scaleRef.current > 0.6) {
                    ctx.font = '6px monospace';
                    ctx.fillStyle = '#64748b';
                    ctx.fillText(u.type.toUpperCase(), u.x, u.y + 22);
                }
            });
            ctx.restore();
            animId = requestAnimationFrame(tick);
        };
        animId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animId);
    }, [edges, selectedNodeId]);
    const screenToWorld = (screenX, screenY) => {
        const canvas = canvasRef.current;
        if (!canvas)
            return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const x = (screenX - rect.left - panOffsetRef.current.x) / scaleRef.current;
        const y = (screenY - rect.top - panOffsetRef.current.y) / scaleRef.current;
        return { x, y };
    };
    const handleMouseDown = (e) => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const worldPos = screenToWorld(e.clientX, e.clientY);
        clickStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
        const clickedNode = physNodesRef.current.find((u) => {
            const dx = u.x - worldPos.x;
            const dy = u.y - worldPos.y;
            return dx * dx + dy * dy <= 225;
        });
        if (clickedNode) {
            dragNodeIdRef.current = clickedNode.id;
        }
        else {
            isPanningRef.current = true;
            startPanRef.current = { x: e.clientX - panOffsetRef.current.x, y: e.clientY - panOffsetRef.current.y };
        }
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseMove = (e) => {
        if (dragNodeIdRef.current) {
            const worldPos = screenToWorld(e.clientX, e.clientY);
            const draggedNode = physNodesRef.current.find((u) => u.id === dragNodeIdRef.current);
            if (draggedNode) {
                draggedNode.x = worldPos.x;
                draggedNode.y = worldPos.y;
            }
        }
        else if (isPanningRef.current) {
            panOffsetRef.current = {
                x: e.clientX - startPanRef.current.x,
                y: e.clientY - startPanRef.current.y,
            };
        }
        mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseUp = (e) => {
        if (clickStartRef.current) {
            const dx = Math.abs(e.clientX - clickStartRef.current.x);
            const dy = Math.abs(e.clientY - clickStartRef.current.y);
            const dt = Date.now() - clickStartRef.current.time;
            if (dx < 5 && dy < 5 && dt < 250) {
                const worldPos = screenToWorld(e.clientX, e.clientY);
                const clickedNode = physNodesRef.current.find((u) => {
                    const ndx = u.x - worldPos.x;
                    const ndy = u.y - worldPos.y;
                    return ndx * ndx + ndy * ndy <= 225;
                });
                onSelectNode(clickedNode ? clickedNode.id : null);
            }
        }
        dragNodeIdRef.current = null;
        isPanningRef.current = false;
        clickStartRef.current = null;
    };
    const handleWheel = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
        const newScale = Math.min(Math.max(0.15, scaleRef.current * zoomFactor), 4.5);
        panOffsetRef.current = {
            x: mouseX - (mouseX - panOffsetRef.current.x) * (newScale / scaleRef.current),
            y: mouseY - (mouseY - panOffsetRef.current.y) * (newScale / scaleRef.current),
        };
        scaleRef.current = newScale;
    };
    return (_jsxs("div", { className: "w-full h-full relative overflow-hidden bg-brand-bg/20 select-none", children: [_jsx("canvas", { ref: canvasRef, onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, onMouseLeave: handleMouseUp, onWheel: handleWheel, className: "w-full h-full block cursor-grab active:cursor-grabbing" }), _jsxs("div", { className: "absolute left-3 bottom-3 p-2 bg-brand-panel/90 border border-brand-border rounded text-[9px] text-brand-mutedSoft pointer-events-none select-none flex flex-col gap-1 backdrop-blur-sm max-w-[200px]", children: [_jsx("div", { className: "font-semibold text-brand-textSoft uppercase tracking-wider mb-0.5", children: "Kontroller" }), _jsx("div", { children: "\u2022 Zoom: Fare Tekerlegi" }), _jsx("div", { children: "\u2022 Pan: Arka plana tikla & surukle" }), _jsx("div", { children: "\u2022 Konum: Dugumu tutup surukle" }), _jsx("div", { children: "\u2022 Detay: Dugume tikla" })] })] }));
}
