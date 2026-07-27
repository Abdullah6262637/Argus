import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// AgentInspector: kurumsal sade ajan denetim paneli (Linear/Vercel tarzı)
import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';
import { getModelLogo } from '../utils/modelHelper';
export function AgentInspector({ agent }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!agent)
            return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        api
            .listLogs(agent.id, 200)
            .then((data) => {
            if (!cancelled)
                setLogs(data);
        })
            .catch((err) => {
            if (!cancelled)
                setError(err instanceof Error ? err.message : String(err));
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [agent?.id]);
    if (!agent) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center text-center py-10 gap-2", children: [_jsx(Icon, { name: "person_off", size: 28, weight: 300, className: "text-brand-mutedSoft" }), _jsx("div", { className: "text-xs text-brand-muted", children: "Bir ajan se\u00E7ili de\u011Fil" })] }));
    }
    // Tool stats
    const toolLogs = logs.filter((l) => l.event === 'tool_call');
    const stats = {};
    toolLogs.forEach((l) => {
        try {
            const p = JSON.parse(l.payload_json || '{}');
            const name = p.tool || 'unknown';
            if (!stats[name])
                stats[name] = { name, count: 0, ok: 0, error: 0, avg_ms: 0 };
            stats[name].count++;
            if (p.ok)
                stats[name].ok++;
            else
                stats[name].error++;
            stats[name].avg_ms =
                (stats[name].avg_ms * (stats[name].count - 1) + (p.duration_ms || 0)) /
                    stats[name].count;
        }
        catch {
            /* ignore */
        }
    });
    const sortedStats = Object.values(stats).sort((a, b) => b.count - a.count);
    const errorLogs = logs.filter((l) => l.level === 'error').slice(0, 5);
    const totalToolCalls = toolLogs.length;
    const okSum = sortedStats.reduce((acc, s) => acc + s.ok, 0);
    const successRate = totalToolCalls > 0 ? Math.round((okSum / totalToolCalls) * 100) : 0;
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "px-0.5", children: [_jsx("div", { className: "text-[12.5px] font-semibold text-brand-text leading-tight truncate", children: agent.name }), _jsxs("div", { className: "text-[10px] font-mono text-brand-mutedSoft truncate mt-0.5 flex items-center gap-1", children: [_jsx("img", { src: getModelLogo(agent.model, agent.provider), alt: "", className: "w-3.5 h-3.5 object-contain rounded-sm" }), _jsxs("span", { children: [agent.provider, "/", agent.model] })] })] }), _jsxs("div", { className: "grid grid-cols-3 rounded-lg border border-brand-border bg-brand-panel/40 overflow-hidden", children: [_jsx(Metric, { label: "Log", value: logs.length }), _jsx(Metric, { label: "Tool", value: totalToolCalls, divider: true }), _jsx(Metric, { label: "Hata", value: errorLogs.length, tone: errorLogs.length > 0 ? 'danger' : 'default', divider: true })] }), totalToolCalls > 0 && (_jsxs("div", { className: "px-0.5", children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-[9.5px] uppercase tracking-wider text-brand-mutedSoft font-bold", children: "Ba\u015Far\u0131 oran\u0131" }), _jsxs("span", { className: `text-[11px] font-mono font-bold tabular-nums ${successRate >= 90
                                    ? 'text-brand-success'
                                    : successRate >= 70
                                        ? 'text-yellow-500'
                                        : 'text-brand-danger'}`, children: ["%", successRate] })] }), _jsx("div", { className: "h-[3px] rounded-full bg-brand-border overflow-hidden", children: _jsx("div", { className: `h-full transition-all duration-500 ${successRate >= 90
                                ? 'bg-brand-success'
                                : successRate >= 70
                                    ? 'bg-yellow-500'
                                    : 'bg-brand-danger'}`, style: { width: `${successRate}%` } }) })] })), _jsx(Section, { title: "Tool Kullan\u0131m\u0131", count: sortedStats.length, children: loading ? (_jsx(SectionLoading, {})) : error ? (_jsx(SectionError, { text: error })) : sortedStats.length === 0 ? (_jsx(SectionEmpty, { text: "Hen\u00FCz tool kullan\u0131m\u0131 yok" })) : (_jsx("div", { className: "rounded-md border border-brand-border bg-brand-panel/40 divide-y divide-brand-border/40 overflow-hidden", children: sortedStats.slice(0, 8).map((s) => (_jsx(ToolStatRow, { stat: s }, s.name))) })) }), _jsx(Section, { title: "Son Hatalar", count: errorLogs.length, children: errorLogs.length === 0 ? (_jsx(SectionEmpty, { text: "Hata yok" })) : (_jsx("div", { className: "rounded-md border border-brand-border bg-brand-panel/40 divide-y divide-brand-border/40 overflow-hidden", children: errorLogs.map((l) => (_jsx(ErrorRow, { log: l }, l.id))) })) })] }));
}
// ============================================================
// Yardımcı Bileşenler
// ============================================================
/** 3'lü metrik gridi için tek hücre. */
function Metric({ label, value, tone = 'default', divider }) {
    const valueClass = tone === 'danger' && value > 0
        ? 'text-brand-danger'
        : 'text-brand-text';
    return (_jsxs("div", { className: `px-2.5 py-2 text-center ${divider ? 'border-l border-brand-border' : ''}`, children: [_jsx("div", { className: `text-base font-bold font-mono tabular-nums ${valueClass} leading-none`, children: value }), _jsx("div", { className: "text-[9.5px] text-brand-mutedSoft uppercase tracking-wider font-semibold mt-1", children: label })] }));
}
/** Section başlığı: label + opsiyonel count badge */
function Section({ title, count, children }) {
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1.5 px-0.5", children: [_jsx("h4", { className: "text-[9.5px] font-bold text-brand-mutedSoft uppercase tracking-wider", children: title }), count !== undefined && count > 0 && (_jsx("span", { className: "text-[9.5px] font-mono tabular-nums text-brand-mutedSoft", children: count }))] }), children] }));
}
function SectionLoading() {
    return (_jsxs("div", { className: "flex items-center justify-center gap-1.5 text-[11px] text-brand-mutedSoft py-3", children: [_jsx(Icon, { name: "progress_activity", size: 11, className: "animate-spin-slow" }), _jsx("span", { children: "Y\u00FCkleniyor" })] }));
}
function SectionError({ text }) {
    return (_jsxs("div", { className: "text-[11px] text-brand-danger flex items-start gap-1.5 px-2 py-2 rounded-md border border-brand-danger/30 bg-brand-danger/5", children: [_jsx(Icon, { name: "error", size: 11, weight: 500, filled: true, className: "flex-shrink-0 mt-px" }), _jsx("span", { className: "leading-relaxed", children: text })] }));
}
function SectionEmpty({ text }) {
    return (_jsx("div", { className: "text-center text-[11px] text-brand-mutedSoft py-3", children: text }));
}
/** Tool kullanım satırı — tek satır + alt progress bar */
function ToolStatRow({ stat }) {
    const okRatio = stat.count > 0 ? (stat.ok / stat.count) * 100 : 0;
    return (_jsxs("div", { className: "hover:bg-brand-panelAlt/50 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-2 px-2 py-1.5", children: [_jsx("code", { className: "text-[11px] font-mono text-brand-text truncate flex-1 font-medium", children: stat.name }), _jsx("span", { className: "text-[10px] font-mono tabular-nums font-bold text-brand-success", children: stat.ok }), stat.error > 0 && (_jsx("span", { className: "text-[10px] font-mono tabular-nums font-bold text-brand-danger", children: stat.error })), _jsxs("span", { className: "text-[10px] font-mono tabular-nums text-brand-mutedSoft", children: [Math.round(stat.avg_ms), "ms"] })] }), _jsx("div", { className: "h-[2px] bg-brand-border", children: _jsx("div", { className: `h-full transition-all ${okRatio === 100
                        ? 'bg-brand-success'
                        : okRatio >= 50
                            ? 'bg-yellow-500'
                            : 'bg-brand-danger'}`, style: { width: `${okRatio}%` } }) })] }));
}
/** Hata log satırı — tek satır kompakt */
function ErrorRow({ log }) {
    const time = new Date(log.created_at).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    return (_jsxs("div", { className: "flex items-center gap-2 px-2 py-1.5 hover:bg-brand-panelAlt/50 transition-colors", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-brand-danger flex-shrink-0" }), _jsx("span", { className: "text-[10px] font-mono tabular-nums text-brand-mutedSoft flex-shrink-0", children: time }), _jsx("span", { className: "flex-1 text-[11px] text-brand-text truncate", children: log.event })] }));
}
