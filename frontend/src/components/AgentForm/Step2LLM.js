import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Icon } from '../Icon';
import { StepHeading, Field, CustomSelect, SearchableCustomSelect, inputCls } from './FormComponents';
import { getModelLogo } from '../../utils/modelHelper';
export const PROXY_PRESETS = [
    {
        id: 'googleaistudio',
        label: 'Google AI Studio',
        provider: 'googleaistudio',
        base_url: '',
        model: 'gemini-2.5-flash',
        placeholder_api_key: 'AIzaSy...',
        description: 'Google AI Studio API anahtarı ile doğrudan Gemini kullanımı.'
    },
    {
        id: 'openai-official',
        label: 'OpenAI (Official)',
        provider: 'openai',
        base_url: '',
        model: 'gpt-4o-mini',
        placeholder_api_key: 'sk-proj-...',
        description: 'Resmi OpenAI API baglantisi.'
    },
    {
        id: 'anthropic-official',
        label: 'Anthropic (Official)',
        provider: 'anthropic',
        base_url: '',
        model: 'claude-3-5-sonnet-latest',
        placeholder_api_key: 'sk-ant-api03-...',
        description: 'Resmi Anthropic Claude API baglantisi.'
    },
    {
        id: 'openrouter',
        label: 'OpenRouter Proxy',
        provider: 'openrouter',
        base_url: 'https://openrouter.ai/api/v1',
        model: 'google/gemini-2.5-flash',
        placeholder_api_key: 'sk-or-v1-...',
        description: 'Düşük maliyetli alternatif sağlayıcı.'
    },
    {
        id: 'groq',
        label: 'Groq Cloud (Llama/Mixtral)',
        provider: 'groq',
        base_url: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile',
        placeholder_api_key: 'gsk_...',
        description: 'Ultra hızlı Llama model çıkarımları.'
    },
    {
        id: 'sambanova',
        label: 'SambaNova Cloud (1000+ t/s)',
        provider: 'sambanova',
        base_url: 'https://api.sambanova.ai/v1',
        model: 'Meta-Llama-3.3-70B-Instruct',
        placeholder_api_key: 'sn_...',
        description: 'Rekor hızında SambaNova LPU çıkarım motoru.'
    },
    {
        id: 'cerebras',
        label: 'Cerebras Systems (2000+ t/s)',
        provider: 'cerebras',
        base_url: 'https://api.cerebras.ai/v1',
        model: 'llama3.3-70b',
        placeholder_api_key: 'csk-...',
        description: 'Wafer-Scale Engine ile dünyanın en hızlı Llama çıkarımı.'
    },
    {
        id: 'fireworks',
        label: 'Fireworks AI (Speculative)',
        provider: 'fireworks',
        base_url: 'https://api.fireworks.ai/inference/v1',
        model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
        placeholder_api_key: 'fw_...',
        description: 'Gelişmiş speculative decoding çıkarım servisi.'
    },
    {
        id: 'together',
        label: 'Together AI (Serverless)',
        provider: 'together',
        base_url: 'https://api.together.xyz/v1',
        model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
        placeholder_api_key: '••••',
        description: 'Geniş açık kaynak model kütüphanesi.'
    },
    {
        id: 'lmstudio',
        label: 'LM Studio (Yerel)',
        provider: 'local',
        base_url: 'http://localhost:1234/v1',
        model: 'meta-llama-3-8b-instruct',
        description: 'Yerel bilgisayarınızda çalışan LM Studio sunucusu.'
    },
    {
        id: 'ollama',
        label: 'Ollama (Yerel)',
        provider: 'local',
        base_url: 'http://localhost:11434/v1',
        model: 'qwen2.5:7b-instruct',
        description: 'Ollama yerel model kütüphanesi.'
    }
];
export function Step2LLM({ provider, setProvider, model, setModel, baseUrl, setBaseUrl, apiKey, setApiKey, showApiKey, setShowApiKey, clearApiKey, setClearApiKey, presetId, applyPreset, modelSuggestions, envStatus, testing, testResult, onTest, isEditing, initial, verifySsl, setVerifySsl }) {
    const [activeStep, setActiveStep] = useState(0);
    useEffect(() => {
        if (!testing) {
            setActiveStep(0);
            return;
        }
        const t1 = setTimeout(() => setActiveStep(1), 350);
        const t2 = setTimeout(() => setActiveStep(2), 750);
        const t3 = setTimeout(() => setActiveStep(3), 1300);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [testing]);
    const envKey = provider === 'openai' ? 'OPENAI_API_KEY' :
        provider === 'anthropic' ? 'ANTHROPIC_API_KEY' :
            provider === 'gemini' ? 'GEMINI_API_KEY' :
                provider === 'googleaistudio' ? 'GEMINI_API_KEY' :
                    provider === 'openrouter' ? 'OPENROUTER_API_KEY' :
                        provider === 'groq' ? 'GROQ_API_KEY' :
                            provider === 'deepseek' ? 'DEEPSEEK_API_KEY' :
                                provider === 'mistral' ? 'MISTRAL_API_KEY' :
                                    provider === 'xai' ? 'XAI_API_KEY' :
                                        provider === 'sambanova' ? 'SAMBANOVA_API_KEY' :
                                            provider === 'cerebras' ? 'CEREBRAS_API_KEY' :
                                                provider === 'fireworks' ? 'FIREWORKS_API_KEY' :
                                                    provider === 'together' ? 'TOGETHER_API_KEY' : null;
    const envHasKey = envKey ? !!envStatus?.has?.[envKey] : false;
    const envMaskedKey = envKey ? envStatus?.masked?.[envKey] : null;
    const isLocal = provider === 'local';
    const baseHint = isLocal
        ? 'Ollama için: http://localhost:11434/v1, LM Studio için: http://localhost:1234/v1'
        : 'Özel proxy adresi kullanıyorsanız girin. Boş bırakırsanız varsayılan kullanılır.';
    return (_jsxs("div", { className: "space-y-4 max-w-xl mx-auto animate-step-in", children: [_jsx(StepHeading, { title: "Modelin nereden gelecek?", desc: "LLM saglayicisini, kullanacagin modeli ve (varsa) ozel endpoint ile API anahtarini gir." }), _jsx(Field, { label: "Proxy / Preset (opsiyonel)", children: _jsx(CustomSelect, { value: presetId, onChange: applyPreset, placeholder: "\u2014 Manuel yap\u0131land\u0131rma \u2014", options: PROXY_PRESETS.map((p) => {
                        const providerImg = p.id === 'openai-official' ? 'openai-official' :
                            p.id === 'googleaistudio' ? 'googleaistudio' :
                                p.id === 'frostai' ? 'frostai' :
                                    p.id === 'openrouter' ? 'openrouter' :
                                        p.id === 'groq' ? 'groq' :
                                            p.id === 'sambanova' ? 'sambanova' :
                                                p.id === 'cerebras' ? 'cerebras' :
                                                    p.id === 'fireworks' ? 'fireworks' :
                                                        p.id === 'together' ? 'together' :
                                                            p.id === 'lmstudio' ? 'lmstudio' :
                                                                p.id === 'ollama' ? 'local' :
                                                                    p.id === 'anthropic-official' ? 'anthropic' : 'openai-official';
                        return {
                            value: p.id,
                            label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: `/providers/${providerImg}.png?v=3`, alt: p.label, className: "w-4 h-4 object-contain rounded-sm" }), _jsxs("span", { children: [p.label, p.base_url ? ` — ${p.base_url}` : ''] })] }))
                        };
                    }) }) }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsx(Field, { label: "Sa\u011Flay\u0131c\u0131 *", children: _jsx(CustomSelect, { value: provider, onChange: (v) => setProvider(v), options: [
                                {
                                    value: 'openai',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/openai-official.png?v=3", alt: "OpenAI", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "OpenAI (ve uyumlu)" })] }))
                                },
                                {
                                    value: 'anthropic',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/anthropic.png?v=3", alt: "Anthropic", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "Anthropic (Claude)" })] }))
                                },
                                {
                                    value: 'gemini',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/gemini.png?v=3", alt: "Gemini", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "Google Gemini (Vertex/GCP)" })] }))
                                },
                                {
                                    value: 'googleaistudio',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/googleaistudio.png?v=3", alt: "Google AI Studio", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "Google AI Studio" })] }))
                                },
                                {
                                    value: 'openrouter',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/openrouter.png?v=3", alt: "OpenRouter", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "OpenRouter" })] }))
                                },
                                {
                                    value: 'groq',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/groq.png?v=3", alt: "Groq", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "Groq Cloud" })] }))
                                },
                                {
                                    value: 'sambanova',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/sambanova.png?v=3", alt: "SambaNova", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "SambaNova Cloud (1000+ t/s)" })] }))
                                },
                                {
                                    value: 'cerebras',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/cerebras.png?v=3", alt: "Cerebras", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "Cerebras Systems (2000+ t/s)" })] }))
                                },
                                {
                                    value: 'fireworks',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/fireworks.png?v=3", alt: "Fireworks AI", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "Fireworks AI" })] }))
                                },
                                {
                                    value: 'together',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/together.png?v=3", alt: "Together AI", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "Together AI" })] }))
                                },
                                {
                                    value: 'deepseek',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/deepseek.png?v=3", alt: "DeepSeek", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "DeepSeek" })] }))
                                },
                                {
                                    value: 'mistral',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/mistral.png?v=3", alt: "Mistral AI", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "Mistral AI" })] }))
                                },
                                {
                                    value: 'xai',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/xai.png?v=3", alt: "xAI", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "xAI (Grok)" })] }))
                                },
                                {
                                    value: 'local',
                                    label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/providers/local.png?v=3", alt: "Yerel", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { children: "Yerel (Ollama, LM Studio vb.)" })] }))
                                }
                            ] }) }), _jsx(Field, { label: "Model *", children: _jsx(SearchableCustomSelect, { value: model, onChange: (v) => setModel(v), onCustomAdd: (v) => setModel(v), options: modelSuggestions.map((m) => ({
                                value: m.id,
                                searchString: `${m.id} ${m.label}`,
                                label: (_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("img", { src: getModelLogo(m.id, provider), alt: "", className: "w-4 h-4 object-contain rounded-sm" }), _jsx("span", { className: "font-mono text-xs", children: m.label || m.id })] }))
                            })), placeholder: "\u2014 Model se\u00E7in veya arat\u0131n \u2014" }) })] }), !isLocal && (_jsxs(_Fragment, { children: [envKey && (envHasKey ? (_jsxs("div", { className: "rounded border border-brand-success/40 bg-brand-success/5 p-2.5 text-[11px] text-brand-success flex items-start gap-2", children: [_jsx(Icon, { name: "check_circle", size: 14, filled: true, className: "flex-shrink-0 mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsxs("strong", { children: [".env'de ", envKey, " hazir"] }), " (", envMaskedKey ?? '••••', "). Bu ajan otomatik kullanacak; istersen asagiya farkli bir anahtar yapistirip override edebilirsin."] })] })) : (_jsxs("div", { className: "rounded border border-brand-warning/40 bg-brand-warning/5 p-2.5 text-[11px] text-brand-warning flex items-start gap-2", children: [_jsx(Icon, { name: "warning", size: 14, className: "flex-shrink-0 mt-0.5" }), _jsxs("div", { className: "flex-1", children: [_jsxs("strong", { children: [".env'de ", envKey, " yok"] }), ". Asagiya buraya ozel bir anahtar yapistir veya", ' ', _jsx("span", { className: "font-semibold", children: "Ayarlar \u2192 API Anahtarlari" }), " sekmesinden ekle."] })] }))), _jsx(Field, { label: "Base URL", hint: baseHint, children: _jsx("input", { type: "text", value: baseUrl, onChange: (e) => setBaseUrl(e.target.value), placeholder: "Bos birak veya https://...", className: inputCls }) }), _jsxs(Field, { label: `API Anahtari${isEditing ? ' (bos birakirsan degismez)' : ' (bos = .env\'deki kullanilir)'}`, hint: isEditing && initial?.api_key_masked
                            ? `Mevcut: ${initial.api_key_masked}`
                            : undefined, children: [_jsxs("div", { className: "relative", children: [_jsx("input", { type: showApiKey ? 'text' : 'password', value: apiKey, onChange: (e) => setApiKey(e.target.value), placeholder: isEditing ? '(degismesin)' : envHasKey ? '(.env\'deki kullanilacak)' : 'sk-...', className: inputCls + ' pr-16', autoComplete: "new-password" }), _jsx("button", { type: "button", onClick: () => setShowApiKey(!showApiKey), className: "absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-brand-muted hover:text-brand-text px-2 py-0.5 border border-brand-border rounded", children: showApiKey ? 'Gizle' : 'Goster' })] }), isEditing && initial?.has_api_key && (_jsxs("div", { className: "flex items-center gap-2 mt-2", children: [_jsx("input", { type: "checkbox", id: "clear-api-key", checked: clearApiKey, onChange: (e) => setClearApiKey(e.target.checked), className: "rounded bg-brand-bg/50 border-brand-border text-brand-accent focus:ring-brand-accent/50" }), _jsx("label", { htmlFor: "clear-api-key", className: "text-xs text-brand-danger font-medium cursor-pointer", children: "Kayitli API Anahtarini Sil (Varsayilana Don)" })] }))] }), _jsxs("div", { className: "rounded border border-brand-border bg-brand-bg/50 p-3 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold text-brand-text", children: "Baglantiyi Test Et" }), _jsx("div", { className: "text-[11px] text-brand-muted mt-0.5", children: "Provider'a kucuk bir istek atip dogrula." }), _jsxs("label", { className: "flex items-center gap-1.5 cursor-pointer mt-1.5 select-none", children: [_jsx("input", { type: "checkbox", checked: verifySsl, onChange: (e) => setVerifySsl(e.target.checked), className: "rounded bg-brand-bg/50 border-brand-border text-brand-accent focus:ring-brand-accent/50 w-3.5 h-3.5" }), _jsx("span", { className: "text-[10px] text-brand-mutedSoft font-medium", children: "SSL Sertifikas\u0131n\u0131 Do\u011Frula" })] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { type: "button", onClick: () => onTest(false), disabled: testing || !model.trim(), className: "text-xs px-3 py-1.5 rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition whitespace-nowrap", children: testing ? 'Test Ediliyor' : 'Bu key ile' }), envHasKey && !apiKey.trim() && (_jsx("button", { type: "button", onClick: () => onTest(true), disabled: testing || !model.trim(), className: "text-xs px-3 py-1.5 rounded border border-brand-border text-brand-textSoft hover:text-brand-text disabled:opacity-40 transition whitespace-nowrap", title: ".env'deki anahtarla test eder", children: ".env ile" }))] })] }), testing && (_jsxs("div", { className: "p-3 bg-brand-panelAlt/30 border border-brand-border rounded-xl space-y-2.5 animate-step-in", children: [_jsxs("div", { className: "text-[10px] uppercase tracking-wider text-brand-accent font-bold mb-1 flex items-center gap-1", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" }), "Ba\u011Flant\u0131 S\u0131namas\u0131 Yap\u0131l\u0131yor..."] }), _jsxs("div", { className: "space-y-2", children: [_jsx(TracerStep, { index: 0, activeStep: activeStep, text: "API Parametreleri ve bi\u00E7im do\u011Frulamas\u0131" }), _jsx(TracerStep, { index: 1, activeStep: activeStep, text: "G\u00FCvenli HTTP/HTTPS istemcisi olu\u015Fturulmas\u0131" }), _jsx(TracerStep, { index: 2, activeStep: activeStep, text: "Sunucuya s\u0131nama paketi g\u00F6nderilmesi (max_tokens: 32)" }), _jsx(TracerStep, { index: 3, activeStep: activeStep, text: "Uzak sunucu yan\u0131t\u0131n\u0131n \u00E7\u00F6z\u00FCmlenmesi" })] })] })), testResult && !testing && (_jsxs("div", { className: `rounded border text-[11px] p-2.5 space-y-1 ${testResult.ok
                                    ? 'text-brand-success bg-brand-success/5 border-brand-success/30'
                                    : 'text-brand-danger bg-brand-danger/5 border-brand-danger/30'}`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "font-semibold inline-flex items-center gap-1.5", children: [_jsx(Icon, { name: testResult.ok ? 'check_circle' : 'cancel', size: 14, weight: 500, filled: true }), testResult.ok ? 'Başarılı' : 'Başarısız'] }), _jsxs("span", { className: "opacity-70 font-mono", children: [testResult.latency_ms, " ms"] })] }), _jsx("div", { className: "opacity-90 break-words whitespace-pre-wrap", children: testResult.message }), testResult.sample_response && (_jsxs("div", { className: "text-brand-muted border-t border-current/20 pt-1 mt-1", children: [_jsx("span", { className: "uppercase text-[10px] tracking-wider", children: "Orneklem:" }), ' ', _jsx("span", { className: "font-mono text-[10px]", children: testResult.sample_response })] }))] }))] })] })), isLocal && (_jsx(Field, { label: "Yerel Endpoint URL", hint: baseHint, children: _jsx("input", { type: "text", value: baseUrl, onChange: (e) => setBaseUrl(e.target.value), placeholder: "http://localhost:11434/v1", className: inputCls }) }))] }));
}
function TracerStep({ index, activeStep, text }) {
    const isCompleted = activeStep > index;
    const isActive = activeStep === index;
    const isPending = activeStep < index;
    return (_jsxs("div", { className: `flex items-center gap-2.5 text-xs transition-all duration-300 ${isActive ? 'text-brand-text font-semibold' : isCompleted ? 'text-brand-success/90' : 'text-brand-mutedSoft'}`, children: [isCompleted && (_jsx(Icon, { name: "check_circle", size: 14, filled: true, className: "text-brand-success animate-scale-in" })), isActive && (_jsx(Icon, { name: "progress_activity", size: 14, className: "animate-spin text-brand-accent" })), isPending && (_jsx("div", { className: "w-3.5 h-3.5 rounded-full border border-brand-border flex items-center justify-center text-[9px] font-bold text-brand-mutedSoft", children: index + 1 })), _jsx("span", { children: text })] }));
}
