import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// FileDropZone: drag-drop ile vector store'a ingest (Material Symbols)
import { useCallback, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';
export function FileDropZone({ agentId, onIngested }) {
    const [dragOver, setDragOver] = useState(false);
    const [items, setItems] = useState([]);
    const upload = useCallback(async (file) => {
        const idx = items.length;
        setItems((prev) => [...prev, { filename: file.name, state: 'uploading' }]);
        try {
            const result = await api.memoryIngestFile(file, agentId ?? undefined);
            setItems((prev) => prev.map((it, i) => i === idx ? { ...it, state: 'done', chunks: result.chunks } : it));
            onIngested?.({ filename: file.name, chunks: result.chunks });
        }
        catch (err) {
            setItems((prev) => prev.map((it, i) => i === idx
                ? { ...it, state: 'error', error: err instanceof Error ? err.message : String(err) }
                : it));
        }
    }, [agentId, items.length, onIngested]);
    const handleFiles = (files) => {
        if (!files)
            return;
        Array.from(files).forEach(upload);
    };
    return (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { onDragOver: (e) => {
                    e.preventDefault();
                    setDragOver(true);
                }, onDragLeave: () => setDragOver(false), onDrop: (e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFiles(e.dataTransfer.files);
                }, className: `border-2 border-dashed rounded-lg p-4 text-center transition cursor-pointer ${dragOver
                    ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
                    : 'border-brand-border text-brand-muted hover:border-brand-borderStrong'}`, children: _jsxs("label", { className: "cursor-pointer block", children: [_jsx("input", { type: "file", multiple: true, className: "hidden", onChange: (e) => handleFiles(e.target.files), accept: ".pdf,.docx,.xlsx,.csv,.html,.htm,.txt,.md,.json" }), _jsx(Icon, { name: "cloud_upload", size: 28, weight: 400, className: `mb-1 ${dragOver ? 'text-brand-accent' : 'text-brand-mutedSoft'}` }), _jsxs("div", { className: "text-xs flex items-center justify-center gap-1", children: [_jsx("strong", { children: "Dosya b\u0131rak" }), " veya", _jsx("span", { className: "underline", children: "t\u0131kla" })] }), _jsx("div", { className: "text-[10px] mt-1 opacity-70", children: "PDF / DOCX / XLSX / CSV / HTML / TXT / MD \u2014 chunk + embed + memory'e yaz\u0131l\u0131r" })] }) }), items.length > 0 && (_jsx("ul", { className: "space-y-1 max-h-40 overflow-y-auto", children: items.map((it, i) => (_jsxs("li", { className: `text-[11px] px-2 py-1 rounded border ${it.state === 'done'
                        ? 'border-brand-success/30 bg-brand-success/5 text-brand-success'
                        : it.state === 'error'
                            ? 'border-brand-danger/30 bg-brand-danger/5 text-brand-danger'
                            : 'border-brand-border bg-brand-panel text-brand-muted'}`, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Icon, { name: it.state === 'uploading'
                                        ? 'progress_activity'
                                        : it.state === 'done'
                                            ? 'check_circle'
                                            : it.state === 'error'
                                                ? 'error'
                                                : 'pending', size: 13, weight: 500, filled: it.state === 'done' || it.state === 'error', className: it.state === 'uploading' ? 'animate-spin-slow' : '' }), _jsx("span", { className: "truncate flex-1", children: it.filename }), it.chunks != null && (_jsxs("span", { className: "text-brand-mutedSoft font-mono text-[10px]", children: [it.chunks, " chunk"] }))] }), it.error && _jsx("div", { className: "mt-0.5 truncate", children: it.error })] }, i))) }))] }));
}
