import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Icon } from './Icon';
import { ScreenshotViewer } from './ScreenshotViewer';
import { api } from '@/api/client';
import { getModelLogo } from '../utils/modelHelper';
const TOOL_ICONS = {
    open_url: 'open_in_new',
    web_search: 'search',
    run_command: 'terminal',
    open_app: 'apps',
    system_info: 'computer',
    read_file: 'description',
    write_file: 'edit',
    append_file: 'add',
    list_dir: 'folder',
    screenshot: 'photo_camera',
    click: 'mouse',
    type_text: 'keyboard',
    key_press: 'keyboard_command_key',
    mouse_move: 'mouse'
};
function ToolCallCard({ tc }) {
    const [open, setOpen] = useState(false);
    const icon = TOOL_ICONS[tc.name] || 'build';
    const argSummary = (() => {
        const entries = Object.entries(tc.arguments || {});
        if (!entries.length)
            return '';
        const first = entries[0];
        const val = String(first[1]);
        return `${first[0]}: ${val.length > 60 ? val.slice(0, 60) + '…' : val}`;
    })();
    // Sprint 1.5: Screenshot/image cikti tespiti
    const data = tc.data || {};
    const imageB64 = typeof data.image_base64 === 'string'
        ? data.image_base64
        : typeof data.screenshot_base64 === 'string'
            ? data.screenshot_base64
            : undefined;
    const imagePath = typeof data.path === 'string' && /\.(png|jpe?g|webp|gif|bmp)$/i.test(data.path)
        ? data.path
        : typeof data.screenshot_path === 'string'
            ? data.screenshot_path
            : typeof data.image_path === 'string'
                ? data.image_path
                : undefined;
    const hasImage = Boolean(imageB64 || imagePath);
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
        }
    };
    return (_jsxs("div", { className: `relative rounded-lg overflow-hidden border text-[11px] transition-all duration-200 ${tc.ok
            ? 'border-brand-success/30 bg-brand-success/[0.03] hover:border-brand-success/50'
            : 'border-brand-danger/30 bg-brand-danger/[0.03] hover:border-brand-danger/50'}`, role: "region", "aria-label": `Tool call: ${tc.name}`, children: [_jsx("div", { className: `absolute left-0 top-[6px] bottom-[6px] w-[2px] rounded-full ${tc.ok ? 'bg-brand-success/60' : 'bg-brand-danger/60'}` }), _jsxs("button", { type: "button", onClick: () => setOpen((v) => !v), onKeyDown: handleKeyDown, className: "w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-black/5 transition-all duration-150 rounded-lg", "aria-expanded": open, "aria-label": `${tc.name} tool call details, ${tc.ok ? 'successful' : 'failed'}`, children: [_jsx("div", { className: `flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md ${tc.ok ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'}`, children: _jsx(Icon, { name: icon, size: 13, "aria-hidden": "true" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: `block font-mono font-semibold text-[11px] leading-tight ${tc.ok ? 'text-brand-success' : 'text-brand-danger'}`, children: tc.name }), argSummary && (_jsx("span", { className: "block text-brand-muted truncate font-mono text-[9.5px] leading-tight mt-0.5", children: argSummary }))] }), _jsxs("span", { className: "ml-auto flex items-center gap-2 text-brand-mutedSoft flex-shrink-0", children: [_jsxs("span", { className: "font-mono tabular-nums text-[10px]", children: [tc.duration_ms, "ms"] }), _jsx(Icon, { name: tc.ok ? 'check_circle' : 'cancel', size: 14, weight: 500, filled: true, className: tc.ok ? 'text-brand-success' : 'text-brand-danger', "aria-hidden": "true" }), _jsx(Icon, { name: open ? 'expand_less' : 'expand_more', size: 14, weight: 500, className: "transition-transform duration-200", "aria-hidden": "true" })] })] }), hasImage && !open && (_jsx("div", { className: "px-3 pb-2", children: _jsx(ScreenshotViewer, { imageB64: imageB64, imagePath: imagePath, alt: tc.name }) })), _jsx("div", { className: `grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`, children: _jsx("div", { className: "overflow-hidden", children: _jsxs("div", { className: "px-3 pb-2.5 pt-1.5 space-y-2 border-t border-current/10", children: [hasImage && (_jsxs("div", { children: [_jsx("div", { className: "text-brand-mutedSoft uppercase text-[9px] tracking-wider font-semibold mb-1", children: "G\u00F6r\u00FCnt\u00FC" }), _jsx(ScreenshotViewer, { imageB64: imageB64, imagePath: imagePath, alt: tc.name })] })), _jsxs("div", { children: [_jsx("div", { className: "text-brand-mutedSoft uppercase text-[9px] tracking-wider font-semibold mb-1", children: "Arg\u00FCmanlar" }), _jsx("pre", { className: "font-mono text-[10px] bg-black/20 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed", children: JSON.stringify(tc.arguments, null, 2) })] }), _jsxs("div", { children: [_jsx("div", { className: "text-brand-mutedSoft uppercase text-[9px] tracking-wider font-semibold mb-1", children: "\u00C7\u0131kt\u0131" }), _jsx("pre", { className: "font-mono text-[10px] bg-black/20 rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-words max-h-48 leading-relaxed", children: tc.error ? `HATA: ${tc.error}` : tc.output || '(boş)' })] })] }) }) })] }));
}
export function MessageBubble({ message, agentName }) {
    const role = typeof message.role === 'string' ? message.role : String(message.role);
    const isUser = role === 'user';
    const isAssistant = role === 'assistant';
    const toolCalls = message.tool_calls || [];
    // Sprint E.5: Feedback state
    const [feedbackGiven, setFeedbackGiven] = useState(null);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    // Sprint E.5: TTS state
    const [ttsPlaying, setTtsPlaying] = useState(false);
    const [ttsError, setTtsError] = useState(null);
    const timeStr = new Date(message.created_at).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    const handleFeedback = async (rating) => {
        if (feedbackLoading || feedbackGiven)
            return;
        setFeedbackLoading(true);
        try {
            await api.rateMessage(message.id, rating);
            setFeedbackGiven(rating);
        }
        catch (err) {
            console.error('Feedback hatasi:', err);
        }
        finally {
            setFeedbackLoading(false);
        }
    };
    const handleTTS = async () => {
        if (!message.content || ttsPlaying)
            return;
        setTtsPlaying(true);
        setTtsError(null);
        try {
            const audio = new Audio();
            audio.src = `${api.voiceSpeakUrl()}?text=${encodeURIComponent(message.content)}`;
            audio.onended = () => setTtsPlaying(false);
            audio.onerror = (e) => {
                console.error('TTS audio error:', e);
                setTtsError('Ses çalınamadı');
                setTtsPlaying(false);
            };
            await audio.play();
        }
        catch (err) {
            console.error('TTS hatasi:', err);
            const errorMsg = err instanceof Error ? err.message : 'TTS servisi kullanılamıyor';
            setTtsError(errorMsg);
            setTtsPlaying(false);
        }
    };
    const handleFeedbackKeyDown = (e, rating) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleFeedback(rating);
        }
    };
    const handleTTSKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTTS();
        }
    };
    return (_jsx("div", { className: `flex ${isUser ? 'justify-end' : 'justify-start'} animate-message-in group`, role: "article", "aria-label": `${isUser ? 'Kullanıcı' : agentName || 'Asistan'} mesajı`, children: _jsxs("div", { className: `flex flex-col max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`, children: [isAssistant && agentName && (_jsxs("div", { className: "flex items-center gap-1.5 px-1 mb-1", children: [_jsx(Icon, { name: "smart_toy", size: 11, weight: 550, filled: true, className: "text-brand-accent", "aria-hidden": "true" }), _jsx("span", { className: "text-[10px] font-bold text-brand-accent uppercase tracking-wider", children: agentName })] })), _jsxs("div", { className: `rounded-2xl px-4 py-2.5 transition-shadow ${isUser
                        ? 'bg-brand-accent text-brand-bg rounded-br-md shadow-sm'
                        : 'bg-brand-panel text-brand-text rounded-bl-md border border-brand-border shadow-sm group-hover:shadow-md'}`, children: [message.content && (_jsx("div", { className: "prose-chat whitespace-pre-wrap text-[13.5px] leading-relaxed break-words", children: message.content })), toolCalls.length > 0 && (_jsx(ToolCallsCollapsible, { toolCalls: toolCalls, isUser: isUser, hasContent: !!message.content }))] }), ttsError && (_jsx("div", { className: "mt-1 px-2 py-1 text-[10px] text-brand-danger bg-brand-danger/10 rounded border border-brand-danger/30", role: "alert", "aria-live": "polite", children: ttsError })), _jsxs("div", { className: `flex items-center gap-2 mt-1 px-1.5 text-[9.5px] font-mono text-brand-mutedSoft ${isUser ? 'flex-row-reverse' : ''}`, children: [_jsx("time", { dateTime: message.created_at, title: new Date(message.created_at).toLocaleString('tr-TR'), children: timeStr }), message.tokens != null && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-brand-border", "aria-hidden": "true", children: "\u00B7" }), _jsxs("span", { className: "inline-flex items-center gap-0.5 tabular-nums", title: `${message.tokens} token`, children: [_jsx(Icon, { name: "bolt", size: 9, weight: 500, filled: true, className: "text-brand-accent/70", "aria-hidden": "true" }), message.tokens] })] })), message.model && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-brand-border", "aria-hidden": "true", children: "\u00B7" }), _jsxs("span", { className: "truncate max-w-[140px] inline-flex items-center gap-1", title: message.model, children: [_jsx("img", { src: getModelLogo(message.model, message.provider || ''), alt: "", className: "w-3 h-3 object-contain rounded-sm" }), _jsx("span", { children: message.model })] })] })), isAssistant && message.content && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-brand-border", "aria-hidden": "true", children: "\u00B7" }), _jsxs("div", { className: "flex items-center gap-1", role: "group", "aria-label": "Mesaj geri bildirimi", children: [_jsx("button", { type: "button", onClick: () => handleFeedback('up'), onKeyDown: (e) => handleFeedbackKeyDown(e, 'up'), disabled: feedbackLoading || feedbackGiven !== null, className: `p-0.5 rounded transition-colors ${feedbackGiven === 'up'
                                                ? 'text-brand-success'
                                                : 'text-brand-mutedSoft hover:text-brand-success'} disabled:opacity-50 disabled:cursor-not-allowed`, "aria-label": "Yararl\u0131", "aria-pressed": feedbackGiven === 'up', children: _jsx(Icon, { name: "thumb_up", size: 11, weight: feedbackGiven === 'up' ? 600 : 400, "aria-hidden": "true" }) }), _jsx("button", { type: "button", onClick: () => handleFeedback('down'), onKeyDown: (e) => handleFeedbackKeyDown(e, 'down'), disabled: feedbackLoading || feedbackGiven !== null, className: `p-0.5 rounded transition-colors ${feedbackGiven === 'down'
                                                ? 'text-brand-danger'
                                                : 'text-brand-mutedSoft hover:text-brand-danger'} disabled:opacity-50 disabled:cursor-not-allowed`, "aria-label": "Yararl\u0131 de\u011Fil", "aria-pressed": feedbackGiven === 'down', children: _jsx(Icon, { name: "thumb_down", size: 11, weight: feedbackGiven === 'down' ? 600 : 400, "aria-hidden": "true" }) })] })] })), isAssistant && message.content && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-brand-border", "aria-hidden": "true", children: "\u00B7" }), _jsx("button", { type: "button", onClick: handleTTS, onKeyDown: handleTTSKeyDown, disabled: ttsPlaying, className: "p-0.5 rounded transition-colors text-brand-mutedSoft hover:text-brand-accent disabled:opacity-50 disabled:cursor-not-allowed", "aria-label": ttsPlaying ? 'Ses çalınıyor' : 'Sesli oku', "aria-pressed": ttsPlaying, children: _jsx(Icon, { name: ttsPlaying ? 'volume_up' : 'volume_off', size: 11, weight: ttsPlaying ? 600 : 400, filled: ttsPlaying, "aria-hidden": "true" }) })] }))] })] }) }));
}
/**
 * Tool çağrıları için collapsible — varsayılan kapalı.
 * "X araç kullanıldı ⌄" butonuna tıklayınca açılır.
 */
function ToolCallsCollapsible({ toolCalls, isUser, hasContent }) {
    const [open, setOpen] = useState(false);
    const okCount = toolCalls.filter((t) => t.ok).length;
    const errCount = toolCalls.length - okCount;
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
        }
    };
    return (_jsxs("div", { className: `${hasContent ? 'mt-3 pt-3 border-t' : ''} ${isUser ? 'border-brand-bg/15' : 'border-brand-border'}`, role: "region", "aria-label": "Kullan\u0131lan ara\u00E7lar", children: [_jsxs("button", { type: "button", onClick: () => setOpen((v) => !v), onKeyDown: handleKeyDown, className: `group/btn w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10.5px] font-semibold transition-all duration-200 ${isUser
                    ? 'text-brand-bg/85 hover:bg-brand-bg/10 hover:text-brand-bg'
                    : 'text-brand-textSoft hover:bg-brand-panelAlt hover:text-brand-text border border-brand-border/60 hover:border-brand-borderStrong'}`, "aria-expanded": open, "aria-label": `${toolCalls.length} araç kullanıldı${errCount > 0 ? `, ${errCount} hata` : ''}`, children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: `flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-mono font-bold ${isUser ? 'bg-brand-bg/15 text-brand-bg' : 'bg-brand-accent/10 text-brand-accent'}`, children: toolCalls.length }), _jsx("span", { className: "tracking-wide", children: open ? 'Kullanılan Araçları Gizle' : 'Kullanılan Araçları Görüntüle' }), errCount > 0 && (_jsxs("span", { className: `font-mono text-[9px] px-1.5 py-0.5 rounded ${isUser ? 'bg-brand-bg/15 text-brand-bg/80' : 'bg-brand-danger/10 text-brand-danger'}`, title: `${errCount} araç hata verdi`, children: [errCount, " Hata"] }))] }), _jsx(Icon, { name: open ? 'expand_less' : 'expand_more', size: 14, weight: 600, className: "ml-auto", "aria-hidden": "true" })] }), _jsx("div", { className: `grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? 'grid-rows-[1fr] opacity-100 mt-2.5' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'}`, children: _jsx("div", { className: "overflow-hidden space-y-1.5", children: toolCalls.map((tc) => (_jsx(ToolCallCard, { tc: tc }, tc.id))) }) })] }));
}
