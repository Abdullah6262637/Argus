import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { THEMES } from '@/hooks/useTheme';
import { useAppearance } from '@/hooks/useAppearance';
import { api } from '@/api/client';
import { Icon } from './Icon';
import { getModelLogo } from '../utils/modelHelper';
const TAB_CONFIG = {
    agents: { icon: 'smart_toy', label: 'Ajan Havuzu' },
    theme: { icon: 'palette', label: 'Görünüm' },
    apikeys: { icon: 'vpn_key', label: 'API Anahtarları' },
    system: { icon: 'settings', label: 'Sistem & Limitler' },
    security: { icon: 'security', label: 'Güvenlik & Sandbox' },
    media: { icon: 'volume_up', label: 'Ses & Tarayıcı' },
    plugins_mcp: { icon: 'extension', label: 'Eklentiler & MCP' },
    reset: { icon: 'restart_alt', label: 'Sıfırla' },
    about: { icon: 'info', label: 'Hakkında' }
};
export function SettingsModal({ theme, onChangeTheme, onClose, onRequestReset, initialTab, onEditAgent, onDeleteAgent, onDuplicateAgent, onReloadAgents }) {
    const [tab, setTab] = useState(initialTab ?? 'agents');
    const [initialTheme] = useState(theme);
    const [pendingTheme, setPendingTheme] = useState(theme);
    const isDirty = pendingTheme !== initialTheme;
    const [contentHeight] = useState(620);
    useEffect(() => {
        onChangeTheme(pendingTheme);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingTheme]);
    const handleSave = () => onClose();
    const handleCancel = () => {
        onChangeTheme(initialTheme);
        onClose();
    };
    useEffect(() => {
        const onEsc = (e) => {
            if (e.key === 'Escape')
                handleCancel();
        };
        document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-backdrop-in", children: _jsxs("div", { style: { height: `${contentHeight}px` }, className: "w-full max-w-3xl max-h-[92vh] flex rounded-xl border border-brand-borderStrong bg-brand-panel shadow-2xl overflow-hidden animate-modal-in transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]", children: [_jsxs("aside", { className: "w-56 flex-shrink-0 border-r border-brand-border bg-brand-bg/40 flex flex-col", children: [_jsxs("div", { className: "px-4 py-4 border-b border-brand-border flex items-center gap-2.5", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-gradient-to-br from-brand-accent to-brand-accentDim flex items-center justify-center text-brand-bg shadow-sm", children: _jsx(Icon, { name: "settings", size: 19, weight: 550, filled: true }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("h2", { className: "text-sm font-bold text-brand-text leading-tight", children: "Ayarlar" }), _jsx("p", { className: "text-[10px] text-brand-mutedSoft mt-0.5", children: "Tercihler & yap\u0131land\u0131rma" })] })] }), _jsx("nav", { className: "flex-1 p-2 space-y-0.5", children: Object.keys(TAB_CONFIG).map((t) => (_jsx(SidebarTab, { active: tab === t, onClick: () => setTab(t), icon: TAB_CONFIG[t].icon, label: TAB_CONFIG[t].label, danger: t === 'reset' }, t))) }), _jsx("div", { className: "p-3 border-t border-brand-border text-[10px] text-brand-mutedSoft", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Icon, { name: "verified", size: 11, weight: 500 }), _jsx("span", { children: "Argus v0.4.0" })] }) })] }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsxs("div", { className: "h-12 px-5 flex items-center justify-between border-b border-brand-border bg-brand-panel", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx("h3", { className: "text-sm font-semibold text-brand-text", children: TAB_CONFIG[tab].label }) }), _jsx("button", { onClick: handleCancel, className: "w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95", "aria-label": "Kapat", title: "Kapat (ESC)", children: _jsx(Icon, { name: "close", size: 18, weight: 550 }) })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-5", children: _jsxs("div", { className: "animate-step-in", children: [tab === 'agents' && (_jsx(AgentsManagerTab, { onEditAgent: (id) => {
                                            onEditAgent?.(id);
                                            onClose();
                                        }, onDeleteAgent: onDeleteAgent, onDuplicateAgent: onDuplicateAgent, onReloadAgents: onReloadAgents })), tab === 'theme' && (_jsx(ThemeTab, { theme: pendingTheme, onChangeTheme: setPendingTheme, initialTheme: initialTheme })), tab === 'apikeys' && _jsx(ApiKeysTab, {}), tab === 'system' && _jsx(SystemSettingsTab, {}), tab === 'security' && _jsx(SecuritySettingsTab, {}), tab === 'media' && _jsx(MediaSettingsTab, {}), tab === 'plugins_mcp' && _jsx(PluginsMcpTab, {}), tab === 'reset' && _jsx(ResetTab, { onRequestReset: onRequestReset }), tab === 'about' && _jsx(AboutTab, {})] }, tab) }), _jsxs("div", { className: "flex items-center justify-between px-5 py-3 border-t border-brand-border bg-brand-bg/40", children: [_jsx("div", { className: "text-[11px]", children: isDirty ? (_jsxs("span", { className: "inline-flex items-center gap-1.5 text-brand-accent font-semibold", children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" }), "Kaydedilmemi\u015F de\u011Fi\u015Fiklikler"] })) : (_jsxs("span", { className: "inline-flex items-center gap-1.5 text-brand-mutedSoft", children: [_jsx(Icon, { name: "check_circle", size: 12, weight: 500, filled: true }), "T\u00FCm de\u011Fi\u015Fiklikler g\u00FCncel"] })) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: handleCancel, className: "h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt hover:border-brand-borderStrong transition-all active:scale-95", children: [_jsx(Icon, { name: "close", size: 14, weight: 550 }), "\u0130ptal"] }), _jsxs("button", { onClick: handleSave, disabled: !isDirty, className: "h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm", children: [_jsx(Icon, { name: "save", size: 14, weight: 650, filled: true }), "Kaydet"] })] })] })] })] }) }));
}
// ============================================================
// Sidebar Tab Butonu
// ============================================================
function SidebarTab({ active, onClick, icon, label, danger = false }) {
    return (_jsxs("button", { onClick: onClick, className: `w-full h-9 px-3 inline-flex items-center gap-2.5 text-xs font-semibold rounded-md transition-all active:scale-[0.98] ${active
            ? danger
                ? 'bg-brand-danger/15 text-brand-danger'
                : 'bg-brand-accent/15 text-brand-accent'
            : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt'}`, children: [_jsx(Icon, { name: icon, size: 15, weight: active ? 600 : 500, filled: active }), _jsx("span", { className: "flex-1 text-left", children: label }), active && (_jsx(Icon, { name: "chevron_right", size: 14, weight: 550, className: "opacity-70" }))] }));
}
// ============================================================
// Tab başlık komponenti (içeride kullanılır)
// ============================================================
function PanelHeader({ title, description, icon }) {
    return (_jsxs("div", { className: "mb-4 pb-3 border-b border-brand-border", children: [_jsxs("h4", { className: "text-[13px] font-semibold text-brand-text inline-flex items-center gap-1.5", children: [icon && (_jsx(Icon, { name: icon, size: 14, weight: 550, className: "text-brand-accent" })), title] }), description && (_jsx("p", { className: "text-[11px] text-brand-mutedSoft mt-1 leading-relaxed", children: description }))] }));
}
// ============================================================
// Tema Sekmesi
// ============================================================
function ThemeTab({ theme, onChangeTheme, initialTheme }) {
    const { density, setDensity, fontSize, setFontSize } = useAppearance();
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { children: [_jsx(PanelHeader, { title: "Renk Temas\u0131", description: "Bir tema se\u00E7 \u2014 de\u011Fi\u015Fiklik an\u0131nda uygulan\u0131r. Kaydet'e basmazsan eski tema geri gelir.", icon: "palette" }), _jsx("div", { className: "grid grid-cols-2 gap-3", children: THEMES.map((t) => {
                            const active = t.id === theme;
                            const isOriginal = t.id === initialTheme;
                            return (_jsxs("button", { onClick: () => onChangeTheme(t.id), className: `group rounded-lg border p-3 text-left transition-all active:scale-[0.98] ${active
                                    ? 'border-brand-accent bg-brand-accent/5 ring-2 ring-brand-accent/20 shadow-sm'
                                    : 'border-brand-border hover:border-brand-borderStrong hover:bg-brand-panelAlt'}`, children: [_jsx(ThemePreview, { theme: t.id }), _jsxs("div", { className: "mt-2.5 flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-sm font-semibold text-brand-text", children: t.name }), active ? (_jsxs("span", { className: "inline-flex items-center gap-1 text-[9.5px] uppercase tracking-wider text-brand-accent font-bold", children: [_jsx(Icon, { name: "check_circle", size: 11, weight: 600, filled: true }), "Se\u00E7ili"] })) : (isOriginal && (_jsx("span", { className: "text-[9px] uppercase tracking-wider text-brand-mutedSoft font-mono", children: "mevcut" })))] }), _jsx("div", { className: "text-[10.5px] text-brand-mutedSoft mt-0.5", children: t.description })] }, t.id));
                        }) })] }), _jsxs("section", { children: [_jsx(PanelHeader, { title: "Yaz\u0131 Boyutu", description: "UI'nin temel font boyutunu ayarla.", icon: "format_size" }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: ['sm', 'md', 'lg'].map((sz) => {
                            const labels = {
                                sm: 'Küçük',
                                md: 'Orta',
                                lg: 'Büyük'
                            };
                            const sizes = {
                                sm: '12px',
                                md: '14px',
                                lg: '16px'
                            };
                            const previewSize = {
                                sm: 'text-xs',
                                md: 'text-sm',
                                lg: 'text-base'
                            };
                            const active = fontSize === sz;
                            return (_jsxs("button", { onClick: () => setFontSize(sz), className: `rounded-lg border p-2.5 text-center transition-all active:scale-[0.98] ${active
                                    ? 'border-brand-accent bg-brand-accent/5 ring-2 ring-brand-accent/20'
                                    : 'border-brand-border hover:border-brand-borderStrong hover:bg-brand-panelAlt'}`, children: [_jsx("div", { className: `${previewSize[sz]} font-semibold text-brand-text`, children: "Aa" }), _jsx("div", { className: "text-[11px] font-semibold text-brand-text mt-1", children: labels[sz] }), _jsx("div", { className: "text-[10px] text-brand-mutedSoft font-mono", children: sizes[sz] })] }, sz));
                        }) })] }), _jsxs("section", { children: [_jsx(PanelHeader, { title: "UI Yo\u011Funlu\u011Fu", description: "Bile\u015Fenler aras\u0131 bo\u015Fluklar\u0131 ayarla.", icon: "density_medium" }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: ['compact', 'cozy', 'comfortable'].map((d) => {
                            const labels = {
                                compact: 'Kompakt',
                                cozy: 'Standart',
                                comfortable: 'Geniş'
                            };
                            const descs = {
                                compact: 'Daha az boşluk',
                                cozy: 'Varsayılan',
                                comfortable: 'Daha fazla boşluk'
                            };
                            const icons = {
                                compact: 'density_small',
                                cozy: 'density_medium',
                                comfortable: 'density_large'
                            };
                            const active = density === d;
                            return (_jsxs("button", { onClick: () => setDensity(d), className: `rounded-lg border p-2.5 text-center transition-all active:scale-[0.98] ${active
                                    ? 'border-brand-accent bg-brand-accent/5 ring-2 ring-brand-accent/20'
                                    : 'border-brand-border hover:border-brand-borderStrong hover:bg-brand-panelAlt'}`, children: [_jsx(Icon, { name: icons[d], size: 20, weight: 500, className: active ? 'text-brand-accent' : 'text-brand-mutedSoft' }), _jsx("div", { className: "text-[11px] font-semibold text-brand-text mt-1", children: labels[d] }), _jsx("div", { className: "text-[10px] text-brand-mutedSoft", children: descs[d] })] }, d));
                        }) })] })] }));
}
function ThemePreview({ theme }) {
    const palettes = {
        mono: ['#000000', '#0a0a0a', '#ffffff', '#737373'],
        midnight: ['#0b1220', '#162238', '#60a5fa', '#94a3b8'],
        sunset: ['#1a0f0a', '#2d1b14', '#fb923c', '#d4b5a0'],
        forest: ['#0a1410', '#14261f', '#34d399', '#a3c4b3']
    };
    const colors = palettes[theme];
    return (_jsx("div", { className: "flex gap-0 rounded-md overflow-hidden border border-brand-border h-12 shadow-inner", children: colors.map((c, i) => (_jsx("div", { className: "flex-1", style: { background: c } }, i))) }));
}
// ============================================================
// API Anahtarları Sekmesi
// ============================================================
function ApiKeysTab() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [openaiKey, setOpenaiKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [openaiBase, setOpenaiBase] = useState('');
    const [anthropicBase, setAnthropicBase] = useState('');
    const [has, setHas] = useState({});
    const [masked, setMasked] = useState({});
    const [originalBases, setOriginalBases] = useState({ openai: '', anthropic: '' });
    const [testProvider, setTestProvider] = useState('openai');
    const [testModel, setTestModel] = useState('gpt-4o-mini');
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    // Mount tracking — async setState'leri unmount sonrası engelle
    const mountedRef = useRef(true);
    const savedTimeoutRef = useRef(null);
    useEffect(() => {
        mountedRef.current = true;
        const load = async () => {
            try {
                const data = await api.getEnv();
                if (!mountedRef.current)
                    return;
                // Defensive parse — tum alanlar opsiyonel
                const safeHas = (data && typeof data.has === 'object' && data.has) || {};
                const safeMasked = (data && typeof data.masked === 'object' && data.masked) || {};
                const safeValues = (data && typeof data.values === 'object' && data.values) || {};
                const oBase = typeof safeValues.OPENAI_BASE_URL === 'string'
                    ? safeValues.OPENAI_BASE_URL
                    : '';
                const aBase = typeof safeValues.ANTHROPIC_BASE_URL === 'string'
                    ? safeValues.ANTHROPIC_BASE_URL
                    : '';
                setHas(safeHas);
                setMasked(safeMasked);
                setOpenaiBase(oBase);
                setAnthropicBase(aBase);
                setOriginalBases({ openai: oBase, anthropic: aBase });
            }
            catch (err) {
                if (!mountedRef.current)
                    return;
                setError(err instanceof Error ? err.message : String(err));
            }
            finally {
                if (mountedRef.current)
                    setLoading(false);
            }
        };
        load();
        return () => {
            mountedRef.current = false;
            if (savedTimeoutRef.current) {
                clearTimeout(savedTimeoutRef.current);
                savedTimeoutRef.current = null;
            }
        };
    }, []);
    const save = async () => {
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            const values = {};
            if (openaiKey.trim())
                values.OPENAI_API_KEY = openaiKey.trim();
            if (anthropicKey.trim())
                values.ANTHROPIC_API_KEY = anthropicKey.trim();
            if (geminiKey.trim())
                values.GEMINI_API_KEY = geminiKey.trim();
            if (openaiBase !== originalBases.openai) {
                values.OPENAI_BASE_URL = openaiBase.trim() || null;
            }
            if (anthropicBase !== originalBases.anthropic) {
                values.ANTHROPIC_BASE_URL = anthropicBase.trim() || null;
            }
            if (Object.keys(values).length === 0) {
                // Hiçbir değişiklik yok — yine de "kaydedildi" feedback'i ver
                if (!mountedRef.current)
                    return;
                setSaved(true);
                savedTimeoutRef.current = setTimeout(() => {
                    if (mountedRef.current)
                        setSaved(false);
                }, 2000);
                return;
            }
            const res = await api.updateEnv(values);
            if (!mountedRef.current)
                return;
            const safeHas = (res && typeof res.has === 'object' && res.has) || {};
            const safeMasked = (res && typeof res.masked === 'object' && res.masked) || {};
            setHas(safeHas);
            setMasked(safeMasked);
            setOpenaiKey('');
            setAnthropicKey('');
            setGeminiKey('');
            // Base URL'ler kaydedildi → orijinali güncelle
            setOriginalBases({
                openai: openaiBase,
                anthropic: anthropicBase
            });
            setSaved(true);
            if (savedTimeoutRef.current)
                clearTimeout(savedTimeoutRef.current);
            savedTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current)
                    setSaved(false);
            }, 2500);
        }
        catch (err) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err.message : String(err));
            }
        }
        finally {
            if (mountedRef.current)
                setSaving(false);
        }
    };
    const clearKey = async (key) => {
        setError(null);
        try {
            const res = await api.updateEnv({ [key]: null });
            if (!mountedRef.current)
                return;
            const safeHas = (res && typeof res.has === 'object' && res.has) || {};
            const safeMasked = (res && typeof res.masked === 'object' && res.masked) || {};
            setHas(safeHas);
            setMasked(safeMasked);
        }
        catch (err) {
            if (mountedRef.current) {
                setError(err instanceof Error ? err.message : String(err));
            }
        }
    };
    const runTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const r = await api.testAgentConnection({
                provider: testProvider,
                model: testModel.trim(),
                api_key: null,
                base_url: null
            });
            if (mountedRef.current)
                setTestResult(r);
        }
        catch (err) {
            if (mountedRef.current) {
                setTestResult({
                    ok: false,
                    provider: testProvider,
                    model: testModel,
                    latency_ms: 0,
                    message: err instanceof Error ? err.message : String(err)
                });
            }
        }
        finally {
            if (mountedRef.current)
                setTesting(false);
        }
    };
    // Loading durumu — layout shift'i azaltmak için minimum yükseklik
    if (loading) {
        return (_jsxs("div", { className: "flex items-center justify-center gap-2 text-xs text-brand-muted min-h-[250px]", children: [_jsx(Icon, { name: "progress_activity", size: 14, className: "animate-spin-slow" }), _jsx("span", { children: "Y\u00FCkleniyor..." })] }));
    }
    return (_jsxs("div", { className: "space-y-5", children: [_jsx(PanelHeader, { title: ".env API Anahtarlar\u0131", description: "Anahtarlar backend/.env dosyas\u0131na yaz\u0131l\u0131r. Asla diske d\u00FCz metin olarak loglanmaz, UI'da maskelenir.", icon: "vpn_key" }), _jsxs("div", { className: "space-y-3", children: [_jsx(KeyRow, { label: "OpenAI", icon: "bolt", placeholder: "sk-...", value: openaiKey, onChange: setOpenaiKey, hasExisting: !!has.OPENAI_API_KEY, maskedExisting: masked.OPENAI_API_KEY, onClear: () => clearKey('OPENAI_API_KEY'), baseLabel: "Base URL", basePlaceholder: "(varsay\u0131lan) https://api.openai.com/v1", baseValue: openaiBase, onBaseChange: setOpenaiBase }), _jsx(KeyRow, { label: "Anthropic", icon: "psychology", placeholder: "sk-ant-...", value: anthropicKey, onChange: setAnthropicKey, hasExisting: !!has.ANTHROPIC_API_KEY, maskedExisting: masked.ANTHROPIC_API_KEY, onClear: () => clearKey('ANTHROPIC_API_KEY'), baseLabel: "Base URL", basePlaceholder: "(varsay\u0131lan) https://api.anthropic.com", baseValue: anthropicBase, onBaseChange: setAnthropicBase }), _jsx(KeyRow, { label: "Google Gemini (AI Studio)", icon: "temp_preferences_custom", placeholder: "AIzaSy...", value: geminiKey, onChange: setGeminiKey, hasExisting: !!has.GEMINI_API_KEY, maskedExisting: masked.GEMINI_API_KEY, onClear: () => clearKey('GEMINI_API_KEY') })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: save, disabled: saving, className: "h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 transition-all active:scale-95 shadow-sm", children: [_jsx(Icon, { name: saving ? 'progress_activity' : 'save', size: 14, weight: 650, filled: true, className: saving ? 'animate-spin-slow' : '' }), saving ? 'Kaydediliyor...' : 'Kaydet'] }), saved && (_jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-brand-success font-semibold animate-fade-in-up", children: [_jsx(Icon, { name: "check_circle", size: 13, weight: 550, filled: true }), "Kaydedildi"] })), error && (_jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-brand-danger", children: [_jsx(Icon, { name: "error", size: 13, weight: 500, filled: true }), error] }))] }), _jsxs("div", { className: "rounded-xl border border-brand-border bg-brand-bg/40 p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "w-9 h-9 rounded-lg bg-brand-accent/15 text-brand-accent flex items-center justify-center", children: _jsx(Icon, { name: "speed", size: 18, weight: 550, filled: true }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-xs font-semibold text-brand-text", children: "Ba\u011Flant\u0131y\u0131 Test Et" }), _jsx("div", { className: "text-[10.5px] text-brand-mutedSoft", children: "Provider'a ger\u00E7ek istek at\u0131p gecikme/durum bilgisini al." })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsx(FormField, { label: "Provider", icon: "hub", children: _jsxs("select", { value: testProvider, onChange: (e) => setTestProvider(e.target.value), className: "w-full bg-brand-bg border border-brand-border rounded-md px-2.5 py-1.5 text-xs text-brand-text focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all", children: [_jsx("option", { value: "openai", children: "openai" }), _jsx("option", { value: "anthropic", children: "anthropic" }), _jsx("option", { value: "gemini", children: "gemini" }), _jsx("option", { value: "local", children: "local" })] }) }), _jsx(FormField, { label: "Model", icon: "model_training", children: _jsx("input", { type: "text", value: testModel, onChange: (e) => setTestModel(e.target.value), placeholder: "gpt-4o-mini", className: "w-full bg-brand-bg border border-brand-border rounded-md px-2.5 py-1.5 text-xs font-mono text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all" }) })] }), _jsxs("button", { onClick: runTest, disabled: testing || !testModel.trim(), className: "w-full h-9 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border border-brand-border text-brand-text hover:bg-brand-panelAlt hover:border-brand-borderStrong disabled:opacity-40 transition-all active:scale-95", children: [_jsx(Icon, { name: testing ? 'progress_activity' : 'play_arrow', size: 14, weight: 650, filled: true, className: testing ? 'animate-spin-slow' : '' }), testing ? 'Test Ediliyor...' : 'Test Et'] }), testResult && (_jsxs("div", { className: `rounded-lg border p-3 space-y-1.5 animate-fade-in-up ${testResult.ok
                            ? 'text-brand-success bg-brand-success/5 border-brand-success/30'
                            : 'text-brand-danger bg-brand-danger/5 border-brand-danger/30'}`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-xs font-bold inline-flex items-center gap-1.5", children: [_jsx(Icon, { name: testResult.ok ? 'check_circle' : 'cancel', size: 15, weight: 550, filled: true }), testResult.ok ? 'Başarılı' : 'Başarısız'] }), _jsxs("span", { className: "inline-flex items-center gap-1 text-[10.5px] opacity-80 font-mono", children: [_jsx(Icon, { name: "schedule", size: 11, weight: 500 }), testResult.latency_ms, " ms"] })] }), _jsx("div", { className: "text-[11px] opacity-90 break-words leading-relaxed", children: testResult.message }), testResult.sample_response && (_jsxs("div", { className: "border-t border-current/20 pt-1.5 mt-1.5", children: [_jsx("div", { className: "text-[9.5px] uppercase tracking-wider opacity-70 mb-0.5", children: "\u00D6rnek yan\u0131t" }), _jsx("code", { className: "text-[10px] font-mono opacity-90 break-words", children: testResult.sample_response })] }))] }))] })] }));
}
// ============================================================
// Sistem & Limitler Ayarları
// ============================================================
function SystemSettingsTab() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [maxSteps, setMaxSteps] = useState(7);
    const [maxTokens, setMaxTokens] = useState(2048);
    const [reflection, setReflection] = useState(true);
    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getEnv();
                const safeValues = (data && typeof data.values === 'object' && data.values) || {};
                if (safeValues.PLAN_MAX_STEPS) {
                    setMaxSteps(parseInt(safeValues.PLAN_MAX_STEPS) || 7);
                }
                if (safeValues.MAX_TOKENS_PER_REQUEST) {
                    setMaxTokens(parseInt(safeValues.MAX_TOKENS_PER_REQUEST) || 2048);
                }
                if (safeValues.PLAN_REFLECTION_ENABLED) {
                    setReflection(safeValues.PLAN_REFLECTION_ENABLED === 'true');
                }
            }
            catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, []);
    const save = async () => {
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            await api.updateEnv({
                PLAN_MAX_STEPS: String(maxSteps),
                MAX_TOKENS_PER_REQUEST: String(maxTokens),
                PLAN_REFLECTION_ENABLED: String(reflection)
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setSaving(false);
        }
    };
    if (loading)
        return _jsx("div", { className: "text-center text-xs text-brand-muted py-10", children: "Y\u00FCkleniyor..." });
    return (_jsxs("div", { className: "space-y-5", children: [_jsx(PanelHeader, { title: "Sistem Ayarlar\u0131 & \u00C7al\u0131\u015Fma Limitleri", description: "Ajanlar\u0131n \u00E7al\u0131\u015Fma s\u0131n\u0131rlar\u0131n\u0131 ve planlama algoritmalar\u0131n\u0131 yap\u0131land\u0131r\u0131n.", icon: "settings" }), _jsxs("div", { className: "space-y-4 rounded-xl border border-brand-border bg-brand-bg/40 p-4", children: [_jsx(FormField, { label: "Maksimum Ajan Ad\u0131m Say\u0131s\u0131", icon: "straighten", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-xs font-bold text-brand-text", children: [_jsxs("span", { children: [maxSteps, " Ad\u0131m"] }), _jsx("span", { className: "text-brand-mutedSoft", children: "\u00D6nerilen: 5-8" })] }), _jsx("input", { type: "range", min: "1", max: "20", value: maxSteps, onChange: (e) => setMaxSteps(parseInt(e.target.value)), className: "w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent focus:outline-none" }), _jsx("p", { className: "text-[10px] text-brand-mutedSoft leading-relaxed", children: "Ajan\u0131n tek bir g\u00F6revi \u00E7\u00F6zerken d\u00F6ng\u00FCye girmeden atabilece\u011Fi maksimum ara\u00E7 (tool) ad\u0131m s\u0131n\u0131r\u0131d\u0131r." })] }) }), _jsx("div", { className: "border-t border-brand-border my-2" }), _jsx(FormField, { label: "Maksimum \u00C7\u0131kt\u0131 Token S\u0131n\u0131r\u0131 (Max Tokens)", icon: "toll", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between text-xs font-bold text-brand-text", children: [_jsxs("span", { children: [maxTokens, " Token"] }), _jsx("span", { className: "text-brand-mutedSoft", children: "Normal: 1024 - 4096" })] }), _jsx("input", { type: "range", min: "256", max: "8192", step: "256", value: maxTokens, onChange: (e) => setMaxTokens(parseInt(e.target.value)), className: "w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-accent focus:outline-none" }), _jsx("p", { className: "text-[10px] text-brand-mutedSoft leading-relaxed", children: "Ajan\u0131n tek bir LLM yan\u0131t\u0131nda \u00FCretebilece\u011Fi maksimum token uzunlu\u011Fudur. \u00C7ok b\u00FCy\u00FCk de\u011Ferler gecikmeyi art\u0131rabilir." })] }) }), _jsx("div", { className: "border-t border-brand-border my-2" }), _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-xs font-semibold text-brand-text", children: "Ajan D\u00FC\u015F\u00FCnme Modu (Reflection)" }), _jsx("div", { className: "text-[10px] text-brand-mutedSoft mt-0.5 leading-normal", children: "Ajan\u0131n bir ad\u0131ma karar vermeden \u00F6nce kendi planlar\u0131n\u0131 sorgulamas\u0131n\u0131 ve i\u00E7sel de\u011Ferlendirme (kendi kendine muhakeme) yapmas\u0131n\u0131 aktif eder." })] }), _jsx("button", { type: "button", onClick: () => setReflection(!reflection), className: `w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${reflection ? 'bg-brand-accent' : 'bg-brand-border'}`, children: _jsx("div", { className: `w-5 h-5 rounded-full bg-brand-panel transition-transform duration-200 ${reflection ? 'translate-x-5' : 'translate-x-0'}` }) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: save, disabled: saving, className: "h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 transition-all active:scale-95 shadow-sm", children: [_jsx(Icon, { name: saving ? 'progress_activity' : 'save', size: 14, className: saving ? 'animate-spin-slow' : '' }), saving ? 'Kaydediliyor...' : 'Kaydet'] }), saved && (_jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-brand-success font-semibold", children: [_jsx(Icon, { name: "check_circle", size: 13, filled: true }), " Kaydedildi"] })), error && (_jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-brand-danger", children: [_jsx(Icon, { name: "error", size: 13, filled: true }), " ", error] }))] })] }));
}
// ============================================================
// Güvenlik & Sandbox Ayarları
// ============================================================
function SecuritySettingsTab() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [allowlist, setAllowlist] = useState('');
    const [cwdJail, setCwdJail] = useState('');
    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getEnv();
                const safeValues = (data && typeof data.values === 'object' && data.values) || {};
                setAllowlist(safeValues.RUN_COMMAND_ALLOWLIST || 'git,npm,python,pip,node,echo,dir,ls,cat,type,where,pwd,hostname');
                setCwdJail(safeValues.RUN_COMMAND_CWD_JAIL || '');
            }
            catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, []);
    const save = async () => {
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            await api.updateEnv({
                RUN_COMMAND_ALLOWLIST: allowlist.trim(),
                RUN_COMMAND_CWD_JAIL: cwdJail.trim()
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setSaving(false);
        }
    };
    if (loading)
        return _jsx("div", { className: "text-center text-xs text-brand-muted py-10", children: "Y\u00FCkleniyor..." });
    return (_jsxs("div", { className: "space-y-5", children: [_jsx(PanelHeader, { title: "G\u00FCvenlik & Sandbox Kontrolleri", description: "Ajanlar\u0131n bilgisayar\u0131n\u0131zda \u00E7al\u0131\u015Ft\u0131rabilece\u011Fi komut limitlerini belirleyin.", icon: "security" }), _jsxs("div", { className: "space-y-4 rounded-xl border border-brand-border bg-brand-bg/40 p-4", children: [_jsxs(FormField, { label: "Terminal Komut \u0130zin Listesi (Allowlist)", icon: "terminal", children: [_jsx("textarea", { value: allowlist, onChange: (e) => setAllowlist(e.target.value), rows: 3, className: "w-full bg-brand-bg border border-brand-border rounded-md px-2.5 py-1.5 text-xs font-mono text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all resize-none", placeholder: "git,npm,python,pip..." }), _jsx("p", { className: "text-[10px] text-brand-mutedSoft mt-1.5 leading-normal", children: "Virg\u00FClle ayr\u0131lm\u0131\u015F de\u011Ferler. Ajan\u0131n `run_command` arac\u0131yla \u00E7al\u0131\u015Ft\u0131rmas\u0131na izin verilen programlar\u0131n ana isimleridir." })] }), _jsx("div", { className: "border-t border-brand-border my-2" }), _jsxs(FormField, { label: "\u00C7al\u0131\u015Fma Dizini Hapsi (Workspace Jail)", icon: "folder_lock", children: [_jsx("input", { type: "text", value: cwdJail, onChange: (e) => setCwdJail(e.target.value), className: "w-full bg-brand-bg border border-brand-border rounded-md h-9 px-2.5 text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all", placeholder: "\u00D6rn: C:\\Users\\HP\\Desktop\\sandbox" }), _jsx("p", { className: "text-[10px] text-brand-mutedSoft mt-1.5 leading-normal", children: "Bo\u015F b\u0131rak\u0131l\u0131rsa k\u0131s\u0131tlama uygulanmaz. Bir klas\u00F6r belirtildi\u011Finde ajan terminal komutlar\u0131n\u0131 sadece bu klas\u00F6r\u00FCn d\u0131\u015F\u0131na \u00E7\u0131kamadan \u00E7al\u0131\u015Ft\u0131rabilir." })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: save, disabled: saving, className: "h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 transition-all active:scale-95 shadow-sm", children: [_jsx(Icon, { name: saving ? 'progress_activity' : 'save', size: 14, className: saving ? 'animate-spin-slow' : '' }), saving ? 'Kaydediliyor...' : 'Kaydet'] }), saved && (_jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-brand-success font-semibold", children: [_jsx(Icon, { name: "check_circle", size: 13, filled: true }), " Kaydedildi"] })), error && (_jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-brand-danger", children: [_jsx(Icon, { name: "error", size: 13, filled: true }), " ", error] }))] })] }));
}
// ============================================================
// Ses & Tarayıcı Görünüm Ayarları
// ============================================================
function MediaSettingsTab() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [voice, setVoice] = useState(false);
    const [headless, setHeadless] = useState(true);
    const [browserTimeout, setBrowserTimeout] = useState(30000);
    const [logFormat, setLogFormat] = useState('text');
    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getEnv();
                const safeValues = (data && typeof data.values === 'object' && data.values) || {};
                setVoice(safeValues.VOICE_ENABLED === 'true');
                setHeadless(safeValues.BROWSER_HEADLESS !== 'false'); // defaults to true
                setBrowserTimeout(safeValues.BROWSER_TIMEOUT_MS ? parseInt(safeValues.BROWSER_TIMEOUT_MS) : 30000);
                setLogFormat(safeValues.LOG_FORMAT || 'text');
            }
            catch (err) {
                setError(err instanceof Error ? err.message : String(err));
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, []);
    const save = async () => {
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            await api.updateEnv({
                VOICE_ENABLED: String(voice),
                BROWSER_HEADLESS: String(headless),
                BROWSER_TIMEOUT_MS: String(browserTimeout),
                LOG_FORMAT: logFormat
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setSaving(false);
        }
    };
    if (loading)
        return _jsx("div", { className: "text-center text-xs text-brand-muted py-10", children: "Y\u00FCkleniyor..." });
    return (_jsxs("div", { className: "space-y-5", children: [_jsx(PanelHeader, { title: "Ses Deste\u011Fi & Taray\u0131c\u0131 Tercihleri", description: "Ajanlar\u0131n medya oynatma ve taray\u0131c\u0131 g\u00F6r\u00FCn\u00FCrl\u00FCk tercihlerini yap\u0131land\u0131r\u0131n.", icon: "volume_up" }), _jsxs("div", { className: "space-y-4 rounded-xl border border-brand-border bg-brand-bg/40 p-4", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "text-xs font-semibold text-brand-text font-bold inline-flex items-center gap-1.5", children: [_jsx(Icon, { name: "record_voice_over", size: 14, className: "text-brand-accent" }), "Sesli Yan\u0131t ve Asistan Modu"] }), _jsx("div", { className: "text-[10px] text-brand-mutedSoft mt-0.5 leading-normal", children: "Ajan\u0131n anons yapmas\u0131n\u0131, TTS (Text-to-Speech) sesli geri bildirim sistemlerini aktif hale getirir." })] }), _jsx("button", { type: "button", onClick: () => setVoice(!voice), className: `w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${voice ? 'bg-brand-accent' : 'bg-brand-border'}`, children: _jsx("div", { className: `w-5 h-5 rounded-full bg-brand-panel transition-transform duration-200 ${voice ? 'translate-x-5' : 'translate-x-0'}` }) })] }), _jsx("div", { className: "border-t border-brand-border my-2" }), _jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "text-xs font-semibold text-brand-text font-bold inline-flex items-center gap-1.5", children: [_jsx(Icon, { name: "open_in_new", size: 14, className: "text-brand-accent" }), "Taray\u0131c\u0131 Headless Modu (Gizli Taray\u0131c\u0131)"] }), _jsx("div", { className: "text-[10px] text-brand-mutedSoft mt-0.5 leading-normal", children: "Ajan internette gezinti yaparken taray\u0131c\u0131 penceresinin gizlenmesini sa\u011Flar. Kapat\u0131l\u0131rsa Playwright taray\u0131c\u0131s\u0131 ekran\u0131n\u0131zda g\u00F6r\u00FCn\u00FCr olarak a\u00E7\u0131l\u0131r." })] }), _jsx("button", { type: "button", onClick: () => setHeadless(!headless), className: `w-11 h-6 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${headless ? 'bg-brand-accent' : 'bg-brand-border'}`, children: _jsx("div", { className: `w-5 h-5 rounded-full bg-brand-panel transition-transform duration-200 ${headless ? 'translate-x-5' : 'translate-x-0'}` }) })] }), _jsx("div", { className: "border-t border-brand-border my-2" }), _jsxs(FormField, { label: "Taray\u0131c\u0131 Y\u00FCkleme Zaman A\u015F\u0131m\u0131 (ms)", icon: "timer", children: [_jsx("input", { type: "number", step: "1000", min: "5000", max: "120000", value: browserTimeout, onChange: (e) => setBrowserTimeout(parseInt(e.target.value) || 30000), className: "w-full bg-brand-bg border border-brand-border rounded-md h-9 px-2.5 text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all", placeholder: "30000" }), _jsx("p", { className: "text-[10px] text-brand-mutedSoft mt-1.5 leading-normal", children: "Milisaniye cinsinden (\u00D6rn: 30000 = 30 saniye). Ajan\u0131n web sayfalar\u0131n\u0131n y\u00FCklenmesini bekleyece\u011Fi maksimum s\u00FCredir." })] }), _jsx("div", { className: "border-t border-brand-border my-2" }), _jsxs(FormField, { label: "Sistem Log Format\u0131", icon: "description", children: [_jsxs("select", { value: logFormat, onChange: (e) => setLogFormat(e.target.value), className: "w-full bg-brand-bg border border-brand-border rounded-md h-9 px-2 text-xs text-brand-text focus:outline-none focus:border-brand-accent transition-all", children: [_jsx("option", { value: "text", children: "D\u00FCz Metin (Standart Okunabilir)" }), _jsx("option", { value: "json", children: "Yap\u0131land\u0131r\u0131lm\u0131\u015F JSON (Makine Okunabilir)" })] }), _jsx("p", { className: "text-[10px] text-brand-mutedSoft mt-1.5 leading-normal", children: "Backend hata ve i\u015Flem loglar\u0131n\u0131n diskte hangi veri format\u0131yla yaz\u0131laca\u011F\u0131n\u0131 belirler." })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: save, disabled: saving, className: "h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 transition-all active:scale-95 shadow-sm", children: [_jsx(Icon, { name: saving ? 'progress_activity' : 'save', size: 14, className: saving ? 'animate-spin-slow' : '' }), saving ? 'Kaydediliyor...' : 'Kaydet'] }), saved && (_jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-brand-success font-semibold", children: [_jsx(Icon, { name: "check_circle", size: 13, filled: true }), " Kaydedildi"] })), error && (_jsxs("span", { className: "inline-flex items-center gap-1 text-[11px] text-brand-danger", children: [_jsx(Icon, { name: "error", size: 13, filled: true }), " ", error] }))] })] }));
}
/** Hem API key hem base URL barındıran row'u tek kart olarak gösterir. */
function KeyRow({ label, icon, placeholder, value, onChange, hasExisting, maskedExisting, onClear, baseLabel, basePlaceholder, baseValue, onBaseChange }) {
    const [show, setShow] = useState(false);
    return (_jsxs("div", { className: "rounded-xl border border-brand-border bg-brand-bg/40 p-3.5 space-y-2.5", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-brand-accent/15 text-brand-accent flex items-center justify-center flex-shrink-0", children: _jsx(Icon, { name: icon, size: 16, weight: 550, filled: true }) }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-xs font-semibold text-brand-text", children: label }), _jsx("div", { className: "text-[10px] text-brand-mutedSoft inline-flex items-center gap-1", children: hasExisting ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-brand-success" }), _jsx("span", { className: "font-mono truncate", children: maskedExisting ?? '••••••••' })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-brand-mutedSoft" }), _jsx("span", { children: "Anahtar yok" })] })) })] })] }), hasExisting && (_jsx("button", { type: "button", onClick: onClear, title: "Anahtar\u0131 sil", className: "w-7 h-7 rounded-md flex items-center justify-center text-brand-danger hover:bg-brand-danger/10 transition-all active:scale-95", children: _jsx(Icon, { name: "delete", size: 14, weight: 550 }) }))] }), _jsx(FormField, { label: "API Key", icon: "vpn_key", children: _jsxs("div", { className: "relative", children: [_jsx("input", { type: show ? 'text' : 'password', value: value, onChange: (e) => onChange(e.target.value), placeholder: hasExisting ? '(değişmesin için boş bırak)' : placeholder, autoComplete: "new-password", className: "w-full bg-brand-bg border border-brand-border rounded-md pl-2.5 pr-9 py-1.5 text-xs font-mono text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all" }), _jsx("button", { type: "button", onClick: () => setShow((v) => !v), title: show ? 'Gizle' : 'Göster', className: "absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all", children: _jsx(Icon, { name: show ? 'visibility_off' : 'visibility', size: 14, weight: 500 }) })] }) }), baseLabel && onBaseChange && (_jsx(FormField, { label: baseLabel, icon: "link", children: _jsx("input", { type: "text", value: baseValue || '', onChange: (e) => onBaseChange(e.target.value), placeholder: basePlaceholder, className: "w-full bg-brand-bg border border-brand-border rounded-md px-2.5 py-1.5 text-xs font-mono text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all" }) }))] }));
}
/** Form alanı: ikon + etiket + içerik */
function FormField({ label, icon, children }) {
    return (_jsxs("label", { className: "block space-y-1", children: [_jsxs("span", { className: "text-[9.5px] text-brand-mutedSoft uppercase tracking-wider font-bold inline-flex items-center gap-1", children: [_jsx(Icon, { name: icon, size: 10, weight: 500 }), label] }), children] }));
}
// ============================================================
// Sıfırla Sekmesi
// ============================================================
function ResetTab({ onRequestReset }) {
    const items = [
        { icon: 'group', text: 'Tüm ajanlar ve API anahtarları' },
        { icon: 'forum', text: 'Tüm sohbet mesajları' },
        { icon: 'event_repeat', text: 'Tüm zamanlanmış görevler' },
        { icon: 'receipt_long', text: 'Tüm sistem logları' },
        { icon: 'memory', text: 'Tüm hafıza ve knowledge graph' },
        { icon: 'auto_awesome', text: 'Kurulum sihirbazı tekrar açılır' }
    ];
    return (_jsxs("div", { className: "space-y-5", children: [_jsx(PanelHeader, { title: "Tehlikeli \u0130\u015Flemler", description: "Bu i\u015Flemler geri al\u0131namaz. L\u00FCtfen son derece dikkatli ol.", icon: "warning" }), _jsxs("div", { className: "rounded-xl border border-brand-border bg-brand-panelAlt/30 p-5 space-y-4", children: [_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-brand-danger/10 text-brand-danger flex items-center justify-center flex-shrink-0 border border-brand-danger/20", children: _jsx(Icon, { name: "delete_forever", size: 26, weight: 550, filled: true }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h4", { className: "text-sm font-bold text-brand-text", children: "Sistemi S\u0131f\u0131rla" }), _jsx("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-brand-danger/10 text-brand-danger border border-brand-danger/25", children: "Kritik Eylem" })] }), _jsx("p", { className: "text-[11.5px] text-brand-textSoft mt-1 leading-relaxed", children: "T\u00FCm veri taban\u0131n\u0131 s\u0131f\u0131rlar; kay\u0131tl\u0131 t\u00FCm sohbetleri, zamanlanm\u0131\u015F g\u00F6revleri, sistem g\u00FCnl\u00FCklerini ve olu\u015Fturulan ajan modellerini kal\u0131c\u0131 olarak temizler." })] })] }), _jsx("div", { className: "grid grid-cols-2 gap-2 pt-2 border-t border-brand-border/40", children: items.map((it, i) => (_jsxs("div", { className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-bg/40 border border-brand-border hover:border-brand-borderStrong transition-all", children: [_jsx(Icon, { name: it.icon, size: 14, weight: 500, className: "text-brand-danger flex-shrink-0" }), _jsx("span", { className: "text-[11px] text-brand-textSoft truncate", children: it.text })] }, i))) }), _jsx("div", { className: "pt-2", children: _jsxs("button", { onClick: onRequestReset, className: "w-full h-11 inline-flex items-center justify-center gap-2 text-xs font-bold rounded-lg bg-brand-danger text-brand-bg hover:brightness-110 transition-all active:scale-[0.98] shadow-md shadow-brand-danger/15", children: [_jsx(Icon, { name: "restart_alt", size: 18, weight: 650 }), "Sistemi S\u0131f\u0131rla"] }) }), _jsxs("div", { className: "flex items-start gap-2 text-[10px] text-brand-danger/90 bg-brand-danger/5 border border-brand-danger/10 rounded-lg p-2.5 leading-normal", children: [_jsx(Icon, { name: "info", size: 13, weight: 500, className: "flex-shrink-0 mt-0.5" }), _jsx("span", { children: "T\u0131klad\u0131ktan sonra ek bir onay ekran\u0131 a\u00E7\u0131lacakt\u0131r. G\u00FCvenlik do\u011Frulamas\u0131 i\u00E7in kutucu\u011Fa \"SIFIRLA\" yazman\u0131z zorunludur." })] })] })] }));
}
// ============================================================
// Hakkında Sekmesi
// ============================================================
function AboutTab() {
    const osInfo = typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Windows') ? 'Windows x64' : navigator.userAgent.includes('Mac') ? 'macOS (Darwin)' : 'Linux') : 'Windows x64';
    return (_jsxs("div", { className: "space-y-6 max-h-[70vh] overflow-y-auto pr-1", children: [_jsxs("div", { className: "text-center py-4 bg-brand-panelAlt/30 rounded-lg border border-brand-border/60 p-4 relative overflow-hidden shadow-inner", children: [_jsx("div", { className: "absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl pointer-events-none" }), _jsx("div", { className: "flex justify-center", children: _jsx("img", { src: "/logo.png", className: "w-20 h-20 rounded-2xl object-contain shadow-2xl border border-brand-border/80 p-0.5 hover:scale-105 transition-transform duration-300", alt: "Argus Logo" }) }), _jsx("h2", { className: "text-2xl font-black text-brand-text mt-3 tracking-tight", children: "Argus" }), _jsxs("p", { className: "text-xs text-brand-mutedSoft mt-1.5 inline-flex items-center gap-1.5 font-mono", children: [_jsx(Icon, { name: "bolt", size: 13, weight: 600, filled: true, className: "text-brand-accent animate-pulse" }), _jsx("span", { children: "Ayn\u0131 anda her \u015Feyi g\u00F6ren \u00E7oklu ajan sistemi" }), _jsx("span", { className: "text-brand-border", children: "\u00B7" }), _jsx("span", { className: "bg-brand-accent/10 text-brand-accent px-1.5 py-0.5 rounded text-[10px] font-bold", children: "v0.4.5-LATEST" })] })] }), _jsx(AboutSection, { icon: "description", title: "Proje Hakk\u0131nda & Vizyon", children: _jsxs("p", { className: "leading-relaxed text-[11.5px] text-brand-textSoft", children: ["Argus; geli\u015Ftiriciler, veri bilimciler ve sistem m\u00FChendisleri i\u00E7in tasarlanm\u0131\u015F", _jsx("strong", { children: " otonom ve yar\u0131 otonom \u00E7oklu ajan (Multi-Agent) kontrol panelidir" }), ". Geleneksel chat aray\u00FCzlerinin aksine Argus, her biri farkl\u0131 dil modelleriyle (LLM) g\u00FC\u00E7lendirilmi\u015F uzman ajanlar\u0131 tek bir \u00E7at\u0131 alt\u0131nda koordine edebilir, hedefleri ger\u00E7ekle\u015Ftirmek i\u00E7in \u00E7ok ad\u0131ml\u0131 otonom planlama, sorgulama ve ara\u00E7 \u00E7al\u0131\u015Ft\u0131rma (Tool Use) s\u00FCre\u00E7lerini y\u00F6netebilir."] }) }), _jsx(AboutSection, { icon: "check_circle", title: "Uygulama \u00C7al\u0131\u015Fma Bilgileri", children: _jsxs("div", { className: "grid grid-cols-2 gap-2 mt-1", children: [_jsx(InfoRow, { icon: "desktop_windows", label: "\u00C7al\u0131\u015Ft\u0131\u011F\u0131 \u0130\u015Fletim Sistemi", value: osInfo }), _jsx(InfoRow, { icon: "javascript", label: "Runtime Motoru", value: "Electron 33 \u00B7 React 18" }), _jsx(InfoRow, { icon: "terminal", label: "Sistem Ajan Shell", value: "PowerShell (Win)" }), _jsx(InfoRow, { icon: "api", label: "Yerel Backend API", value: "FastAPI \u00B7 Async Python" })] }) }), _jsx(AboutSection, { icon: "auto_awesome", title: "\u00D6ne \u00C7\u0131kan Ajan Kabiliyetleri", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: [_jsx(Feat, { icon: "hub", text: "Hiyerar\u015Fik \u00C7oklu Model: OpenAI, Anthropic, Gemini, DeepSeek, Mistral, xAI Grok ve yerel modellerin (Ollama/LM Studio) tek projede e\u015F zamanl\u0131 \u00E7al\u0131\u015Fmas\u0131." }), _jsx(Feat, { icon: "psychology", text: "Otonom Planlama D\u00F6ng\u00FCs\u00FC: Hedef bazl\u0131 1-7 ad\u0131ml\u0131 dinamik planlama, y\u00FCr\u00FCtme, g\u00F6zlem (reflection) ve planda otomatik sapma d\u00FCzeltmesi (re-planning)." }), _jsx(Feat, { icon: "build", text: "Geli\u015Fmi\u015F Ara\u00E7 Entegrasyonu: 60'tan fazla yerle\u015Fik ara\u00E7la (dosya sistemi, web taray\u0131c\u0131s\u0131, Git, veritaban\u0131, e-posta, terminal y\u00FCr\u00FCtme, g\u00F6r\u00FCnt\u00FC \u00FCretimi)." }), _jsx(Feat, { icon: "schema", text: "Bilgi Grafi\u011Fi & Bellek: Ajanlar aras\u0131 payla\u015F\u0131lan anlamsal ili\u015Fkileri g\u00F6steren interaktif Bilgi Grafi\u011Fi (Knowledge Graph) ve ChromaDB tabanl\u0131 Vekt\u00F6r Bellek." }), _jsx(Feat, { icon: "schedule", text: "Zamanlanm\u0131\u015F Otonom G\u00F6revler: Cron ifadeleriyle tetiklenen arka plan ajansal g\u00F6revleri ve karma\u015F\u0131k i\u015F ak\u0131\u015F\u0131 (YAML Pipeline) deste\u011Fi." }), _jsx(Feat, { icon: "security", text: "HITL & G\u00FCvenlik: Kritik i\u015Fletim sistemi ve dosya eri\u015Fim i\u015Flemlerinde \u0130nsan Onay\u0131 (Human-In-The-Loop) ve HMAC-SHA256 zincirli b\u00FCt\u00FCnl\u00FCk kay\u0131t sistemi." })] }) }), _jsx(AboutSection, { icon: "keyboard", title: "Klavye K\u0131sayollar\u0131 & H\u0131zl\u0131 Eri\u015Fim", children: _jsxs("div", { className: "border border-brand-border rounded-lg overflow-hidden bg-brand-panelAlt/50 text-[11px] font-mono", children: [_jsxs("div", { className: "grid grid-cols-3 gap-2 p-2 border-b border-brand-border bg-brand-panel font-bold text-brand-text", children: [_jsx("div", { children: "K\u0131sayol Kombinasyonu" }), _jsx("div", { className: "col-span-2", children: "\u0130\u015Flem / Tetikledi\u011Fi Aksiyon" })] }), _jsxs("div", { className: "divide-y divide-brand-border", children: [_jsxs("div", { className: "grid grid-cols-3 gap-2 p-2 items-center", children: [_jsx("div", { children: _jsx("kbd", { className: "bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border text-brand-accent", children: "Ctrl + K" }) }), _jsx("div", { className: "col-span-2", children: "Komut Paletini A\u00E7 / Kapat (Fuzzy Search)" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 p-2 items-center", children: [_jsx("div", { children: _jsx("kbd", { className: "bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border", children: "Ctrl + N" }) }), _jsx("div", { className: "col-span-2", children: "Yeni Sohbet Oturumu Ba\u015Flat (Ekran\u0131 Temizle)" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 p-2 items-center", children: [_jsx("div", { children: _jsx("kbd", { className: "bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border", children: "Ctrl + Shift + N" }) }), _jsx("div", { className: "col-span-2", children: "Yeni Uzman Ajan Yap\u0131land\u0131rma Formunu A\u00E7" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 p-2 items-center", children: [_jsx("div", { children: _jsx("kbd", { className: "bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border", children: "Ctrl + Shift + M" }) }), _jsx("div", { className: "col-span-2", children: "Mevcut Sohbet Ge\u00E7mi\u015Fini Markdown (.md) Olarak \u0130ndir" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 p-2 items-center", children: [_jsx("div", { children: _jsx("kbd", { className: "bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border", children: "Ctrl + Shift + E" }) }), _jsx("div", { className: "col-span-2", children: "Aktif Ajan Konfig\u00FCrasyonunu D\u0131\u015Fa Aktar (JSON)" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 p-2 items-center", children: [_jsx("div", { children: _jsx("kbd", { className: "bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border", children: "Ctrl + Alt + L" }) }), _jsx("div", { className: "col-span-2", children: "Sistem Sa\u011Fl\u0131k ve Canl\u0131 Performans Log Panelini G\u00F6ster/Gizle" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 p-2 items-center", children: [_jsx("div", { children: _jsx("kbd", { className: "bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border", children: "Ctrl + Shift + U" }) }), _jsx("div", { className: "col-span-2", children: "Ajanlar\u0131 Konfig\u00FCrasyon Dosyas\u0131ndan (agents.yaml) Yeniden Oku" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 p-2 items-center", children: [_jsx("div", { children: _jsx("kbd", { className: "bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border", children: "Ctrl + 1..9" }) }), _jsx("div", { className: "col-span-2", children: "S\u0131radaki Uzman Ajan ile Sohbet Ekran\u0131na H\u0131zl\u0131ca Ge\u00E7i\u015F Yap" })] }), _jsxs("div", { className: "grid grid-cols-3 gap-2 p-2 items-center", children: [_jsx("div", { children: _jsx("kbd", { className: "bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border", children: "Ctrl + Alt + 1..9" }) }), _jsx("div", { className: "col-span-2", children: "S\u0131radaki Uzman Ajan\u0131n Ayarlar\u0131n\u0131 ve Promplar\u0131n\u0131 D\u00FCzenle" })] })] })] }) }), _jsx(AboutSection, { icon: "shield", title: "Mimari G\u00FCvenlik Standard\u0131", children: _jsxs("div", { className: "grid grid-cols-1 gap-1.5", children: [_jsx(Feat, { icon: "lock", text: "API Anahtar\u0131 G\u00FCvenli\u011Fi: T\u00FCm kimlik bilgileri yerel veritaban\u0131nda Fernet (AES-128) \u015Fifreleme algoritmas\u0131 ile izole \u015Fekilde saklan\u0131r." }), _jsx(Feat, { icon: "visibility_off", text: "Sistem Seviyesinde Maskeleme: API anahtarlar\u0131 loglarda ve ekran \u00E7\u0131kt\u0131lar\u0131nda sk-a***xyz bi\u00E7iminde g\u00FCvenli \u015Fekilde maskelenir." }), _jsx(Feat, { icon: "receipt_long", text: "Audit B\u00FCt\u00FCnl\u00FCk Zinciri: Ajanlar\u0131n ger\u00E7ekle\u015Ftirdi\u011Fi t\u00FCm kritik eylemler, de\u011Fi\u015Ftirilemeyen HMAC-SHA256 zincirli audit loguna kaydedilir." }), _jsx(Feat, { icon: "gavel", text: "Sandboxed Execution: Terminal y\u00FCr\u00FCtme ve dosya silme gibi y\u00FCksek riskli i\u015Flemler, kullan\u0131c\u0131 onay\u0131 (HITL) al\u0131nmadan kesinlikle \u00E7al\u0131\u015Ft\u0131r\u0131lmaz." })] }) }), _jsxs("div", { className: "text-center text-[10px] text-brand-mutedSoft pt-4 border-t border-brand-border/60 flex items-center justify-center gap-2", children: [_jsx(Icon, { name: "copyright", size: 11, weight: 500 }), _jsx("span", { children: "2026 Argus Project" }), _jsx("span", { className: "text-brand-border", children: "\u00B7" }), _jsx("span", { children: "MIT Lisans\u0131 (A\u00E7\u0131k Kaynak)" })] })] }));
}
function AboutSection({ icon, title, children }) {
    return (_jsxs("section", { children: [_jsxs("h3", { className: "text-[10.5px] uppercase tracking-wider font-bold text-brand-mutedSoft mb-2 inline-flex items-center gap-1.5", children: [_jsx(Icon, { name: icon, size: 12, weight: 550, className: "text-brand-accent" }), title] }), _jsx("div", { className: "text-xs text-brand-textSoft leading-relaxed", children: children })] }));
}
function Feat({ icon, text }) {
    return (_jsxs("div", { className: "flex items-start gap-2 px-2.5 py-1.5 rounded-md bg-brand-panelAlt/50 border border-brand-border", children: [_jsx(Icon, { name: icon, size: 13, weight: 550, className: "text-brand-accent flex-shrink-0 mt-px" }), _jsx("span", { className: "text-[11px]", children: text })] }));
}
function InfoRow({ icon, label, value }) {
    return (_jsxs("div", { className: "rounded-md border border-brand-border bg-brand-panelAlt px-2.5 py-1.5", children: [_jsxs("div", { className: "text-[9px] uppercase tracking-wider text-brand-mutedSoft font-bold inline-flex items-center gap-1", children: [_jsx(Icon, { name: icon, size: 10, weight: 500 }), label] }), _jsx("div", { className: "text-[11px] text-brand-text mt-0.5 font-mono truncate", children: value })] }));
}
function PluginsMcpTab() {
    const [mcpServers, setMcpServers] = useState([]);
    const [plugins, setPlugins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [togglingServer, setTogglingServer] = useState(null);
    const [warningMessage, setWarningMessage] = useState(null);
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [serversResp, pluginsResp] = await Promise.all([
                api.listMcpServers(),
                api.listPlugins()
            ]);
            const mcpList = Array.isArray(serversResp)
                ? serversResp
                : (serversResp && Array.isArray(serversResp.servers) ? serversResp.servers : []);
            setMcpServers(mcpList);
            setPlugins(pluginsResp);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        loadData();
    }, []);
    const handleToggleServer = async (name, enabled) => {
        setTogglingServer(name);
        setError(null);
        setWarningMessage(null);
        try {
            const resp = await api.toggleMcpServer(name, enabled);
            setMcpServers((prev) => prev.map((s) => (s.name === name ? { ...s, enabled } : s)));
            setWarningMessage(resp.message || 'Değişiklik kaydedildi. Etkinleşmesi için backend servisini yeniden başlatın.');
        }
        catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setTogglingServer(null);
        }
    };
    const getMcpIcon = (name) => {
        if (name === 'filesystem')
            return 'folder';
        if (name === 'github')
            return 'code';
        if (name === 'sqlite')
            return 'database';
        if (name === 'brave-search')
            return 'search';
        if (name === 'puppeteer')
            return 'open_in_browser';
        if (name === 'slack')
            return 'chat';
        if (name === 'memory')
            return 'memory';
        if (name === 'fetch')
            return 'download';
        return 'dns';
    };
    if (loading) {
        return (_jsxs("div", { className: "flex items-center justify-center gap-2 text-xs text-brand-muted min-h-[250px]", children: [_jsx(Icon, { name: "progress_activity", size: 14, className: "animate-spin" }), _jsx("span", { children: "Y\u00FCkleniyor..." })] }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [warningMessage && (_jsxs("div", { className: "p-3 text-xs text-brand-accent bg-brand-accent/10 border border-brand-accent/40 rounded flex items-start gap-2 animate-fade-in-down", children: [_jsx(Icon, { name: "warning", size: 16, className: "text-brand-accent flex-shrink-0 mt-0.5" }), _jsx("span", { children: warningMessage })] })), error && (_jsxs("div", { className: "p-3 text-xs text-brand-danger bg-brand-danger/10 border border-brand-danger/40 rounded flex items-start gap-2 animate-fade-in-down", children: [_jsx(Icon, { name: "error", size: 16, className: "text-brand-danger flex-shrink-0 mt-0.5" }), _jsx("span", { children: error })] })), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Icon, { name: "dns", size: 18, className: "text-brand-accent" }), _jsx("h4", { className: "text-sm font-semibold text-brand-text", children: "Model Context Protocol (MCP) Sunucular\u0131" })] }), _jsx("p", { className: "text-xs text-brand-mutedSoft mb-3", children: "MCP sunucular\u0131, yapay zeka modellerine ek ara\u00E7lar (dosya okuma, GitHub eri\u015Fimi, internet aramas\u0131 vb.) kazand\u0131r\u0131r." }), _jsx("div", { className: "space-y-3", children: mcpServers.map((srv) => {
                            const isToggling = togglingServer === srv.name;
                            return (_jsx("div", { className: `rounded border p-3.5 transition-all duration-300 ${srv.enabled
                                    ? 'border-brand-accent/40 bg-brand-panelAlt shadow-sm shadow-brand-accent/5'
                                    : 'border-brand-border bg-brand-bg/30'} hover:border-brand-borderStrong`, children: _jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { className: "flex gap-3 min-w-0", children: [_jsxs("div", { className: "mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded overflow-hidden", children: [_jsx("img", { src: `/mcp/${srv.name}.png`, alt: srv.name, className: "w-5 h-5 object-contain", onError: (e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                const fb = document.getElementById(`mcp-fb-${srv.name}`);
                                                                if (fb)
                                                                    fb.style.display = 'block';
                                                            } }), _jsx("div", { id: `mcp-fb-${srv.name}`, style: { display: 'none' }, className: "text-brand-accent", children: _jsx(Icon, { name: getMcpIcon(srv.name), size: 20 }) })] }), _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm font-bold text-brand-text capitalize", children: srv.name }), _jsx("span", { className: `text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold ${srv.enabled
                                                                        ? 'bg-brand-accent/15 text-brand-accent'
                                                                        : 'bg-brand-borderStrong/40 text-brand-mutedSoft'}`, children: srv.enabled ? 'Etkin' : 'Pasif' })] }), _jsx("div", { className: "text-xs text-brand-muted mt-1 leading-snug", children: srv.description }), srv.command && srv.command.length > 0 && (_jsx("div", { className: "mt-2 text-[10px] font-mono bg-brand-bg/60 border border-brand-border p-1.5 rounded text-brand-mutedSoft overflow-x-auto whitespace-nowrap", children: srv.command.join(' ') })), srv.env && Object.keys(srv.env).length > 0 && (_jsxs("div", { className: "mt-2 space-y-1", children: [_jsx("div", { className: "text-[10px] font-semibold text-brand-textSoft", children: "Ortam De\u011Fi\u015Fkenleri:" }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: Object.keys(srv.env).map((k) => (_jsxs("span", { className: "text-[10px] font-mono bg-brand-panelAlt px-1.5 py-0.5 border border-brand-border rounded text-brand-mutedSoft", children: [k, ": ", _jsx("span", { className: "text-brand-text", children: srv.env[k] ? '***' : 'tanımlı değil' })] }, k))) })] }))] })] }), _jsxs("div", { className: "relative flex items-center mt-1 flex-shrink-0", children: [_jsx("input", { type: "checkbox", checked: !!srv.enabled, disabled: isToggling, onChange: (e) => handleToggleServer(srv.name, e.target.checked), className: "sr-only", id: `mcp-toggle-${srv.name}` }), _jsx("div", { onClick: () => !isToggling && handleToggleServer(srv.name, !srv.enabled), className: `w-9 h-5 rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${srv.enabled ? 'bg-brand-accent' : 'bg-brand-borderStrong'} ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`, children: _jsx("div", { className: `w-4 h-4 rounded-full bg-brand-bg shadow-md transform transition-transform duration-300 ${srv.enabled ? 'translate-x-4' : 'translate-x-0'}` }) })] })] }) }, srv.name));
                        }) })] }), _jsx("div", { className: "h-px bg-brand-border" }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Icon, { name: "extension", size: 18, className: "text-brand-accent" }), _jsx("h4", { className: "text-sm font-semibold text-brand-text", children: "Sistem Eklentileri (Plugins)" })] }), _jsxs("p", { className: "text-xs text-brand-mutedSoft mb-3", children: ["Eklentiler, sistem klas\u00F6r\u00FCndeki (", _jsx("code", { className: "font-mono", children: "plugins/" }), ") Python betikleridir ve backend taraf\u0131ndan otomatik olarak taran\u0131p sisteme tool olarak dahil edilir."] }), plugins.length === 0 ? (_jsxs("div", { className: "p-4 rounded border border-brand-border bg-brand-bg/10 text-center text-xs text-brand-muted", children: [_jsx(Icon, { name: "hourglass_empty", size: 24, className: "mx-auto mb-2 text-brand-mutedSoft" }), _jsx("span", { children: "plugins/ klas\u00F6r\u00FCnde hen\u00FCz aktif bir Python eklentisi bulunamad\u0131." })] })) : (_jsx("div", { className: "grid grid-cols-1 gap-3", children: plugins.map((plug) => (_jsx("div", { className: "rounded border border-brand-border bg-brand-bg/30 p-3.5 hover:border-brand-borderStrong transition-all", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(Icon, { name: "description", size: 20, className: "text-brand-accent mt-0.5" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("span", { className: "text-sm font-bold text-brand-text font-mono", children: plug.name }), _jsx("span", { className: "text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold bg-brand-success/15 text-brand-success", children: "Y\u00FCklendi" })] }), plug.loaded_tools && plug.loaded_tools.length > 0 ? (_jsxs("div", { className: "mt-2.5 space-y-1.5", children: [_jsx("div", { className: "text-[10px] font-semibold text-brand-textSoft uppercase tracking-wider", children: "Kay\u0131t Edilen Ara\u00E7lar (Tools):" }), _jsx("div", { className: "flex flex-wrap gap-1", children: plug.loaded_tools.map((tool) => (_jsxs("span", { className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border border-brand-border bg-brand-panel text-brand-textSoft", children: [_jsx(Icon, { name: "bolt", size: 10, className: "text-brand-accent" }), tool] }, tool))) })] })) : (_jsx("div", { className: "mt-2 text-xs text-brand-mutedSoft italic", children: "Bu eklenti herhangi bir tool kaydetmedi." }))] })] }) }, plug.name))) }))] })] }));
}
// ============================================================
// Ajan Yönetimi Sekmesi
// ============================================================
function AgentsManagerTab({ onEditAgent, onDeleteAgent, onDuplicateAgent, onReloadAgents }) {
    const [allAgents, setAllAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const loadAgents = async (silent = false) => {
        if (!silent)
            setLoading(true);
        try {
            const list = await api.listAgents(true); // includeInactive = true
            setAllAgents(list);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            if (!silent)
                setLoading(false);
        }
    };
    useEffect(() => {
        loadAgents();
    }, []);
    const handleToggleActive = async (id, currentStatus) => {
        // 1. Optimistic UI update: Toggle state instantly in the UI with no flash
        setAllAgents((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: !currentStatus } : a)));
        try {
            await api.updateAgent(id, { is_active: !currentStatus });
            await loadAgents(true); // Silent reload behind the scenes
            onReloadAgents?.(); // Notify App.tsx to reload active agents list
        }
        catch (err) {
            console.error(err);
            // Rollback to the previous state on error
            setAllAgents((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: currentStatus } : a)));
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-brand-text", children: "Ajan Havuzu (T\u00FCm Ajanlar)" }), _jsx("p", { className: "text-[11px] text-brand-mutedSoft mt-0.5", children: "Sistemdeki aktif ve pasif t\u00FCm uzman ajanlar\u0131 buradan y\u00F6netebilir, pasif ajanlar\u0131 tekrar aktifle\u015Ftirebilirsiniz." })] }), loading ? (_jsx("div", { className: "text-center py-8 text-xs text-brand-mutedSoft font-mono", children: "Y\u00FCkleniyor..." })) : allAgents.length === 0 ? (_jsx("div", { className: "text-center py-8 text-xs text-brand-mutedSoft font-mono", children: "Sistemde tan\u0131ml\u0131 ajan bulunamad\u0131." })) : (_jsx("div", { className: "grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1", children: allAgents.map((agent) => (_jsxs("div", { className: `flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ease-in-out ${agent.is_active
                        ? 'bg-brand-panelAlt/40 border-brand-border hover:border-brand-borderStrong shadow-[0_2px_8px_rgba(0,0,0,0.12)]'
                        : 'bg-brand-bg/15 border-brand-border/30 opacity-60 hover:opacity-80'}`, children: [_jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [_jsx("img", { src: getModelLogo(agent.model, agent.provider), alt: "", className: `w-8 h-8 object-contain rounded-md p-1 flex-shrink-0 transition-all duration-300 ${agent.is_active ? 'bg-brand-bg/50 scale-100' : 'bg-brand-bg/20 scale-95 filter grayscale opacity-75'}` }), _jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: `font-semibold text-xs truncate transition-colors duration-300 ${agent.is_active ? 'text-brand-text' : 'text-brand-mutedSoft'}`, children: agent.name }), _jsx("span", { className: `px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide font-mono uppercase transition-all duration-300 ${agent.is_active
                                                        ? 'bg-brand-accent/15 text-brand-accent shadow-[0_0_8px_rgba(var(--brand-accent-rgb,var(--color-brand-accent-rgb,0,166,126)),0.1)]'
                                                        : 'bg-brand-muted/15 text-brand-mutedSoft'}`, children: agent.is_active ? 'Aktif' : 'Pasif' })] }), _jsxs("div", { className: "text-[10px] text-brand-mutedSoft font-mono truncate mt-0.5", children: [agent.provider, " / ", agent.model] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { type: "button", onClick: () => handleToggleActive(agent.id, agent.is_active), className: `w-9 h-5 rounded-full p-0.5 transition-all duration-300 ease-in-out focus:outline-none border ${agent.is_active
                                        ? 'bg-brand-accent border-brand-accent/30 shadow-[0_0_10px_rgba(20,163,127,0.25)]'
                                        : 'bg-brand-bg/40 border-brand-border/40'}`, children: _jsx("div", { className: `bg-white w-3.5 h-3.5 rounded-full shadow-lg transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${agent.is_active ? 'translate-x-4 bg-white' : 'translate-x-0 bg-brand-mutedSoft/65'}` }) }), _jsx("button", { type: "button", onClick: () => onEditAgent?.(agent.id), title: "D\u00FCzenle", className: "p-1 rounded hover:bg-brand-panelAlt text-brand-muted hover:text-brand-text transition-all duration-200", children: _jsx(Icon, { name: "edit", size: 14 }) }), _jsx("button", { type: "button", onClick: () => {
                                        onDuplicateAgent?.(agent.id);
                                        setTimeout(() => loadAgents(true), 1200); // refresh list silently
                                    }, title: "Kopyala", className: "p-1 rounded hover:bg-brand-panelAlt text-brand-muted hover:text-brand-text transition-all duration-200", children: _jsx(Icon, { name: "content_copy", size: 14 }) }), _jsx("button", { type: "button", onClick: () => {
                                        onDeleteAgent?.(agent.id);
                                        setTimeout(() => loadAgents(true), 1200); // refresh list silently
                                    }, title: "Sil", className: "p-1 rounded hover:bg-brand-danger/10 text-brand-muted hover:text-brand-danger transition-all duration-200", children: _jsx(Icon, { name: "delete", size: 14 }) })] })] }, agent.id))) }))] }));
}
