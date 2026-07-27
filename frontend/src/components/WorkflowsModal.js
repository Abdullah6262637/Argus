import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// WorkflowsModal: YAML workflow CRUD + run (kurumsal sade tasarım)
import { useEffect, useState, useRef } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';
import { useWebSocket } from '@/hooks/useWebSocket';
const NEW_TEMPLATE = `# Yeni workflow şablonu
name: ornek_akis
description: Adım adım araştır ve yaz
inputs:
  - topic
steps:
  - id: search
    agent: researcher
    prompt: "{{ inputs.topic }} hakkında 5 kaynak topla"
  - id: outline
    agent: writer
    prompt: "Bu kaynaklara dayanarak outline çıkar:\\n{{ steps.search.result }}"
  - id: draft
    agent: writer
    prompt: "Outline'a göre 1000 kelimelik makale yaz:\\n{{ steps.outline.result }}"
`;
export function WorkflowsModal({ open, onClose }) {
    const [mode, setMode] = useState('run');
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState('');
    const [inputsJson, setInputsJson] = useState('{\n  \n}');
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState(null);
    // Editor state
    const [editName, setEditName] = useState('');
    const [editContent, setEditContent] = useState(NEW_TEMPLATE);
    const [savingEdit, setSavingEdit] = useState(false);
    const [savedEdit, setSavedEdit] = useState(false);
    const [isNew, setIsNew] = useState(true);
    // Height Observer
    const contentRef = useRef(null);
    const [contentHeight, setContentHeight] = useState(600);
    useEffect(() => {
        if (!contentRef.current)
            return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Measure unconstrained content height, add header (48px) + padding (40px)
                const computedHeight = entry.contentRect.height + 88;
                const bounded = Math.max(500, Math.min(computedHeight, window.innerHeight * 0.88));
                setContentHeight(bounded);
            }
        });
        observer.observe(contentRef.current);
        return () => observer.disconnect();
    }, [selected, mode, running, result, error]);
    const reload = async () => {
        setLoading(true);
        setError(null);
        try {
            const items = (await api.listWorkflows());
            setWorkflows(items);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (!open)
            return;
        reload();
        setMode('run');
        setResult(null);
        setError(null);
        setSearch('');
    }, [open]);
    const handleRun = async () => {
        if (!selected)
            return;
        setRunning(true);
        setError(null);
        setResult(null);
        try {
            let inputs = {};
            try {
                inputs = JSON.parse(inputsJson || '{}');
            }
            catch (err) {
                setError(`Inputs JSON parse hatası: ${err instanceof Error ? err.message : String(err)}`);
                setRunning(false);
                return;
            }
            const r = (await api.runWorkflow(selected, inputs));
            setResult(r);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setRunning(false);
        }
    };
    // Real-time WebSocket Listeners for Workflow monitoring
    useWebSocket({
        onMessage: (msg) => {
            if (!running || !selected)
                return;
            if (msg.type === 'workflow_step_status') {
                const payload = msg;
                if (payload.workflow_name !== selected)
                    return;
                setResult((prev) => {
                    const steps = prev?.steps ? [...prev.steps] : [];
                    const idx = steps.findIndex((s) => s.id === payload.step_id);
                    const updatedStep = {
                        id: payload.step_id,
                        agent_id: payload.agent_id,
                        success: payload.status === 'success',
                        result: payload.result || (payload.status === 'running' ? 'Çalışıyor...' : ''),
                        error: payload.error || null,
                    };
                    if (idx >= 0) {
                        steps[idx] = updatedStep;
                    }
                    else {
                        steps.push(updatedStep);
                    }
                    return {
                        name: selected,
                        success: payload.status === 'success' ? true : prev?.success ?? false,
                        steps,
                        final_output: payload.result || prev?.final_output,
                    };
                });
            }
        },
    });
    const startNew = () => {
        setMode('edit');
        setIsNew(true);
        setEditName('');
        setEditContent(NEW_TEMPLATE);
        setSavedEdit(false);
        setError(null);
    };
    const startEdit = async (name) => {
        setMode('edit');
        setIsNew(false);
        setEditName(name);
        setSavedEdit(false);
        setError(null);
        try {
            const data = await api.getWorkflowRaw(name);
            setEditContent(data.content);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };
    const saveEdit = async () => {
        setSavingEdit(true);
        setSavedEdit(false);
        setError(null);
        try {
            const cleanName = editName.trim();
            if (!cleanName) {
                setError('Workflow adı zorunlu.');
                setSavingEdit(false);
                return;
            }
            await api.saveWorkflow(cleanName, editContent, true);
            setSavedEdit(true);
            setIsNew(false);
            await reload();
            setSelected(cleanName);
            setTimeout(() => setSavedEdit(false), 3000);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setSavingEdit(false);
        }
    };
    const deleteWorkflow = async (name) => {
        if (!confirm(`"${name}" workflow'unu silmek istediğinden emin misin?`))
            return;
        try {
            await api.deleteWorkflow(name);
            await reload();
            if (selected === name)
                setSelected(null);
            if (editName === name) {
                setMode('run');
                setEditName('');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };
    const filteredWorkflows = search.trim()
        ? workflows.filter((w) => w.toLowerCase().includes(search.toLowerCase()))
        : workflows;
    if (!open)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-backdrop-in", children: _jsxs("div", { style: { height: `${contentHeight}px` }, className: "bg-brand-bg border border-brand-border rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex overflow-hidden animate-modal-in transition-[height] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]", children: [_jsxs("aside", { className: "w-64 flex-shrink-0 border-r border-brand-border bg-brand-panel flex flex-col", children: [_jsxs("div", { className: "px-3.5 py-3 border-b border-brand-border flex items-center justify-between", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsxs("div", { children: [_jsx("h3", { className: "text-[12px] font-semibold text-brand-text leading-tight", children: "Workflow'lar" }), _jsxs("p", { className: "text-[10px] text-brand-mutedSoft leading-tight font-mono tabular-nums", children: [filteredWorkflows.length, search && workflows.length !== filteredWorkflows.length && (_jsxs("span", { children: ["/", workflows.length] }))] })] }) }), _jsx("button", { onClick: startNew, title: "Yeni workflow", className: "w-7 h-7 rounded-md inline-flex items-center justify-center text-brand-textSoft hover:text-brand-accent hover:bg-brand-accent/10 transition-all active:scale-90", children: _jsx(Icon, { name: "add", size: 17, weight: 650 }) })] }), workflows.length > 0 && (_jsx("div", { className: "px-3 py-2 border-b border-brand-border", children: _jsxs("div", { className: "relative", children: [_jsx(Icon, { name: "search", size: 13, weight: 500, className: "absolute left-2 top-1/2 -translate-y-1/2 text-brand-mutedSoft pointer-events-none" }), _jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Ara...", className: "w-full h-7 bg-brand-bg border border-brand-border rounded-md pl-7 pr-2 text-[11px] text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/20 transition-all" })] }) })), _jsxs("div", { className: "flex-1 overflow-y-auto p-1.5", children: [loading && (_jsxs("div", { className: "flex items-center justify-center gap-1.5 text-[11px] text-brand-muted py-6", children: [_jsx(Icon, { name: "progress_activity", size: 12, className: "animate-spin-slow" }), _jsx("span", { children: "Y\u00FCkleniyor" })] })), !loading && workflows.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center text-center py-10 px-3 gap-2", children: [_jsx(Icon, { name: "bolt", size: 28, weight: 300, className: "text-brand-mutedSoft" }), _jsx("span", { className: "text-[11px] text-brand-muted", children: "Hen\u00FCz workflow yok" }), _jsxs("button", { onClick: startNew, className: "text-[10px] text-brand-accent hover:underline inline-flex items-center gap-1", children: [_jsx(Icon, { name: "add", size: 11, weight: 600 }), "\u0130lk workflow'u olu\u015Ftur"] })] })), !loading &&
                                    workflows.length > 0 &&
                                    filteredWorkflows.length === 0 && (_jsxs("div", { className: "flex flex-col items-center justify-center text-center py-8 px-3 gap-1.5", children: [_jsx(Icon, { name: "search_off", size: 20, weight: 300, className: "text-brand-mutedSoft" }), _jsx("span", { className: "text-[10.5px] text-brand-mutedSoft", children: "E\u015Fle\u015Fme yok" })] })), _jsx("div", { className: "space-y-0.5", children: filteredWorkflows.map((w) => {
                                        const active = mode === 'run' ? selected === w : editName === w;
                                        return (_jsxs("button", { onClick: () => {
                                                if (mode === 'run') {
                                                    setSelected(w);
                                                    setResult(null);
                                                }
                                                else {
                                                    startEdit(w);
                                                }
                                            }, className: `group w-full text-left px-2.5 py-2 rounded-md transition-all flex items-center gap-2 relative overflow-hidden ${active
                                                ? 'bg-brand-accent/10 ring-1 ring-brand-accent/40'
                                                : 'hover:bg-brand-panelAlt'}`, children: [active && (_jsx("span", { className: "absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full bg-brand-accent" })), _jsx(Icon, { name: "schema", size: 13, weight: 500, className: active ? 'text-brand-accent' : 'text-brand-mutedSoft' }), _jsx("span", { className: `flex-1 text-[11.5px] font-medium truncate ${active ? 'text-brand-text' : 'text-brand-textSoft'}`, children: w }), _jsx("button", { onClick: (e) => {
                                                        e.stopPropagation();
                                                        deleteWorkflow(w);
                                                    }, className: "opacity-0 group-hover:opacity-100 w-5 h-5 rounded inline-flex items-center justify-center text-brand-mutedSoft hover:text-brand-danger hover:bg-brand-danger/10 transition-all flex-shrink-0", title: "Sil", children: _jsx(Icon, { name: "delete", size: 12, weight: 500 }) })] }, w));
                                    }) })] })] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsxs("div", { className: "h-12 px-4 border-b border-brand-border flex items-center justify-between bg-brand-panel", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("h2", { className: "text-sm font-semibold text-brand-text", children: mode === 'run' ? 'Workflow Çalıştır' : isNew ? 'Yeni Workflow' : `${editName}` }), _jsxs("div", { className: "flex items-center bg-brand-bg/50 border border-brand-border rounded-md p-0.5", children: [_jsx(ModeButton, { active: mode === 'run', onClick: () => setMode('run'), icon: "play_arrow", label: "\u00C7al\u0131\u015Ft\u0131r" }), _jsx(ModeButton, { active: mode === 'edit', onClick: () => setMode('edit'), icon: "edit", label: "D\u00FCzenle" })] })] }), _jsx("button", { onClick: onClose, title: "Kapat", className: "w-8 h-8 rounded-md flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95", children: _jsx(Icon, { name: "close", size: 18, weight: 550 }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-5", children: _jsxs("div", { ref: contentRef, className: "animate-step-in", children: [mode === 'run' && (_jsx(_Fragment, { children: !selected ? (_jsxs("div", { className: "flex flex-col items-center justify-center text-center py-16 gap-2", children: [_jsx(Icon, { name: "touch_app", size: 36, weight: 300, className: "text-brand-mutedSoft" }), _jsx("h3", { className: "text-sm font-semibold text-brand-text", children: "Workflow se\u00E7" }), _jsx("p", { className: "text-[11px] text-brand-mutedSoft max-w-xs", children: "Sol panelden bir workflow se\u00E7erek \u00E7al\u0131\u015Ft\u0131rabilir veya d\u00FCzenleyebilirsin." })] })) : (_jsx(RunPanel, { workflowName: selected, inputsJson: inputsJson, onInputsChange: setInputsJson, running: running, result: result, error: error, onRun: handleRun, onEdit: () => startEdit(selected) })) })), mode === 'edit' && (_jsx(EditPanel, { isNew: isNew, editName: editName, onEditNameChange: setEditName, editContent: editContent, onEditContentChange: setEditContent, error: error, saved: savedEdit, saving: savingEdit, onSave: saveEdit, onDelete: () => deleteWorkflow(editName) }))] }, `${selected}_${mode}_${running}_${result ? 'res' : 'no'}`) })] })] }) }));
}
// ============================================================
// Yardımcı bileşenler
// ============================================================
function ModeButton({ active, onClick, icon, label }) {
    return (_jsxs("button", { onClick: onClick, className: `h-7 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold rounded transition-all ${active
            ? 'bg-brand-accent/15 text-brand-accent'
            : 'text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt'}`, children: [_jsx(Icon, { name: icon, size: 13, weight: 550, filled: active }), _jsx("span", { className: "hidden md:inline", children: label })] }));
}
// ============================================================
// Run Paneli
// ============================================================
function RunPanel({ workflowName, inputsJson, onInputsChange, running, result, error, onRun, onEdit }) {
    return (_jsxs("div", { className: "space-y-4 max-w-3xl", children: [_jsxs("div", { className: "rounded-lg border border-brand-border bg-brand-panel/40 p-3 flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-lg bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent flex-shrink-0", children: _jsx(Icon, { name: "schema", size: 18, weight: 550, filled: true }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-[10px] uppercase tracking-wider text-brand-mutedSoft font-bold", children: "Workflow" }), _jsx("div", { className: "text-sm font-semibold text-brand-text font-mono truncate", children: workflowName })] }), _jsxs("button", { onClick: onEdit, className: "h-8 px-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-md border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95", children: [_jsx(Icon, { name: "edit", size: 13, weight: 550 }), "D\u00FCzenle"] })] }), _jsx(FormField, { label: "Inputs", icon: "data_object", hint: "JSON format\u0131nda parametreler. Workflow i\u00E7indeki {{ inputs.x }} de\u011Fi\u015Fkenlerine ba\u011Flan\u0131r.", children: _jsx("textarea", { value: inputsJson, onChange: (e) => onInputsChange(e.target.value), rows: 6, spellCheck: false, className: "w-full bg-brand-panel border border-brand-border rounded-md px-3 py-2 text-xs font-mono text-brand-text leading-relaxed focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 transition-all", placeholder: '{\\n  "topic": "..."\\n}' }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: onRun, disabled: running, className: "h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 transition-all active:scale-95 shadow-sm", children: [_jsx(Icon, { name: running ? 'progress_activity' : 'play_arrow', size: 15, weight: 650, filled: true, className: running ? 'animate-spin-slow' : '' }), running ? 'Çalışıyor...' : 'Çalıştır'] }), error && (_jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-brand-danger", children: [_jsx(Icon, { name: "error", size: 13, weight: 500, filled: true }), error] }))] }), result && (_jsx("div", { className: "space-y-3 animate-fade-in-up", children: _jsxs("div", { className: "rounded-lg border border-brand-border bg-brand-panel/40 overflow-hidden", children: [_jsxs("div", { className: `px-3.5 py-2.5 flex items-center gap-2.5 border-b border-brand-border ${result.success
                                ? 'bg-brand-success/5'
                                : 'bg-brand-danger/5'}`, children: [_jsx("div", { className: `w-7 h-7 rounded-md flex items-center justify-center ${result.success
                                        ? 'bg-brand-success/15 text-brand-success'
                                        : 'bg-brand-danger/15 text-brand-danger'}`, children: _jsx(Icon, { name: result.success ? 'task_alt' : 'cancel', size: 15, weight: 550, filled: true }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: `text-[10px] uppercase tracking-wider font-bold ${result.success ? 'text-brand-success' : 'text-brand-danger'}`, children: result.success ? 'Başarılı' : 'Başarısız' }), _jsx("div", { className: "text-[12px] font-mono text-brand-text truncate", children: result.name })] }), result.steps && (_jsxs("span", { className: "text-[11px] font-mono text-brand-mutedSoft tabular-nums", children: [result.steps.filter((s) => s.success).length, "/", result.steps.length, " ad\u0131m"] }))] }), !result.success && result.error && (_jsxs("div", { className: "px-3.5 py-2 text-[11px] text-brand-danger flex items-start gap-1.5", children: [_jsx(Icon, { name: "error", size: 12, weight: 500, filled: true, className: "flex-shrink-0 mt-px" }), _jsx("span", { className: "leading-relaxed", children: result.error })] })), result.final_output && (_jsxs("div", { children: [_jsxs("div", { className: "px-3.5 pt-3 pb-1 text-[10px] uppercase tracking-wider text-brand-mutedSoft font-bold inline-flex items-center gap-1", children: [_jsx(Icon, { name: "output", size: 10, weight: 500 }), "Final \u00C7\u0131kt\u0131"] }), _jsx("pre", { className: "mx-3.5 mb-3 px-3 py-2 rounded-md bg-brand-bg/60 border border-brand-border font-mono text-[11px] text-brand-textSoft max-h-64 overflow-y-auto whitespace-pre-wrap break-words", children: result.final_output })] })), result.steps && result.steps.length > 0 && (_jsxs("div", { children: [_jsxs("div", { className: "px-3.5 pt-2 pb-1 text-[10px] uppercase tracking-wider text-brand-mutedSoft font-bold inline-flex items-center gap-1", children: [_jsx(Icon, { name: "format_list_numbered", size: 10, weight: 500 }), "Ad\u0131mlar"] }), _jsx("div", { className: "divide-y divide-brand-border", children: result.steps.map((s, i) => (_jsx(StepRow, { step: s, index: i + 1 }, s.id))) })] }))] }) }))] }));
}
function StepRow({ step, index }) {
    const [open, setOpen] = useState(false);
    const isRunning = step.result === 'Çalışıyor...';
    return (_jsxs("div", { children: [_jsxs("button", { onClick: () => setOpen((v) => !v), className: "w-full px-3.5 py-2 flex items-center gap-2.5 hover:bg-brand-panelAlt/50 transition-colors", children: [_jsx("div", { className: `w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${isRunning
                            ? 'bg-brand-accent/15 text-brand-accent animate-pulse'
                            : step.success
                                ? 'bg-brand-success/15 text-brand-success'
                                : 'bg-brand-danger/15 text-brand-danger'}`, children: _jsx(Icon, { name: isRunning ? 'progress_activity' : step.success ? 'check' : 'close', size: 12, weight: 650, className: isRunning ? 'animate-spin-slow' : '' }) }), _jsx("span", { className: "text-[10px] font-mono font-semibold text-brand-mutedSoft tabular-nums w-5 text-right", children: String(index).padStart(2, '0') }), _jsx("code", { className: "flex-1 text-[11.5px] font-mono font-semibold text-brand-text truncate text-left", children: step.id }), isRunning && (_jsx("span", { className: "text-[10px] text-brand-accent animate-pulse font-medium mr-2", children: "Aktif \u00C7al\u0131\u015F\u0131yor" })), _jsxs("span", { className: "text-[10px] text-brand-mutedSoft inline-flex items-center gap-1", children: [_jsx(Icon, { name: "smart_toy", size: 10, weight: 500 }), step.agent_id] }), _jsx(Icon, { name: open ? 'expand_less' : 'expand_more', size: 14, weight: 500, className: "text-brand-mutedSoft" })] }), open && (_jsxs("div", { className: "px-12 pb-3 pt-1 space-y-2 animate-fade-in-up", children: [step.error && (_jsxs("div", { className: "text-[11px] text-brand-danger bg-brand-danger/5 rounded px-2 py-1.5 flex items-start gap-1.5", children: [_jsx(Icon, { name: "error", size: 11, weight: 500, filled: true, className: "flex-shrink-0 mt-px" }), _jsx("span", { children: step.error })] })), step.result && (_jsx("pre", { className: "text-[11px] font-mono text-brand-textSoft bg-brand-bg/60 border border-brand-border rounded px-2 py-1.5 max-h-32 overflow-y-auto whitespace-pre-wrap break-words", children: step.result }))] }))] }));
}
// ============================================================
// Edit Paneli
// ============================================================
function EditPanel({ isNew, editName, onEditNameChange, editContent, onEditContentChange, error, saved, saving, onSave, onDelete }) {
    return (_jsxs("div", { className: "space-y-4 max-w-3xl", children: [_jsx(FormField, { label: "Workflow Ad\u0131", icon: "label", hint: isNew ? 'a-z, 0-9, _, - karakterleri kullan' : 'Sadece yeni workflow oluştururken değiştirilebilir', children: _jsx("input", { type: "text", value: editName, onChange: (e) => onEditNameChange(e.target.value), placeholder: "\u00F6rn. arastir_ve_yaz", disabled: !isNew, className: "w-full bg-brand-panel border border-brand-border rounded-md px-3 py-2 text-sm font-mono text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all" }) }), _jsx(FormField, { label: "YAML \u0130\u00E7erik", icon: "code", hint: "{{ inputs.x }} ve {{ steps.id.result }} de\u011Fi\u015Fkenlerini kullanabilirsin", children: _jsxs("div", { className: "rounded-md border border-brand-border bg-brand-panel overflow-hidden focus-within:border-brand-accent focus-within:ring-2 focus-within:ring-brand-accent/15 transition-all", children: [_jsx("div", { className: "px-3 py-1.5 border-b border-brand-border flex items-center justify-between bg-brand-panelAlt/40", children: _jsxs("div", { className: "flex items-center gap-1.5 text-[10px] text-brand-mutedSoft font-mono", children: [_jsx(Icon, { name: "data_object", size: 11, weight: 500 }), _jsx("span", { children: "YAML" }), _jsx("span", { className: "text-brand-border", children: "\u00B7" }), _jsxs("span", { className: "tabular-nums", children: [editContent.split('\n').length, " sat\u0131r"] })] }) }), _jsx("textarea", { value: editContent, onChange: (e) => onEditContentChange(e.target.value), rows: 20, spellCheck: false, className: "w-full bg-transparent px-3 py-2 text-[11.5px] font-mono text-brand-text leading-relaxed focus:outline-none resize-none" })] }) }), error && (_jsxs("div", { className: "p-2.5 text-[11px] rounded-lg border border-brand-danger/40 bg-brand-danger/5 text-brand-danger flex items-start gap-2", children: [_jsx(Icon, { name: "error", size: 13, weight: 500, filled: true, className: "flex-shrink-0 mt-px" }), _jsx("span", { className: "leading-relaxed", children: error })] })), saved && (_jsxs("div", { className: "p-2.5 text-[11px] rounded-lg border border-brand-success/40 bg-brand-success/5 text-brand-success flex items-center gap-2 animate-fade-in-up", children: [_jsx(Icon, { name: "check_circle", size: 13, weight: 550, filled: true }), "Kaydedildi"] })), _jsxs("div", { className: "flex items-center gap-2 pt-2 border-t border-brand-border", children: [_jsxs("button", { onClick: onSave, disabled: saving || !editName.trim() || !editContent.trim(), className: "h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm", children: [_jsx(Icon, { name: saving ? 'progress_activity' : 'save', size: 14, weight: 650, filled: true, className: saving ? 'animate-spin-slow' : '' }), saving ? 'Kaydediliyor...' : isNew ? 'Oluştur' : 'Kaydet'] }), !isNew && editName && (_jsxs("button", { onClick: onDelete, className: "h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-brand-danger/30 text-brand-danger hover:bg-brand-danger/10 transition-all active:scale-95", children: [_jsx(Icon, { name: "delete", size: 14, weight: 550 }), "Sil"] }))] })] }));
}
// ============================================================
// FormField — tutarlı label + ikon + hint
// ============================================================
function FormField({ label, icon, hint, children }) {
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("label", { className: "inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-brand-mutedSoft font-bold", children: [_jsx(Icon, { name: icon, size: 11, weight: 500 }), label] }) }), children, hint && (_jsx("p", { className: "text-[10px] text-brand-mutedSoft leading-relaxed", children: hint }))] }));
}
