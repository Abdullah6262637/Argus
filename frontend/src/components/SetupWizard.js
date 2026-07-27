import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';
import { THEMES } from '@/hooks/useTheme';
const TEMPLATE_AGENTS = [
    { id: 'developer', name: 'Geliştirici', enName: 'Developer', icon: 'code', desc: 'Kod yazar, refaktör eder, hata ayıklar', enDesc: 'Writes code, refactors, and debugs software', provider: 'openai', model: 'gpt-4o-mini' },
    { id: 'researcher', name: 'Araştırmacı', enName: 'Researcher', icon: 'travel_explore', desc: 'Web\'de derin araştırma yapar', enDesc: 'Performs deep research on the web', provider: 'openai', model: 'gpt-4o-mini' },
    { id: 'writer', name: 'Yazar', enName: 'Writer', icon: 'edit_note', desc: 'Blog, makale ve uzun form içerikler', enDesc: 'Generates blog posts, articles, and long-form content', provider: 'openai', model: 'gpt-4o-mini' },
    { id: 'social_media', name: 'Sosyal Medya', enName: 'Social Media', icon: 'campaign', desc: 'Kısa, çekici sosyal medya içerikleri', enDesc: 'Crafts short, engaging social media posts', provider: 'openai', model: 'gpt-4o-mini' },
    { id: 'devops', name: 'DevOps', enName: 'DevOps', icon: 'dns', desc: 'CI/CD, Docker, Kubernetes, sistem', enDesc: 'Manages CI/CD, Docker, Kubernetes, and system administration', provider: 'openai', model: 'gpt-4o-mini' },
    { id: 'data_analyst', name: 'Veri Analisti', enName: 'Data Analyst', icon: 'analytics', desc: 'SQL, pandas, veri analizi', enDesc: 'Handles SQL, pandas, and data science analysis', provider: 'openai', model: 'gpt-4o-mini' },
    { id: 'project_manager', name: 'Proje Yöneticisi', enName: 'Project Manager', icon: 'view_kanban', desc: 'Görev planı, durum raporları', enDesc: 'Manages tasks, roadmaps, and status reports', provider: 'openai', model: 'gpt-4o-mini' },
    { id: 'customer_support', name: 'Müşteri Desteği', enName: 'Customer Support', icon: 'support_agent', desc: 'Empatik, çözüm odaklı yanıtlar', enDesc: 'Empathetic and solution-oriented agent', provider: 'openai', model: 'gpt-4o-mini' },
    { id: 'code_reviewer', name: 'Kod Reviewer', enName: 'Code Reviewer', icon: 'rate_review', desc: 'PR\'ları kalite ve güvenlik için inceler', enDesc: 'Reviews Pull Requests for quality and security', provider: 'openai', model: 'gpt-4o-mini' },
    { id: 'translator', name: 'Çevirmen', enName: 'Translator', icon: 'translate', desc: 'TR-EN ve diğer dil çevirileri', enDesc: 'Translates between Turkish, English, and other languages', provider: 'openai', model: 'gpt-4o-mini' },
    { id: 'marketing', name: 'Pazarlama', enName: 'Marketing', icon: 'sell', desc: 'Kampanya, reklam metni, satış hunisi', enDesc: 'Creates campaigns, copywriting, and sales funnels', provider: 'openai', model: 'gpt-4o-mini' },
    { id: 'tutor', name: 'Eğitmen', enName: 'Tutor', icon: 'school', desc: 'Konuları sade örneklerle öğretir', enDesc: 'Teaches topics clearly with simple examples', provider: 'openai', model: 'gpt-4o-mini' }
];
export function SetupWizard({ theme, onChangeTheme, onFinished }) {
    const [lang, setLang] = useState('tr');
    const [step, setStep] = useState(0);
    // API Anahtarları
    const [openaiKey, setOpenaiKey] = useState('');
    const [anthropicKey, setAnthropicKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [openrouterKey, setOpenrouterKey] = useState('');
    const [showKeys, setShowKeys] = useState({});
    // Doctor checks
    const [doctorStatus, setDoctorStatus] = useState({
        node: 'loading',
        python: 'loading',
        sqlite: 'loading'
    });
    const [doctorDetails, setDoctorDetails] = useState({
        node: '',
        python: '',
        sqlite: ''
    });
    // Şablon Seçimleri
    const [selectedTemplates, setSelectedTemplates] = useState(new Set(TEMPLATE_AGENTS.map((t) => t.id)));
    const [bulkProvider, setBulkProvider] = useState('openai');
    const [bulkApplying, setBulkApplying] = useState(false);
    const [bulkResult, setBulkResult] = useState(null);
    const [saving, setSaving] = useState(false);
    const runDoctorCheck = async () => {
        setDoctorStatus({ node: 'loading', python: 'loading', sqlite: 'loading' });
        setDoctorDetails({ node: '', python: '', sqlite: '' });
        try {
            // Fetch data
            const res = await api.getDoctorCheck();
            // Step 1: Node
            await new Promise(resolve => setTimeout(resolve, 800));
            setDoctorStatus(prev => ({ ...prev, node: res.node.ok ? 'ok' : 'error' }));
            setDoctorDetails(prev => ({ ...prev, node: res.node.details }));
            // Step 2: Python
            await new Promise(resolve => setTimeout(resolve, 1000));
            setDoctorStatus(prev => ({ ...prev, python: res.python.ok ? 'ok' : 'error' }));
            setDoctorDetails(prev => ({ ...prev, python: res.python.details }));
            // Step 3: SQLite
            await new Promise(resolve => setTimeout(resolve, 1000));
            setDoctorStatus(prev => ({ ...prev, sqlite: res.sqlite.ok ? 'ok' : 'error' }));
            setDoctorDetails(prev => ({ ...prev, sqlite: res.sqlite.details }));
        }
        catch (err) {
            setDoctorStatus({ node: 'error', python: 'error', sqlite: 'error' });
            setDoctorDetails({
                node: 'Failed to communicate with backend doctor service',
                python: 'Failed to communicate with backend doctor service',
                sqlite: 'Failed to communicate with backend doctor service'
            });
        }
    };
    useEffect(() => {
        runDoctorCheck();
    }, []);
    const toggleTemplate = (id) => {
        setSelectedTemplates((prev) => {
            const next = new Set(prev);
            if (next.has(id))
                next.delete(id);
            else
                next.add(id);
            return next;
        });
    };
    const handleBulkProvider = async () => {
        setBulkApplying(true);
        setBulkResult(null);
        try {
            const res = await api.bulkUpdateProvider({
                provider: bulkProvider,
                base_url: null,
                agent_ids: TEMPLATE_AGENTS.map((t) => t.id),
                skip_ids: []
            });
            const txt = lang === 'tr' ? `${res.updated} şablon güncellendi.` : `${res.updated} templates updated.`;
            setBulkResult(`__OK__${txt}`);
        }
        catch (err) {
            setBulkResult(`__ERR__${err instanceof Error ? err.message : String(err)}`);
        }
        finally {
            setBulkApplying(false);
        }
    };
    const handleSave = async () => {
        setSaving(true);
        try {
            await api.saveSetupSettings({
                openai_key: openaiKey,
                anthropic_key: anthropicKey,
                gemini_key: geminiKey,
                openrouter_key: openrouterKey
            });
            const toDeactivate = TEMPLATE_AGENTS
                .filter((t) => !selectedTemplates.has(t.id))
                .map((t) => t.id);
            await Promise.allSettled(toDeactivate.map((id) => api.updateAgent(id, { is_active: false }).catch(() => null)));
            onFinished();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : String(err));
        }
        finally {
            setSaving(false);
        }
    };
    const toggleShowKey = (id) => {
        setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const isDoctorReady = Object.values(doctorStatus).every(status => status === 'ok');
    const STEP_GLOWS = [
        'from-brand-accent/15 via-purple-500/5 to-transparent',
        'from-blue-500/10 via-brand-accent/5 to-transparent',
        'from-emerald-500/10 via-teal-500/5 to-transparent',
        'from-rose-500/10 via-pink-500/5 to-transparent',
    ];
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-backdrop-in text-brand-text", children: _jsxs("div", { className: "w-full max-w-3xl bg-brand-panel border border-brand-borderStrong rounded-2xl shadow-2xl p-8 relative overflow-hidden flex flex-col transition-all duration-500 ease-in-out max-h-[92vh]", children: [_jsxs("div", { className: "absolute inset-0 pointer-events-none z-0", children: [_jsx("div", { className: `absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br ${STEP_GLOWS[step]} blur-[80px] transition-all duration-700 ease-out` }), _jsx("div", { className: `absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br ${STEP_GLOWS[step]} blur-[80px] transition-all duration-700 ease-out` })] }), _jsxs("div", { className: "relative z-10 flex items-center gap-3 pb-6 border-b border-brand-border", children: [_jsx("div", { className: "w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20", children: _jsx(Icon, { name: "visibility", size: 24, weight: 600 }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-lg font-bold tracking-wide", children: lang === 'tr' ? 'Argus Sistem Kurulum Sihirbazı' : 'Argus System Setup Wizard' }), _jsx("p", { className: "text-xs text-brand-textSoft", children: lang === 'tr' ? 'İlk açılış ve otonom çevre yapılandırmasını tamamlayın' : 'Configure first launch and autonomous environment settings' })] }), _jsxs("div", { className: "ml-auto flex items-center gap-3", children: [_jsxs("div", { className: "flex bg-brand-bg border border-brand-border p-0.5 rounded-lg text-[10px] font-bold", children: [_jsx("button", { type: "button", onClick: () => setLang('tr'), className: `px-2 py-1 rounded-md transition ${lang === 'tr' ? 'bg-brand-accent text-brand-bg' : 'text-brand-textSoft hover:text-brand-text'}`, children: "TR" }), _jsx("button", { type: "button", onClick: () => setLang('en'), className: `px-2 py-1 rounded-md transition ${lang === 'en' ? 'bg-brand-accent text-brand-bg' : 'text-brand-textSoft hover:text-brand-text'}`, children: "EN" })] }), _jsx("div", { className: "text-xs font-mono text-brand-accent bg-brand-accent/10 px-2.5 py-1 rounded-full border border-brand-accent/25", children: lang === 'tr' ? `ADIM ${step + 1} / 4` : `STEP ${step + 1} / 4` })] })] }), _jsx("div", { className: "relative z-10 flex-1 overflow-y-auto py-6", children: _jsxs("div", { className: "animate-step-in", children: [step === 0 && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold", children: lang === 'tr' ? '1. Sistem Teşhisi (Doctor Mode)' : '1. System Diagnostics (Doctor Mode)' }), _jsx("p", { className: "text-xs text-brand-textSoft mt-1", children: lang === 'tr' ? 'Uygulamanın yerel sisteminizde sağlıklı çalışabilmesi için bağımlılıklar kontrol ediliyor:' : 'Dependencies are being checked for smooth local operations:' })] }), _jsxs("button", { type: "button", onClick: runDoctorCheck, className: "px-2.5 py-1 text-[10.5px] rounded-lg border border-brand-border text-brand-textSoft hover:text-brand-text flex items-center gap-1 bg-brand-panelAlt/30", children: [_jsx(Icon, { name: "refresh", size: 12 }), lang === 'tr' ? 'Yeniden Tara' : 'Rescan'] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-panelAlt/30", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icon, { name: "javascript", size: 20, className: "text-brand-accent" }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold", children: "Node.js" }), _jsx("div", { className: "text-[10px] text-brand-textSoft", children: lang === 'tr' ? 'Arayüz ve Electron çalışma motoru' : 'Interface and Electron runtime engine' }), doctorDetails.node && _jsx("div", { className: "text-[9px] font-mono text-brand-textSoft/60 mt-0.5", children: doctorDetails.node })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [doctorStatus.node === 'loading' && _jsx(Icon, { name: "progress_activity", size: 16, className: "animate-spin text-brand-muted" }), doctorStatus.node === 'ok' && _jsx("span", { className: "text-[10px] bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-md border border-brand-success/20 font-semibold", children: lang === 'tr' ? 'Uyumlu' : 'Compatible' }), doctorStatus.node === 'error' && _jsx("span", { className: "text-[10px] bg-brand-danger/10 text-brand-danger px-2 py-0.5 rounded-md border border-brand-danger/20 font-semibold", children: lang === 'tr' ? 'Hata' : 'Error' })] })] }), _jsxs("div", { className: "flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-panelAlt/30", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icon, { name: "terminal", size: 20, className: "text-brand-accent" }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold", children: "Python" }), _jsx("div", { className: "text-[10px] text-brand-textSoft", children: lang === 'tr' ? 'Ajan planlama ve araç icra çekirdeği' : 'Agent planning and tool execution engine' }), doctorDetails.python && _jsx("div", { className: "text-[9px] font-mono text-brand-textSoft/60 mt-0.5", children: doctorDetails.python })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [doctorStatus.python === 'loading' && _jsx(Icon, { name: "progress_activity", size: 16, className: "animate-spin text-brand-muted" }), doctorStatus.python === 'ok' && _jsx("span", { className: "text-[10px] bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-md border border-brand-success/20 font-semibold", children: lang === 'tr' ? 'Uyumlu' : 'Compatible' }), doctorStatus.python === 'error' && _jsx("span", { className: "text-[10px] bg-brand-danger/10 text-brand-danger px-2 py-0.5 rounded-md border border-brand-danger/20 font-semibold", children: lang === 'tr' ? 'Hata' : 'Error' })] })] }), _jsxs("div", { className: "flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-panelAlt/30", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icon, { name: "storage", size: 20, className: "text-brand-accent" }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold", children: "SQLite Database (WAL Mode)" }), _jsx("div", { className: "text-[10px] text-brand-textSoft", children: lang === 'tr' ? 'Lokal veri depolama ve işlem zinciri' : 'Local data persistence and transaction logs' }), doctorDetails.sqlite && _jsx("div", { className: "text-[9px] font-mono text-brand-textSoft/60 mt-0.5", children: doctorDetails.sqlite })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [doctorStatus.sqlite === 'loading' && _jsx(Icon, { name: "progress_activity", size: 16, className: "animate-spin text-brand-muted" }), doctorStatus.sqlite === 'ok' && _jsx("span", { className: "text-[10px] bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-md border border-brand-success/20 font-semibold", children: lang === 'tr' ? 'Aktif' : 'Active' }), doctorStatus.sqlite === 'error' && _jsx("span", { className: "text-[10px] bg-brand-danger/10 text-brand-danger px-2 py-0.5 rounded-md border border-brand-danger/20 font-semibold", children: lang === 'tr' ? 'Hata' : 'Error' })] })] })] }), isDoctorReady ? (_jsxs("div", { className: "p-3.5 bg-brand-success/5 border border-brand-success/20 rounded-xl flex items-start gap-2.5 text-xs text-brand-success", children: [_jsx(Icon, { name: "check_circle", size: 16, filled: true, className: "flex-shrink-0 mt-0.5" }), _jsx("div", { children: lang === 'tr' ? (_jsxs(_Fragment, { children: [_jsx("strong", { children: "Sistem Haz\u0131r!" }), " Bilgisayar\u0131n\u0131z Argus motorunu \u00E7al\u0131\u015Ft\u0131rmak i\u00E7in t\u00FCm asgari gereksinimleri kar\u015F\u0131l\u0131yor. Ayarlar ad\u0131m\u0131na ge\u00E7ebilirsiniz."] })) : (_jsxs(_Fragment, { children: [_jsx("strong", { children: "System Ready!" }), " Your machine meets all dependencies needed to run the Argus Multi-Agent system. You may proceed."] })) })] })) : (_jsxs("div", { className: "p-3.5 bg-brand-danger/5 border border-brand-danger/20 rounded-xl flex items-start gap-2.5 text-xs text-brand-danger", children: [_jsx(Icon, { name: "error", size: 16, filled: true, className: "flex-shrink-0 mt-0.5" }), _jsx("div", { children: lang === 'tr' ? (_jsxs(_Fragment, { children: [_jsx("strong", { children: "Hata veya Eksik:" }), " Baz\u0131 ba\u011F\u0131ml\u0131l\u0131k kontrolleri ba\u015Far\u0131s\u0131z oldu. L\u00FCtfen arka planda servislerin \u00E7al\u0131\u015Ft\u0131\u011F\u0131ndan ve uvicorn backend'ine eri\u015Filebildi\u011Finden emin olun."] })) : (_jsxs(_Fragment, { children: [_jsx("strong", { children: "Diagnostics Failed:" }), " Some system checks failed. Make sure your local uvicorn backend is running and reachable."] })) })] }))] })), step === 1 && (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold", children: lang === 'tr' ? '2. API Anahtarlarını Yapılandırın' : '2. Configure API Keys' }), _jsx("p", { className: "text-xs text-brand-textSoft mt-1", children: lang === 'tr' ? 'Bulut tabanlı modelleri kullanabilmek için API anahtarlarınızı girin. (Yerel modeller için bu adımı boş bırakıp geçebilirsiniz.)' : 'Provide API keys to utilize cloud-hosted LLMs. (You can skip this step if you intend to only use local models like Ollama/LM Studio.)' })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 bg-brand-panelAlt/20 border border-brand-border rounded-xl space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs font-bold", children: [_jsx("img", { src: "/providers/openai-official.png?v=3", className: "w-4 h-4 object-contain rounded-sm" }), "OpenAI API Key"] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showKeys.openai ? 'text' : 'password', value: openaiKey, onChange: e => setOpenaiKey(e.target.value), placeholder: "sk-proj-...", className: "w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-accent transition pr-16" }), _jsx("button", { type: "button", onClick: () => toggleShowKey('openai'), className: "absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand-mutedSoft hover:text-brand-text", children: showKeys.openai ? (lang === 'tr' ? 'Gizle' : 'Hide') : (lang === 'tr' ? 'Göster' : 'Show') })] })] }), _jsxs("div", { className: "p-4 bg-brand-panelAlt/20 border border-brand-border rounded-xl space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs font-bold", children: [_jsx("img", { src: "/providers/anthropic.png?v=3", className: "w-4 h-4 object-contain rounded-sm" }), "Anthropic API Key"] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showKeys.anthropic ? 'text' : 'password', value: anthropicKey, onChange: e => setAnthropicKey(e.target.value), placeholder: "sk-ant-api03-...", className: "w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-accent transition pr-16" }), _jsx("button", { type: "button", onClick: () => toggleShowKey('anthropic'), className: "absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand-mutedSoft hover:text-brand-text", children: showKeys.anthropic ? (lang === 'tr' ? 'Gizle' : 'Hide') : (lang === 'tr' ? 'Göster' : 'Show') })] })] }), _jsxs("div", { className: "p-4 bg-brand-panelAlt/20 border border-brand-border rounded-xl space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs font-bold", children: [_jsx("img", { src: "/providers/gemini.png?v=3", className: "w-4 h-4 object-contain rounded-sm" }), "Google Gemini API Key"] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showKeys.gemini ? 'text' : 'password', value: geminiKey, onChange: e => setGeminiKey(e.target.value), placeholder: "AIzaSy...", className: "w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-accent transition pr-16" }), _jsx("button", { type: "button", onClick: () => toggleShowKey('gemini'), className: "absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand-mutedSoft hover:text-brand-text", children: showKeys.gemini ? (lang === 'tr' ? 'Gizle' : 'Hide') : (lang === 'tr' ? 'Göster' : 'Show') })] })] }), _jsxs("div", { className: "p-4 bg-brand-panelAlt/20 border border-brand-border rounded-xl space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs font-bold", children: [_jsx("img", { src: "/providers/openrouter.png?v=3", className: "w-4 h-4 object-contain rounded-sm" }), "OpenRouter API Key"] }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: showKeys.openrouter ? 'text' : 'password', value: openrouterKey, onChange: e => setOpenrouterKey(e.target.value), placeholder: "sk-or-v1-...", className: "w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-accent transition pr-16" }), _jsx("button", { type: "button", onClick: () => toggleShowKey('openrouter'), className: "absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand-mutedSoft hover:text-brand-text", children: showKeys.openrouter ? (lang === 'tr' ? 'Gizle' : 'Hide') : (lang === 'tr' ? 'Göster' : 'Show') })] })] })] })] })), step === 2 && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold", children: lang === 'tr' ? '3. Hazır Ajan Şablonları' : '3. Template Agent Templates' }), _jsx("p", { className: "text-xs text-brand-textSoft mt-1", children: lang === 'tr' ? 'Uygulama başladığında aktif olacak şablon ajanları seçin:' : 'Select which templates should be automatically loaded upon start:' })] }), _jsxs("div", { className: "rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "text-xs font-semibold text-brand-accent inline-flex items-center gap-1.5", children: [_jsx(Icon, { name: "sync", size: 13 }), lang === 'tr' ? 'Tüm şablonları aynı sağlayıcıya bağla' : 'Bulk align all agents to a single provider'] }), _jsx("div", { className: "text-[10px] text-brand-textSoft mt-0.5", children: lang === 'tr' ? 'Seçilen tüm ajanların LLM sağlayıcısını topluca günceller.' : 'Updates the LLM provider for all chosen agents instantly.' })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("select", { value: bulkProvider, onChange: (e) => setBulkProvider(e.target.value), className: "bg-brand-bg border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-text focus:outline-none focus:border-brand-accent", children: [_jsx("option", { value: "openai", children: "OpenAI" }), _jsx("option", { value: "anthropic", children: "Anthropic" }), _jsx("option", { value: "local", children: "Ollama / LM Studio" })] }), _jsx("button", { type: "button", onClick: handleBulkProvider, disabled: bulkApplying, className: "px-3 py-1.5 text-xs rounded-lg bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition", children: bulkApplying ? '...' : (lang === 'tr' ? 'Uygula' : 'Apply') })] })] }), bulkResult && (_jsxs("div", { className: `text-[10.5px] font-semibold flex items-center gap-1.5 px-1 ${bulkResult.startsWith('__OK__') ? 'text-brand-success' : 'text-brand-danger'}`, children: [_jsx(Icon, { name: bulkResult.startsWith('__OK__') ? 'check_circle' : 'cancel', size: 13, filled: true }), _jsx("span", { children: bulkResult.replace(/^__(OK|ERR)__/, '') })] })), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[36vh] overflow-y-auto pr-1", children: TEMPLATE_AGENTS.map((t) => {
                                            const active = selectedTemplates.has(t.id);
                                            return (_jsxs("button", { type: "button", onClick: () => toggleTemplate(t.id), className: `text-left rounded-xl border p-3 transition-all duration-300 flex items-start gap-2.5 shadow-sm active:scale-[0.97] ${active
                                                    ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/15'
                                                    : 'border-brand-border bg-brand-panelAlt/30 opacity-60 hover:opacity-100'}`, children: [_jsx(Icon, { name: t.icon, size: 20, className: `flex-shrink-0 mt-0.5 transition-colors ${active ? 'text-brand-accent' : 'text-brand-textSoft'}` }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "text-xs font-bold text-brand-text flex items-center justify-between w-full", children: [_jsx("span", { className: "truncate", children: lang === 'tr' ? t.name : t.enName }), active && (_jsx(Icon, { name: "check_circle", size: 12, filled: true, className: "text-brand-accent flex-shrink-0" }))] }), _jsx("div", { className: "text-[10px] text-brand-textSoft leading-snug mt-0.5 line-clamp-1", children: lang === 'tr' ? t.desc : t.enDesc })] })] }, t.id));
                                        }) })] })), step === 3 && (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold", children: lang === 'tr' ? '4. Görsel Tema Tercihi' : '4. Visual Interface Theme' }), _jsx("p", { className: "text-xs text-brand-textSoft mt-1", children: lang === 'tr' ? 'Uygulamanın arayüz temasını seçin (istediğiniz zaman ayarlardan değiştirebilirsiniz):' : 'Choose the application theme (changeable anytime under Settings):' })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: THEMES.map((t) => {
                                            const active = t.id === theme;
                                            return (_jsxs("button", { type: "button", onClick: () => onChangeTheme(t.id), className: `rounded-xl border p-4 text-left transition-all duration-300 shadow-sm active:scale-[0.97] flex flex-col gap-2.5 ${active
                                                    ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/15'
                                                    : 'border-brand-border bg-brand-panelAlt/30 hover:border-brand-borderStrong'}`, children: [_jsxs("div", { className: "flex items-center justify-between w-full", children: [_jsx("span", { className: "text-xs font-bold text-brand-text", children: t.name }), active && (_jsxs("span", { className: "text-[9px] uppercase tracking-wider text-brand-accent font-bold bg-brand-accent/10 px-2 py-0.5 rounded-full border border-brand-accent/20 flex items-center gap-1", children: [_jsx(Icon, { name: "check", size: 10 }), " ", lang === 'tr' ? 'Seçili' : 'Selected'] }))] }), _jsx("div", { className: "text-[10.5px] text-brand-textSoft leading-relaxed", children: t.description }), _jsx(ThemePalette, { themeId: t.id })] }, t.id));
                                        }) })] }))] }, step) }), _jsxs("div", { className: "flex items-center justify-between pt-6 border-t border-brand-border bg-brand-panel z-10", children: [_jsxs("button", { type: "button", disabled: step === 0, onClick: () => setStep(prev => prev - 1), className: "px-4 py-2 text-xs rounded-lg border border-brand-border text-brand-textSoft hover:text-brand-text disabled:opacity-30 transition flex items-center gap-1.5", children: [_jsx(Icon, { name: "arrow_back", size: 14 }), lang === 'tr' ? 'Geri' : 'Back'] }), step < 3 ? (_jsxs("button", { type: "button", disabled: step === 0 && !isDoctorReady, onClick: () => setStep(prev => prev + 1), className: "px-5 py-2 text-xs rounded-lg bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition flex items-center gap-1.5", children: [lang === 'tr' ? 'İleri' : 'Next', _jsx(Icon, { name: "arrow_forward", size: 14 })] })) : (_jsxs("button", { type: "button", disabled: saving, onClick: handleSave, className: "px-6 py-2 text-xs rounded-lg bg-brand-accent text-brand-bg font-bold hover:bg-brand-accentDim transition flex items-center gap-1.5 shadow-md", children: [saving ? (lang === 'tr' ? 'Kurulum Tamamlanıyor...' : 'Finalizing Setup...') : (lang === 'tr' ? 'Kurulumu Tamamla ve Başlat' : 'Complete Setup & Launch'), _jsx(Icon, { name: "rocket_launch", size: 14 })] }))] })] }) }));
}
// ─────────────────────────────────────────────
// Theme Palette: 4-swatch color strip
// ─────────────────────────────────────────────
function ThemePalette({ themeId }) {
    const palettes = {
        mono: [
            { color: '#000000', label: 'Arka plan' },
            { color: '#0a0a0a', label: 'Panel' },
            { color: '#ffffff', label: 'Vurgu' },
            { color: '#737373', label: 'İkincil' },
        ],
        midnight: [
            { color: '#0b1220', label: 'Arka plan' },
            { color: '#162238', label: 'Panel' },
            { color: '#60a5fa', label: 'Vurgu' },
            { color: '#94a3b8', label: 'İkincil' },
        ],
        sunset: [
            { color: '#1a0f0a', label: 'Arka plan' },
            { color: '#2d1b14', label: 'Panel' },
            { color: '#fb923c', label: 'Vurgu' },
            { color: '#d4b5a0', label: 'İkincil' },
        ],
        forest: [
            { color: '#0a1410', label: 'Arka plan' },
            { color: '#14261f', label: 'Panel' },
            { color: '#34d399', label: 'Vurgu' },
            { color: '#a3c4b3', label: 'İkincil' },
        ],
    };
    const swatches = palettes[themeId];
    return (_jsx("div", { className: "flex gap-1.5 items-center", children: swatches.map((s, i) => (_jsx("div", { title: s.label, className: "w-5 h-5 rounded-full border border-white/10 shadow-sm flex-shrink-0 transition-transform hover:scale-110", style: { background: s.color } }, i))) }));
}
