import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { api } from '@/api/client';
export function CoordinatorSuggestion({ message, currentAgentId, onAccept, onDismiss }) {
    const [loading, setLoading] = useState(true);
    const [suggestion, setSuggestion] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        const fetchSuggestion = async () => {
            if (!message.trim() || message.length < 10) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const result = await api.coordinatorRoute(message);
                if (cancelled)
                    return;
                // Eğer mevcut ajan zaten önerilen ajansa veya self_handled ise gösterme
                if (result.self_handled || result.primary === currentAgentId) {
                    setLoading(false);
                    return;
                }
                setSuggestion({
                    primary: result.primary,
                    reason: result.reason,
                    self_handled: result.self_handled
                });
            }
            catch (err) {
                if (cancelled)
                    return;
                console.error('Coordinator route hatası:', err);
                setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
            }
            finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        fetchSuggestion();
        return () => {
            cancelled = true;
        };
    }, [message, currentAgentId]);
    if (loading || error || !suggestion) {
        return null;
    }
    return (_jsx("div", { className: "mx-3 mb-2 p-3 rounded-xl border border-brand-accent/30 bg-brand-accent/5 backdrop-blur-sm animate-slide-in-down", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-lg bg-brand-accent/15 flex items-center justify-center", children: _jsx(Icon, { name: "route", size: 18, weight: 550, filled: true, className: "text-brand-accent" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("span", { className: "text-xs font-semibold text-brand-text", children: "Ajan \u00D6nerisi" }), _jsx("span", { className: "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-accent/20 text-brand-accent font-mono", children: "Coordinator" })] }), _jsx("p", { className: "text-[11.5px] text-brand-textSoft leading-relaxed mb-2", children: suggestion.reason }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: () => onAccept(suggestion.primary), className: "h-7 px-3 rounded-lg bg-brand-accent text-brand-bg text-[11px] font-semibold hover:bg-brand-accentDim active:scale-95 transition-all flex items-center gap-1.5", children: [_jsx(Icon, { name: "check", size: 14, weight: 600 }), _jsxs("span", { children: [suggestion.primary, " ajan\u0131na ge\u00E7"] })] }), _jsx("button", { onClick: onDismiss, className: "h-7 px-3 rounded-lg border border-brand-border text-brand-textSoft text-[11px] font-medium hover:bg-brand-panelAlt active:scale-95 transition-all", children: "Devam et" })] })] }), _jsx("button", { onClick: onDismiss, className: "flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-colors", title: "Kapat", children: _jsx(Icon, { name: "close", size: 14, weight: 500 }) })] }) }));
}
