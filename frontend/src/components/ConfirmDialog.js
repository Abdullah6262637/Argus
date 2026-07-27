import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Icon } from './Icon';
export function ConfirmDialog({ open, title, message, confirmLabel = 'Onayla', cancelLabel = 'Iptal', variant = 'default', onConfirm, onCancel, details, requireTypeText, typedText = '', onTypedTextChange, hideCancel = false, }) {
    // ESC ile kapat
    useEffect(() => {
        if (!open)
            return;
        const onEsc = (e) => {
            if (e.key === 'Escape')
                onCancel();
        };
        document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
    }, [open, onCancel]);
    if (!open)
        return null;
    const isDanger = variant === 'danger';
    const confirmDisabled = !!requireTypeText && typedText.trim() !== requireTypeText.trim();
    return (_jsx("div", { className: "fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-backdrop-in", children: _jsxs("div", { className: "w-full max-w-md rounded-lg border border-brand-borderStrong bg-brand-panel shadow-2xl overflow-hidden animate-modal-in", children: [_jsxs("div", { className: `px-5 py-3 border-b border-brand-border flex items-center gap-3 ${isDanger ? 'bg-brand-danger/10' : 'bg-brand-panelAlt'}`, children: [_jsx("div", { className: `w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDanger
                                ? 'bg-brand-danger/20 text-brand-danger'
                                : 'bg-brand-accent/15 text-brand-accent'}`, children: _jsx(Icon, { name: isDanger ? 'warning' : 'info', size: 22, filled: true }) }), _jsx("div", { children: _jsx("h3", { className: "text-sm font-semibold text-brand-text", children: title }) })] }), _jsxs("div", { className: "p-5 space-y-3 text-sm text-brand-textSoft leading-relaxed", children: [_jsx("div", { children: message }), details && (_jsx("div", { className: "rounded border border-brand-border bg-brand-panelAlt p-3 text-xs text-brand-muted", children: details })), requireTypeText && (_jsxs("div", { className: "space-y-1.5 pt-2", children: [_jsxs("div", { className: "text-xs text-brand-textSoft", children: ["Devam etmek icin asagiya", ' ', _jsx("code", { className: "text-brand-accent bg-brand-panelAlt px-1.5 py-0.5 rounded font-mono", children: requireTypeText }), ' ', "yaz:"] }), _jsx("input", { type: "text", value: typedText, onChange: (e) => onTypedTextChange?.(e.target.value), placeholder: requireTypeText, className: "w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent transition font-mono", autoFocus: true })] }))] }), _jsxs("div", { className: "flex items-center justify-end gap-2 px-5 py-3 border-t border-brand-border bg-brand-panelAlt", children: [!hideCancel && (_jsx("button", { onClick: onCancel, className: "px-4 py-2 text-sm rounded border border-brand-border text-brand-textSoft hover:text-brand-text hover:border-brand-borderStrong transition", children: cancelLabel })), _jsx("button", { onClick: onConfirm, disabled: confirmDisabled, className: `px-5 py-2 text-sm rounded font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${isDanger
                                ? 'bg-brand-danger text-white hover:bg-brand-danger/80'
                                : 'bg-brand-accent text-brand-bg hover:bg-brand-accentDim'}`, children: confirmLabel })] })] }) }));
}
