import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ApprovalDialog: HITL onay kuyrugu (Material Symbols + animasyonlar)
import { useState } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';
const RISK_CONFIG = {
    high: {
        border: 'border-brand-danger/50',
        bg: 'bg-brand-danger/5',
        text: 'text-brand-danger',
        icon: 'gpp_maybe',
        label: 'Yüksek Risk'
    },
    medium: {
        border: 'border-yellow-500/50',
        bg: 'bg-yellow-500/5',
        text: 'text-yellow-500',
        icon: 'warning',
        label: 'Orta Risk'
    },
    low: {
        border: 'border-brand-accent/50',
        bg: 'bg-brand-accent/5',
        text: 'text-brand-accent',
        icon: 'shield',
        label: 'Düşük Risk'
    }
};
export function ApprovalDialog({ approvals, onResolved }) {
    const pending = approvals.filter((a) => a.status === 'pending');
    const [busy, setBusy] = useState(null);
    const [reason, setReason] = useState({});
    const [editMode, setEditMode] = useState({});
    const [editedArgs, setEditedArgs] = useState({});
    if (pending.length === 0)
        return null;
    const handle = async (id, approve) => {
        setBusy(id);
        try {
            const r = reason[id] || '';
            if (approve) {
                let parsedArgs = null;
                if (editedArgs[id] !== undefined) {
                    try {
                        parsedArgs = JSON.parse(editedArgs[id]);
                    }
                    catch (jsonErr) {
                        alert('Geçersiz JSON formatı! Lütfen girdiğiniz parametreleri kontrol edin.');
                        setBusy(null);
                        return;
                    }
                }
                await api.approveApproval(id, r, parsedArgs);
            }
            else {
                await api.rejectApproval(id, r || 'kullanici reddetti');
            }
            onResolved(id);
        }
        catch (err) {
            alert(err instanceof Error ? err.message : 'Hata');
        }
        finally {
            setBusy(null);
        }
    };
    return (_jsx("div", { className: "fixed bottom-4 right-4 z-40 max-w-md w-full space-y-2.5", children: pending.map((a) => {
            const cfg = RISK_CONFIG[a.risk_level] || RISK_CONFIG.medium;
            return (_jsxs("div", { className: `border rounded-xl p-3.5 shadow-2xl bg-brand-panel backdrop-blur-md ${cfg.border} ${cfg.bg} animate-slide-in-right`, children: [_jsxs("div", { className: "flex items-start gap-3 mb-2.5", children: [_jsx("div", { className: `w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.text} bg-current/10`, children: _jsx(Icon, { name: cfg.icon, size: 20, weight: 500, filled: true }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: `text-[10.5px] font-bold uppercase tracking-wider ${cfg.text}`, children: [cfg.label, " \u00B7 Onay Gerekli"] }), _jsxs("div", { className: "text-sm font-semibold text-brand-text mt-0.5 flex items-center gap-1.5", children: [_jsx(Icon, { name: "build", size: 14, weight: 500, className: "text-brand-mutedSoft" }), _jsx("span", { className: "font-mono truncate", children: a.tool_name })] })] }), _jsxs("span", { className: "text-[10px] text-brand-mutedSoft font-mono", children: ["#", a.id] })] }), _jsxs("div", { className: "mb-2.5", children: [_jsxs("div", { className: "text-[10px] uppercase tracking-wider text-brand-mutedSoft font-semibold mb-1 flex items-center justify-between", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Icon, { name: "data_object", size: 11, weight: 500 }), "Parametreler"] }), _jsxs("button", { type: "button", onClick: () => {
                                            const isEditing = !editMode[a.id];
                                            setEditMode({ ...editMode, [a.id]: isEditing });
                                            if (isEditing && editedArgs[a.id] === undefined) {
                                                setEditedArgs({ ...editedArgs, [a.id]: JSON.stringify(a.arguments, null, 2) });
                                            }
                                        }, className: "text-[10.5px] text-brand-accent hover:underline flex items-center gap-0.5", children: [_jsx(Icon, { name: editMode[a.id] ? 'visibility' : 'edit', size: 11 }), editMode[a.id] ? 'Görüntüle' : 'Düzenle'] })] }), editMode[a.id] ? (_jsx("textarea", { value: editedArgs[a.id] ?? JSON.stringify(a.arguments, null, 2), onChange: (e) => setEditedArgs({ ...editedArgs, [a.id]: e.target.value }), rows: 5, className: "w-full bg-black/30 font-mono border border-brand-border p-2 rounded-lg text-[10px] text-brand-text focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20" })) : (_jsx("pre", { className: "whitespace-pre-wrap font-mono bg-black/30 border border-brand-border p-2 rounded-lg text-[10px] text-brand-text max-h-32 overflow-y-auto", children: editedArgs[a.id] !== undefined ? editedArgs[a.id] : JSON.stringify(a.arguments, null, 2) }))] }), _jsx("input", { value: reason[a.id] || '', onChange: (e) => setReason({ ...reason, [a.id]: e.target.value }), placeholder: "Opsiyonel sebep / not", className: "w-full bg-brand-bg border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-text mb-2.5 placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { disabled: busy === a.id, onClick: () => handle(a.id, true), className: "flex-1 h-9 rounded-lg bg-brand-success/15 hover:bg-brand-success/25 text-brand-success text-xs font-semibold transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5", children: [_jsx(Icon, { name: "check_circle", size: 15, weight: 600, filled: true }), "Onayla"] }), _jsxs("button", { disabled: busy === a.id, onClick: () => handle(a.id, false), className: "flex-1 h-9 rounded-lg bg-brand-danger/15 hover:bg-brand-danger/25 text-brand-danger text-xs font-semibold transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5", children: [_jsx(Icon, { name: "cancel", size: 15, weight: 600, filled: true }), "Reddet"] })] })] }, a.id));
        }) }));
}
