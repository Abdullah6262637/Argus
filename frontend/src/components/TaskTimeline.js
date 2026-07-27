import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// TaskTimeline: Kurumsal plan göstergesi
//
// Tasarım felsefesi:
// - Sade, az renkli, kurumsal (Linear / Vercel / Stripe tarzı)
// - Tek satır özet: durum + progress + meta
// - Collapsed: minimal numara dizisi
// - Expanded: temiz dikey liste, ikon + başlık + opsiyonel detay
import { useState } from 'react';
import { Icon } from './Icon';
const STATUS_CONFIG = {
    pending: {
        icon: 'radio_button_unchecked',
        color: 'text-brand-mutedSoft',
        bg: 'bg-transparent',
        border: 'border-brand-border'
    },
    running: {
        icon: 'progress_activity',
        color: 'text-brand-accent',
        bg: 'bg-brand-accent/10',
        border: 'border-brand-accent/40',
        animated: true
    },
    completed: {
        icon: 'check_circle',
        color: 'text-brand-success',
        bg: 'bg-brand-success/10',
        border: 'border-brand-success/30'
    },
    failed: {
        icon: 'cancel',
        color: 'text-brand-danger',
        bg: 'bg-brand-danger/10',
        border: 'border-brand-danger/30'
    },
    skipped: {
        icon: 'remove',
        color: 'text-brand-mutedSoft',
        bg: 'bg-transparent',
        border: 'border-brand-border'
    },
    awaiting_approval: {
        icon: 'pause_circle',
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30'
    }
};
/**
 * Tek satır step — kurumsal liste tarzı.
 * Sol: küçük ikon + numara · Orta: başlık · Sağ: meta
 */
