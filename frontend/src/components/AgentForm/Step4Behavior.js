import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { StepHeading, Field, CustomSelect, inputCls } from './FormComponents';
import { api } from '@/api/client';
export function StepBehavior({ systemPrompt, setSystemPrompt, temperature, setTemperature, maxTokens, setMaxTokens, tagsText, setTagsText, isActive, setIsActive }) {
    const [souls, setSouls] = useState([]);
    const [soulLoading, setSoulLoading] = useState(false);
    const [soulError, setSoulError] = useState(null);
    const [savingSoul, setSavingSoul] = useState(false);
    const [soulName, setSoulName] = useState('');
    const [showSaveSoul, setShowSaveSoul] = useState(false);
    useEffect(() => {
        setSoulLoading(true);
        api.listSouls()
            .then(setSouls)
            .catch((err) => setSoulError(err instanceof Error ? err.message : String(err)))
            .finally(() => setSoulLoading(false));
    }, []);
    const handleSoulPick = async (name) => {
        if (!name)
            return;
        try {
            const detail = await api.getSoul(name);
            setSystemPrompt(detail.content);
        }
        catch (err) {
            setSoulError(err instanceof Error ? err.message : String(err));
        }
    };
    const handleSaveAsSoul = async () => {
        if (!soulName.trim() || !systemPrompt.trim())
            return;
        setSavingSoul(true);
        setSoulError(null);
        try {
            const created = await api.createSoul(soulName.trim(), systemPrompt, false);
            setSouls((prev) => [...prev.filter((s) => s.name !== created.name), created].sort((a, b) => a.name.localeCompare(b.name)));
            setShowSaveSoul(false);
            setSoulName('');
        }
        catch (err) {
            setSoulError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setSavingSoul(false);
        }
    };
    return (_jsxs("div", { className: "space-y-4 max-w-2xl mx-auto animate-step-in", children: [_jsx(StepHeading, { title: "Ajanin kisiligi ve davranisi", desc: "System prompt ajanin nasil konusacaca\u011F\u0131n\u0131 belirler. Hazir bir SOUL dosyas\u0131 se\u00E7 ya da kendin yaz." }), _jsxs("div", { className: "rounded border border-brand-border bg-brand-bg/30 p-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "text-[11px] uppercase tracking-wider text-brand-mutedSoft inline-flex items-center gap-1.5", children: [_jsx(Icon, { name: "auto_stories", size: 13, className: "text-brand-accent" }), "Hazir SOUL dosyasi"] }), _jsxs("button", { type: "button", onClick: () => setShowSaveSoul((v) => !v), disabled: !systemPrompt.trim(), className: "text-[11px] text-brand-accent hover:underline disabled:opacity-30", children: [_jsx(Icon, { name: "save", size: 12, className: "inline mr-0.5" }), "Bunu yeni SOUL olarak kaydet"] })] }), _jsx(CustomSelect, { value: "", onChange: handleSoulPick, disabled: soulLoading, placeholder: soulLoading ? 'Yükleniyor...' : '— Seç ve system_prompt\'a yapıştır —', options: souls.map((s) => ({
                            value: s.name,
                            label: `${s.name}${s.is_system ? ' (sistem)' : ''} — ${s.preview.substring(0, 60)}...`
                        })) }), showSaveSoul && (_jsxs("div", { className: "mt-2 flex items-center gap-1.5", children: [_jsx("input", { type: "text", value: soulName, onChange: (e) => setSoulName(e.target.value), placeholder: "yeni-soul-adi (a-z, 0-9, _, -)", className: inputCls + ' flex-1' }), _jsx("button", { type: "button", onClick: handleSaveAsSoul, disabled: savingSoul || !soulName.trim(), className: "px-3 py-2 text-xs rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40", children: savingSoul ? '...' : 'Kaydet' })] })), soulError && (_jsx("div", { className: "mt-2 text-[11px] text-brand-danger", children: soulError }))] }), _jsx(Field, { label: "System Prompt (SOUL)", children: _jsx("textarea", { value: systemPrompt, onChange: (e) => setSystemPrompt(e.target.value), rows: 10, placeholder: `Ajanin kisiligi, kurallari, cikti bicimi...

Ornek:
- Sen deneyimli bir X uzmanisin.
- Cevaplarin kisa ve net olmali.
- Turkce konusursun.`, className: inputCls + ' font-mono text-xs leading-relaxed resize-y min-h-[180px]' }) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs(Field, { label: `Temperature: ${temperature.toFixed(2)}`, children: [_jsx("input", { type: "range", min: 0, max: 2, step: 0.05, value: temperature, onChange: (e) => setTemperature(parseFloat(e.target.value)), className: "brand-slider my-2.5" }), _jsxs("div", { className: "flex justify-between text-[10px] text-brand-mutedSoft mt-0.5", children: [_jsx("span", { children: "0 (tutarli)" }), _jsx("span", { children: "1 (dengeli)" }), _jsx("span", { children: "2 (yaratici)" })] })] }), _jsx(Field, { label: "Max Tokens (cevap uzunlugu)", children: _jsx("input", { type: "number", min: 16, max: 32000, value: maxTokens, onChange: (e) => setMaxTokens(parseInt(e.target.value || '0', 10)), className: inputCls }) })] }), _jsx(Field, { label: "Etiketler", hint: "Virgulle ayir \u2014 kartta etiket olarak gorunur", children: _jsx("input", { type: "text", value: tagsText, onChange: (e) => setTagsText(e.target.value), placeholder: "orn. kod, asistan, turkce", className: inputCls }) }), _jsxs("label", { className: "flex items-center justify-between gap-3 text-sm text-brand-text cursor-pointer p-3 border border-brand-border bg-brand-bg/30 rounded hover:border-brand-borderStrong transition", children: [_jsxs("span", { className: "flex flex-col", children: [_jsx("span", { className: "font-semibold text-brand-text", children: "Ajan Durumu" }), _jsx("span", { className: "text-xs text-brand-mutedSoft", children: "Aktif (ajan listede g\u00F6r\u00FCn\u00FCr ve kullan\u0131labilir olur)" })] }), _jsxs("div", { className: "relative flex items-center", children: [_jsx("input", { type: "checkbox", checked: isActive, onChange: (e) => setIsActive(e.target.checked), className: "sr-only", id: "toggle-active" }), _jsx("div", { className: `w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${isActive ? 'bg-brand-accent' : 'bg-brand-borderStrong'}`, children: _jsx("div", { className: `w-4 h-4 rounded-full bg-brand-bg shadow-md transform transition-transform duration-300 ${isActive ? 'translate-x-4' : 'translate-x-0'}` }) })] })] })] }));
}
