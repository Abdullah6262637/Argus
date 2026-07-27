import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { AgentInspector } from './AgentInspector';
import { Icon } from './Icon';
export function AgentInspectorModal({ open, onClose, agentId, agents }) {
    const modalRef = useRef(null);
    const agent = agents.find((a) => a.id === agentId) || null;
    // Escape key close listener
    useEffect(() => {
        if (!open)
            return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);
    // Click outside close listener
    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };
    if (!open || !agent)
        return null;
    return (_jsx("div", { onClick: handleBackdropClick, className: "fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in", children: _jsxs("div", { ref: modalRef, className: "bg-brand-bg border border-brand-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-modal-in ease-out duration-300", children: [_jsxs("header", { className: "px-5 py-4 border-b border-brand-border bg-brand-panel flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent shadow-[0_0_12px_rgba(20,163,127,0.15)]", children: _jsx(Icon, { name: "analytics", size: 16, weight: 600, filled: true }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-brand-text leading-tight", children: "Ajan Denetleme (Capabilities Inspector)" }), _jsx("p", { className: "text-[10px] text-brand-mutedSoft mt-0.5 leading-none", children: "Ajan \u00E7al\u0131\u015Fma loglar\u0131, API ba\u015Far\u0131 oranlar\u0131 ve yetenek analizi" })] })] }), _jsx("button", { onClick: onClose, className: "w-7 h-7 rounded-lg inline-flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95", title: "Kapat", children: _jsx(Icon, { name: "close", size: 14, weight: 600 }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-5", children: _jsx(AgentInspector, { agent: agent }) }), _jsxs("footer", { className: "px-5 py-3 border-t border-brand-border bg-brand-panel/30 flex items-center justify-between text-[10px] text-brand-mutedSoft", children: [_jsxs("span", { className: "font-mono", children: ["ID: ", agent.id] }), _jsx("button", { type: "button", onClick: onClose, className: "h-7 px-4 rounded-lg bg-brand-panelAlt hover:bg-brand-border border border-brand-border text-brand-text text-xs font-medium transition-all active:scale-95", children: "Kapat" })] })] }) }));
}