function StepRow({ step }) {
    const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
    const isActive = step.status === 'running';
    return (_jsxs("div", { className: `flex items-center gap-2.5 px-3 py-2 transition-colors ${isActive ? 'bg-brand-accent/5' : 'hover:bg-brand-panelAlt/50'}`, children: [_jsx("div", { className: `w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg} ${cfg.color}`, children: _jsx(Icon, { name: cfg.icon, size: 13, weight: 550, filled: step.status !== 'pending' && step.status !== 'skipped', className: cfg.animated ? 'animate-spin-slow' : '' }) }), _jsx("span", { className: `text-[10px] font-mono font-semibold tabular-nums w-5 text-right ${cfg.color}`, children: String(step.id).padStart(2, '0') }), _jsx("div", { className: "flex-1 min-w-0", children: _jsx("div", { className: `text-[12px] truncate leading-tight ${isActive
                        ? 'text-brand-text font-semibold'
                        : step.status === 'pending'
                            ? 'text-brand-mutedSoft'
                            : 'text-brand-text font-medium'}`, children: step.title }) }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0 text-[10px] text-brand-mutedSoft font-mono tabular-nums", children: [step.attempts && step.attempts > 1 && (_jsxs("span", { className: "inline-flex items-center gap-0.5 text-yellow-500", title: "Yeniden deneme say\u0131s\u0131", children: [_jsx(Icon, { name: "refresh", size: 10, weight: 500 }), step.attempts] })), step.tool_calls && step.tool_calls.length > 0 && (_jsxs("span", { title: "Tool \u00E7a\u011Fr\u0131s\u0131 say\u0131s\u0131", children: [step.tool_calls.length, " ara\u00E7"] }))] })] }));
}
/**
 * Expanded mode için detaylı kart — başlık altında description/error/reflection.
 */
function StepDetail({ step }) {
    const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
    const hasDetails = (step.description && step.description !== step.title) ||
        step.error ||
        step.reflection ||
        (step.status === 'completed' && step.result);
    return (_jsxs("div", { className: `border-l-2 ${cfg.border.replace('border-', 'border-l-')} pl-3`, children: [_jsx(StepRow, { step: step }), hasDetails && (_jsxs("div", { className: "px-3 pb-2 space-y-1.5 -mt-1", children: [step.description && step.description !== step.title && step.status !== 'pending' && (_jsx("div", { className: "text-[10.5px] text-brand-mutedSoft leading-relaxed line-clamp-2", children: step.description })), step.status === 'completed' && step.result && (_jsx("div", { className: "text-[10.5px] text-brand-textSoft leading-relaxed line-clamp-2", children: step.result })), step.error && (_jsxs("div", { className: "flex items-start gap-1 text-[10.5px] text-brand-danger", children: [_jsx(Icon, { name: "error", size: 11, weight: 500, filled: true, className: "flex-shrink-0 mt-px" }), _jsx("span", { className: "leading-relaxed", children: step.error })] })), step.reflection && (_jsx("div", { className: "text-[10px] text-brand-mutedSoft italic leading-relaxed", children: step.reflection }))] }))] }));
}
export function TaskTimeline({ plan }) {
    const [expanded, setExpanded] = useState(false);
    if (!plan)
        return null;
    const completedCount = plan.steps.filter((s) => s.status === 'completed').length;
    const totalCount = plan.steps.length;
    const failedCount = plan.steps.filter((s) => s.status === 'failed').length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const planStatus = {
        completed: {
            color: 'text-brand-success',
            bg: 'bg-brand-success',
            label: 'Tamamlandı'
        },
        failed: {
            color: 'text-brand-danger',
            bg: 'bg-brand-danger',
            label: 'Başarısız'
        },
        running: {
            color: 'text-brand-accent',
            bg: 'bg-brand-accent',
            label: 'Çalışıyor',
            dotPulse: true
        },
        draft: {
            color: 'text-brand-mutedSoft',
            bg: 'bg-brand-mutedSoft',
            label: 'Taslak'
        }
    };
    const sc = planStatus[plan.status] || planStatus.draft;
    return (_jsxs("div", { className: "rounded-lg border border-brand-border bg-brand-panel overflow-hidden", children: [_jsxs("header", { className: "px-3.5 py-2.5 flex items-center gap-3 border-b border-brand-border", children: [_jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [_jsxs("span", { className: "relative flex w-2 h-2", children: [sc.dotPulse && (_jsx("span", { className: `absolute inline-flex h-full w-full rounded-full ${sc.bg} opacity-60 animate-ping` })), _jsx("span", { className: `relative inline-flex w-2 h-2 rounded-full ${sc.bg}` })] }), _jsx("span", { className: `text-[10px] uppercase tracking-wider font-bold ${sc.color}`, children: sc.label })] }), _jsx("div", { className: "w-px h-3.5 bg-brand-border flex-shrink-0" }), _jsx("div", { className: "flex-1 min-w-0", children: _jsx("div", { className: "text-[12px] font-semibold text-brand-text truncate leading-tight", children: plan.goal }) }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [_jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "text-[11px] font-mono font-semibold text-brand-text tabular-nums leading-none", children: [completedCount, _jsxs("span", { className: "text-brand-mutedSoft", children: ["/", totalCount] })] }), failedCount > 0 && (_jsxs("div", { className: "text-[9px] font-mono text-brand-danger font-semibold tabular-nums leading-none mt-0.5", children: [failedCount, " hata"] }))] }), _jsx("button", { onClick: () => setExpanded((v) => !v), className: "w-6 h-6 rounded flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-panelAlt transition-colors", title: expanded ? 'Daralt' : 'Genişlet', "aria-label": expanded ? 'Daralt' : 'Genişlet', children: _jsx(Icon, { name: expanded ? 'expand_less' : 'expand_more', size: 16, weight: 550 }) })] })] }), _jsx("div", { className: "relative h-[2px] bg-brand-border", children: _jsx("div", { className: `absolute inset-y-0 left-0 transition-all duration-500 ease-out ${plan.status === 'failed' ? 'bg-brand-danger' : 'bg-brand-accent'}`, style: { width: `${progress}%` } }) }), !expanded ? (
            // Collapsed: tüm step'ler tek satır liste
            _jsx("div", { className: "divide-y divide-brand-border", children: plan.steps.map((step) => (_jsx(StepRow, { step: step }, step.id))) })) : (
            // Expanded: detaylı liste, her step açıklamalı
            _jsx("div", { className: "divide-y divide-brand-border max-h-[360px] overflow-y-auto", children: plan.steps.map((step) => (_jsx(StepDetail, { step: step }, step.id))) }))] }));
}
