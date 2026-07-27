import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';
export function SkillsTab() {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const loadSkills = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.listSkills();
            setSkills(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadSkills();
    }, []);
    const handleToggle = async (skill) => {
        try {
            const updated = await api.updateSkill(skill.id, { is_active: !skill.is_active });
            setSkills((prev) => prev.map((s) => (s.id === skill.id ? updated : s)));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };
    const handleDelete = async (skill) => {
        if (!confirm(`"${skill.name}" silinsin mi?`))
            return;
        try {
            await api.deleteSkill(skill.id);
            setSkills((prev) => prev.filter((s) => s.id !== skill.id));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };
    const filtered = skills.filter((s) => {
        if (filter === 'macro')
            return s.is_macro;
        if (filter === 'active')
            return s.is_active;
        return true;
    });
    const macroCount = skills.filter((s) => s.is_macro).length;
    const activeCount = skills.filter((s) => s.is_active).length;
    if (loading) {
        return (_jsxs("div", { className: "flex items-center justify-center gap-2 text-xs text-brand-muted py-6", children: [_jsx(Icon, { name: "progress_activity", size: 14, className: "animate-spin-slow" }), _jsx("span", { children: "Y\u00FCkleniyor..." })] }));
    }
    return (_jsxs("div", { className: "space-y-2", children: [error && (_jsxs("div", { className: "p-2.5 text-[11px] rounded-lg border border-brand-danger/40 bg-brand-danger/10 text-brand-danger flex items-start gap-2", children: [_jsx(Icon, { name: "error", size: 14, weight: 500, filled: true, className: "flex-shrink-0 mt-px" }), _jsx("span", { className: "leading-relaxed", children: error })] })), skills.length > 0 && (_jsxs("div", { className: "flex items-center bg-brand-bg/40 border border-brand-border rounded-lg p-0.5 gap-0.5", children: [_jsxs("button", { onClick: () => setFilter('all'), className: `flex-1 h-7 inline-flex items-center justify-center gap-1 text-[10.5px] font-semibold rounded-md transition-all ${filter === 'all'
                            ? 'bg-brand-accent/15 text-brand-accent'
                            : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt'}`, children: [_jsx("span", { children: "T\u00FCm\u00FC" }), _jsx("span", { className: "text-[9.5px] font-mono font-bold", children: skills.length })] }), _jsxs("button", { onClick: () => setFilter('macro'), className: `flex-1 h-7 inline-flex items-center justify-center gap-1 text-[10.5px] font-semibold rounded-md transition-all ${filter === 'macro'
                            ? 'bg-brand-accent/15 text-brand-accent'
                            : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt'}`, children: [_jsx(Icon, { name: "star", size: 11, weight: 500, filled: filter === 'macro' }), _jsx("span", { children: "Macro" }), _jsx("span", { className: "text-[9.5px] font-mono font-bold", children: macroCount })] }), _jsxs("button", { onClick: () => setFilter('active'), className: `flex-1 h-7 inline-flex items-center justify-center gap-1 text-[10.5px] font-semibold rounded-md transition-all ${filter === 'active'
                            ? 'bg-brand-accent/15 text-brand-accent'
                            : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt'}`, children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-brand-success" }), _jsx("span", { children: "Aktif" }), _jsx("span", { className: "text-[9.5px] font-mono font-bold", children: activeCount })] })] })), skills.length === 0 && !loading && (_jsxs("div", { className: "flex flex-col items-center justify-center text-center py-10 gap-2", children: [_jsx(Icon, { name: "school", size: 32, weight: 300, className: "text-brand-mutedSoft" }), _jsx("div", { className: "text-xs text-brand-muted", children: "Hen\u00FCz skill yok" }), _jsx("div", { className: "text-[10px] text-brand-mutedSoft max-w-[200px]", children: "Ba\u015Far\u0131l\u0131 plan'lar otomatik olarak skill olarak kaydedilir." })] })), filtered.map((skill) => (_jsx(SkillCard, { skill: skill, onToggle: () => handleToggle(skill), onDelete: () => handleDelete(skill) }, skill.id))), filtered.length === 0 && skills.length > 0 && (_jsx("div", { className: "text-center text-[11px] text-brand-mutedSoft py-6", children: "Bu filtre i\u00E7in skill yok" }))] }));
}
function SkillCard({ skill, onToggle, onDelete, }) {
    const [expanded, setExpanded] = useState(false);
    return (_jsxs("div", { className: `rounded-lg border bg-brand-panelAlt p-2.5 space-y-2 transition-all hover:border-brand-borderStrong ${skill.is_active ? 'border-brand-border' : 'border-brand-border opacity-60'}`, children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: `w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${skill.is_macro
                            ? 'bg-brand-accent/15 text-brand-accent'
                            : 'bg-brand-panelAlt text-brand-mutedSoft'}`, children: _jsx(Icon, { name: skill.is_macro ? 'star' : 'school', size: 15, weight: 600, filled: skill.is_macro }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "text-[11px] font-mono text-brand-text truncate leading-tight", children: skill.name }), skill.description && (_jsx("div", { className: "text-[10px] text-brand-mutedSoft mt-0.5 line-clamp-2 leading-snug", children: skill.description })), _jsxs("div", { className: "flex items-center gap-1.5 mt-1 text-[9.5px] text-brand-mutedSoft", children: [_jsx(Icon, { name: "repeat", size: 10, weight: 500 }), _jsxs("span", { className: "font-mono font-bold", children: [skill.success_count, "x"] }), _jsx("span", { className: "text-brand-border", children: "\u00B7" }), _jsx(Icon, { name: "build", size: 10, weight: 500 }), _jsxs("span", { className: "font-mono", children: [skill.tool_chain.length, " tool"] }), skill.is_macro && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-brand-border", children: "\u00B7" }), _jsx("span", { className: "text-brand-accent font-semibold", children: "MACRO" })] }))] })] })] }), skill.tool_chain.length > 0 && (_jsxs("button", { onClick: () => setExpanded((v) => !v), className: "w-full text-left text-[10px] text-brand-mutedSoft hover:text-brand-text transition-colors flex items-center gap-1", children: [_jsx(Icon, { name: expanded ? 'expand_less' : 'expand_more', size: 12, weight: 500 }), _jsx("span", { children: expanded ? 'Gizle' : 'Tool zincirini göster' })] })), expanded && (_jsx("div", { className: "space-y-1 animate-fade-in-up", children: skill.tool_chain.map((toolName, i) => (_jsxs("div", { className: "flex items-center gap-1.5 px-2 py-1 rounded-md bg-brand-bg/60 border border-brand-border", children: [_jsx("span", { className: "text-[9px] font-mono font-bold text-brand-mutedSoft w-4", children: i + 1 }), _jsx(Icon, { name: "build", size: 10, weight: 500, className: "text-brand-accent" }), _jsx("span", { className: "text-[10px] font-mono text-brand-text truncate", children: toolName })] }, i))) })), _jsxs("div", { className: "flex gap-1 pt-0.5", children: [_jsxs("button", { onClick: onToggle, title: skill.is_active ? 'Devre dışı bırak' : 'Etkinleştir', className: "flex-1 h-7 inline-flex items-center justify-center gap-1 text-[10.5px] font-semibold rounded-md border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-panel transition-all active:scale-95", children: [_jsx(Icon, { name: skill.is_active ? 'toggle_on' : 'toggle_off', size: 14, weight: 550, filled: true }), skill.is_active ? 'Aktif' : 'Pasif'] }), _jsx("button", { onClick: onDelete, title: "Sil", className: "h-7 w-7 inline-flex items-center justify-center rounded-md border border-brand-danger/30 text-brand-danger hover:bg-brand-danger/10 transition-all active:scale-95", children: _jsx(Icon, { name: "delete", size: 13, weight: 550 }) })] })] }));
}
