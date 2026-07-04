import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';
import { THEMES, type ThemeId } from '@/hooks/useTheme';
import type { ProviderName } from '@/types';

interface SetupWizardProps {
  theme: ThemeId;
  onChangeTheme: (t: ThemeId) => void;
  onFinished: () => void;
}

interface TemplateAgent {
  id: string;
  name: string;
  enName: string;
  icon: string;
  desc: string;
  enDesc: string;
  provider: ProviderName;
  model: string;
}

const TEMPLATE_AGENTS: TemplateAgent[] = [
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

export function SetupWizard({ theme, onChangeTheme, onFinished }: SetupWizardProps) {
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const [step, setStep] = useState(0);
  
  // API Anahtarları
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  
  // Doctor checks
  const [doctorStatus, setDoctorStatus] = useState<Record<string, 'ok' | 'loading' | 'error'>>({
    node: 'loading',
    python: 'loading',
    sqlite: 'loading'
  });
  const [doctorDetails, setDoctorDetails] = useState<Record<string, string>>({
    node: '',
    python: '',
    sqlite: ''
  });

  // Şablon Seçimleri
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(
    new Set(TEMPLATE_AGENTS.map((t) => t.id))
  );
  const [bulkProvider, setBulkProvider] = useState<ProviderName>('openai');
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);

  const runDoctorCheck = async () => {
    setDoctorStatus({ node: 'loading', python: 'loading', sqlite: 'loading' });
    try {
      const res = await api.getDoctorCheck();
      setDoctorStatus({
        node: res.node.ok ? 'ok' : 'error',
        python: res.python.ok ? 'ok' : 'error',
        sqlite: res.sqlite.ok ? 'ok' : 'error'
      });
      setDoctorDetails({
        node: res.node.details,
        python: res.python.details,
        sqlite: res.sqlite.details
      });
    } catch (err) {
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

  const toggleTemplate = (id: string) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
    } catch (err) {
      setBulkResult(`__ERR__${err instanceof Error ? err.message : String(err)}`);
    } finally {
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
      await Promise.allSettled(
        toDeactivate.map((id) =>
          api.updateAgent(id, { is_active: false } as any).catch(() => null)
        )
      );

      onFinished();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isDoctorReady = Object.values(doctorStatus).every(status => status === 'ok');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg bg-opacity-95 p-4 animate-backdrop-in text-brand-text">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl bg-brand-panel border border-brand-borderStrong rounded-2xl shadow-2xl p-8 relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-brand-border">
          <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20">
            <Icon name="visibility" size={24} weight={600} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">
              {lang === 'tr' ? 'Argus Sistem Kurulum Sihirbazı' : 'Argus System Setup Wizard'}
            </h1>
            <p className="text-xs text-brand-textSoft">
              {lang === 'tr' ? 'İlk açılış ve otonom çevre yapılandırmasını tamamlayın' : 'Configure first launch and autonomous environment settings'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {/* Language Toggle */}
            <div className="flex bg-brand-bg border border-brand-border p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setLang('tr')}
                className={`px-2 py-1 rounded-md transition ${lang === 'tr' ? 'bg-brand-accent text-brand-bg' : 'text-brand-textSoft hover:text-brand-text'}`}
              >
                TR
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-md transition ${lang === 'en' ? 'bg-brand-accent text-brand-bg' : 'text-brand-textSoft hover:text-brand-text'}`}
              >
                EN
              </button>
            </div>
            <div className="text-xs font-mono text-brand-accent bg-brand-accent/10 px-2.5 py-1 rounded-full border border-brand-accent/25">
              {lang === 'tr' ? `ADIM ${step + 1} / 4` : `STEP ${step + 1} / 4`}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-6">
          {step === 0 && (
            <div className="space-y-6 animate-step-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">
                    {lang === 'tr' ? '1. Sistem Teşhisi (Doctor Mode)' : '1. System Diagnostics (Doctor Mode)'}
                  </h3>
                  <p className="text-xs text-brand-textSoft mt-1">
                    {lang === 'tr' ? 'Uygulamanın yerel sisteminizde sağlıklı çalışabilmesi için bağımlılıklar kontrol ediliyor:' : 'Dependencies are being checked for smooth local operations:'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runDoctorCheck}
                  className="px-2.5 py-1 text-[10.5px] rounded-lg border border-brand-border text-brand-textSoft hover:text-brand-text flex items-center gap-1 bg-brand-panelAlt/30"
                >
                  <Icon name="refresh" size={12} />
                  {lang === 'tr' ? 'Yeniden Tara' : 'Rescan'}
                </button>
              </div>

              <div className="space-y-3">
                {/* Node */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-panelAlt/30">
                  <div className="flex items-center gap-3">
                    <Icon name="javascript" size={20} className="text-brand-accent" />
                    <div>
                      <div className="text-xs font-semibold">Node.js</div>
                      <div className="text-[10px] text-brand-textSoft">
                        {lang === 'tr' ? 'Arayüz ve Electron çalışma motoru' : 'Interface and Electron runtime engine'}
                      </div>
                      {doctorDetails.node && <div className="text-[9px] font-mono text-brand-textSoft/60 mt-0.5">{doctorDetails.node}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doctorStatus.node === 'loading' && <Icon name="progress_activity" size={16} className="animate-spin text-brand-muted" />}
                    {doctorStatus.node === 'ok' && <span className="text-[10px] bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-md border border-brand-success/20 font-semibold">{lang === 'tr' ? 'Uyumlu' : 'Compatible'}</span>}
                    {doctorStatus.node === 'error' && <span className="text-[10px] bg-brand-danger/10 text-brand-danger px-2 py-0.5 rounded-md border border-brand-danger/20 font-semibold">{lang === 'tr' ? 'Hata' : 'Error'}</span>}
                  </div>
                </div>

                {/* Python */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-panelAlt/30">
                  <div className="flex items-center gap-3">
                    <Icon name="terminal" size={20} className="text-brand-accent" />
                    <div>
                      <div className="text-xs font-semibold">Python</div>
                      <div className="text-[10px] text-brand-textSoft">
                        {lang === 'tr' ? 'Ajan planlama ve araç icra çekirdeği' : 'Agent planning and tool execution engine'}
                      </div>
                      {doctorDetails.python && <div className="text-[9px] font-mono text-brand-textSoft/60 mt-0.5">{doctorDetails.python}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doctorStatus.python === 'loading' && <Icon name="progress_activity" size={16} className="animate-spin text-brand-muted" />}
                    {doctorStatus.python === 'ok' && <span className="text-[10px] bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-md border border-brand-success/20 font-semibold">{lang === 'tr' ? 'Uyumlu' : 'Compatible'}</span>}
                    {doctorStatus.python === 'error' && <span className="text-[10px] bg-brand-danger/10 text-brand-danger px-2 py-0.5 rounded-md border border-brand-danger/20 font-semibold">{lang === 'tr' ? 'Hata' : 'Error'}</span>}
                  </div>
                </div>

                {/* Database / SQLite */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-panelAlt/30">
                  <div className="flex items-center gap-3">
                    <Icon name="storage" size={20} className="text-brand-accent" />
                    <div>
                      <div className="text-xs font-semibold">SQLite Database (WAL Mode)</div>
                      <div className="text-[10px] text-brand-textSoft">
                        {lang === 'tr' ? 'Lokal veri depolama ve işlem zinciri' : 'Local data persistence and transaction logs'}
                      </div>
                      {doctorDetails.sqlite && <div className="text-[9px] font-mono text-brand-textSoft/60 mt-0.5">{doctorDetails.sqlite}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doctorStatus.sqlite === 'loading' && <Icon name="progress_activity" size={16} className="animate-spin text-brand-muted" />}
                    {doctorStatus.sqlite === 'ok' && <span className="text-[10px] bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-md border border-brand-success/20 font-semibold">{lang === 'tr' ? 'Aktif' : 'Active'}</span>}
                    {doctorStatus.sqlite === 'error' && <span className="text-[10px] bg-brand-danger/10 text-brand-danger px-2 py-0.5 rounded-md border border-brand-danger/20 font-semibold">{lang === 'tr' ? 'Hata' : 'Error'}</span>}
                  </div>
                </div>
              </div>

              {isDoctorReady ? (
                <div className="p-3.5 bg-brand-success/5 border border-brand-success/20 rounded-xl flex items-start gap-2.5 text-xs text-brand-success">
                  <Icon name="check_circle" size={16} filled className="flex-shrink-0 mt-0.5" />
                  <div>
                    {lang === 'tr' ? (
                      <><strong>Sistem Hazır!</strong> Bilgisayarınız Argus motorunu çalıştırmak için tüm asgari gereksinimleri karşılıyor. Ayarlar adımına geçebilirsiniz.</>
                    ) : (
                      <><strong>System Ready!</strong> Your machine meets all dependencies needed to run the Argus Multi-Agent system. You may proceed.</>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-brand-danger/5 border border-brand-danger/20 rounded-xl flex items-start gap-2.5 text-xs text-brand-danger">
                  <Icon name="error" size={16} filled className="flex-shrink-0 mt-0.5" />
                  <div>
                    {lang === 'tr' ? (
                      <><strong>Hata veya Eksik:</strong> Bazı bağımlılık kontrolleri başarısız oldu. Lütfen arka planda servislerin çalıştığından ve uvicorn backend'ine erişilebildiğinden emin olun.</>
                    ) : (
                      <><strong>Diagnostics Failed:</strong> Some system checks failed. Make sure your local uvicorn backend is running and reachable.</>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-step-in">
              <div>
                <h3 className="text-sm font-semibold">
                  {lang === 'tr' ? '2. API Anahtarlarını Yapılandırın' : '2. Configure API Keys'}
                </h3>
                <p className="text-xs text-brand-textSoft mt-1">
                  {lang === 'tr' ? 'Bulut tabanlı modelleri kullanabilmek için API anahtarlarınızı girin. (Yerel modeller için bu adımı boş bırakıp geçebilirsiniz.)' : 'Provide API keys to utilize cloud-hosted LLMs. (You can skip this step if you intend to only use local models like Ollama/LM Studio.)'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* OpenAI */}
                <div className="p-4 bg-brand-panelAlt/20 border border-brand-border rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <img src="/providers/openai-official.png?v=3" className="w-4 h-4 object-contain rounded-sm" />
                    OpenAI API Key
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys.openai ? 'text' : 'password'}
                      value={openaiKey}
                      onChange={e => setOpenaiKey(e.target.value)}
                      placeholder="sk-proj-..."
                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-accent transition pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('openai')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand-mutedSoft hover:text-brand-text"
                    >
                      {showKeys.openai ? (lang === 'tr' ? 'Gizle' : 'Hide') : (lang === 'tr' ? 'Göster' : 'Show')}
                    </button>
                  </div>
                </div>

                {/* Anthropic */}
                <div className="p-4 bg-brand-panelAlt/20 border border-brand-border rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <img src="/providers/anthropic.png?v=3" className="w-4 h-4 object-contain rounded-sm" />
                    Anthropic API Key
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys.anthropic ? 'text' : 'password'}
                      value={anthropicKey}
                      onChange={e => setAnthropicKey(e.target.value)}
                      placeholder="sk-ant-api03-..."
                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-accent transition pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('anthropic')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand-mutedSoft hover:text-brand-text"
                    >
                      {showKeys.anthropic ? (lang === 'tr' ? 'Gizle' : 'Hide') : (lang === 'tr' ? 'Göster' : 'Show')}
                    </button>
                  </div>
                </div>

                {/* Google Gemini */}
                <div className="p-4 bg-brand-panelAlt/20 border border-brand-border rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <img src="/providers/gemini.png?v=3" className="w-4 h-4 object-contain rounded-sm" />
                    Google Gemini API Key
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys.gemini ? 'text' : 'password'}
                      value={geminiKey}
                      onChange={e => setGeminiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-accent transition pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('gemini')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand-mutedSoft hover:text-brand-text"
                    >
                      {showKeys.gemini ? (lang === 'tr' ? 'Gizle' : 'Hide') : (lang === 'tr' ? 'Göster' : 'Show')}
                    </button>
                  </div>
                </div>

                {/* OpenRouter */}
                <div className="p-4 bg-brand-panelAlt/20 border border-brand-border rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <img src="/providers/openrouter.png?v=3" className="w-4 h-4 object-contain rounded-sm" />
                    OpenRouter API Key
                  </div>
                  <div className="relative">
                    <input
                      type={showKeys.openrouter ? 'text' : 'password'}
                      value={openrouterKey}
                      onChange={e => setOpenrouterKey(e.target.value)}
                      placeholder="sk-or-v1-..."
                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-accent transition pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey('openrouter')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand-mutedSoft hover:text-brand-text"
                    >
                      {showKeys.openrouter ? (lang === 'tr' ? 'Gizle' : 'Hide') : (lang === 'tr' ? 'Göster' : 'Show')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-step-in">
              <div>
                <h3 className="text-sm font-semibold">
                  {lang === 'tr' ? '3. Hazır Ajan Şablonları' : '3. Template Agent Templates'}
                </h3>
                <p className="text-xs text-brand-textSoft mt-1">
                  {lang === 'tr' ? 'Uygulama başladığında aktif olacak şablon ajanları seçin:' : 'Select which templates should be automatically loaded upon start:'}
                </p>
              </div>

              {/* Bulk provider update */}
              <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-brand-accent inline-flex items-center gap-1.5">
                    <Icon name="sync" size={13} />
                    {lang === 'tr' ? 'Tüm şablonları aynı sağlayıcıya bağla' : 'Bulk align all agents to a single provider'}
                  </div>
                  <div className="text-[10px] text-brand-textSoft mt-0.5">
                    {lang === 'tr' ? 'Seçilen tüm ajanların LLM sağlayıcısını topluca günceller.' : 'Updates the LLM provider for all chosen agents instantly.'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={bulkProvider}
                    onChange={(e) => setBulkProvider(e.target.value as ProviderName)}
                    className="bg-brand-bg border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-text focus:outline-none focus:border-brand-accent"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="local">Ollama / LM Studio</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleBulkProvider}
                    disabled={bulkApplying}
                    className="px-3 py-1.5 text-xs rounded-lg bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition"
                  >
                    {bulkApplying ? '...' : (lang === 'tr' ? 'Uygula' : 'Apply')}
                  </button>
                </div>
              </div>

              {bulkResult && (
                <div className={`text-[10.5px] font-semibold flex items-center gap-1.5 px-1 ${
                  bulkResult.startsWith('__OK__') ? 'text-brand-success' : 'text-brand-danger'
                }`}>
                  <Icon name={bulkResult.startsWith('__OK__') ? 'check_circle' : 'cancel'} size={13} filled />
                  <span>{bulkResult.replace(/^__(OK|ERR)__/, '')}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[36vh] overflow-y-auto pr-1">
                {TEMPLATE_AGENTS.map((t) => {
                  const active = selectedTemplates.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTemplate(t.id)}
                      className={`text-left rounded-xl border p-3 transition-all duration-300 flex items-start gap-2.5 shadow-sm active:scale-[0.97] ${
                        active
                          ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/15'
                          : 'border-brand-border bg-brand-panelAlt/30 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <Icon
                        name={t.icon}
                        size={20}
                        className={`flex-shrink-0 mt-0.5 transition-colors ${
                          active ? 'text-brand-accent' : 'text-brand-textSoft'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-brand-text flex items-center justify-between w-full">
                          <span className="truncate">{lang === 'tr' ? t.name : t.enName}</span>
                          {active && (
                            <Icon name="check_circle" size={12} filled className="text-brand-accent flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-brand-textSoft leading-snug mt-0.5 line-clamp-1">
                          {lang === 'tr' ? t.desc : t.enDesc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-step-in">
              <div>
                <h3 className="text-sm font-semibold">
                  {lang === 'tr' ? '4. Görsel Tema Tercihi' : '4. Visual Interface Theme'}
                </h3>
                <p className="text-xs text-brand-textSoft mt-1">
                  {lang === 'tr' ? 'Uygulamanın arayüz temasını seçin (istediğiniz zaman ayarlardan değiştirebilirsiniz):' : 'Choose the application theme (changeable anytime under Settings):'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {THEMES.map((t) => {
                  const active = t.id === theme;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onChangeTheme(t.id)}
                      className={`rounded-xl border p-4 text-left transition-all duration-300 shadow-sm active:scale-[0.97] flex flex-col gap-2.5 ${
                        active
                          ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/15'
                          : 'border-brand-border bg-brand-panelAlt/30 hover:border-brand-borderStrong'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-brand-text">{t.name}</span>
                        {active && (
                          <span className="text-[9px] uppercase tracking-wider text-brand-accent font-bold bg-brand-accent/10 px-2 py-0.5 rounded-full border border-brand-accent/20 flex items-center gap-1">
                            <Icon name="check" size={10} /> {lang === 'tr' ? 'Seçili' : 'Selected'}
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-brand-textSoft leading-relaxed">{t.description}</div>
                      <ThemePalette themeId={t.id} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-brand-border bg-brand-panel z-10">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(prev => prev - 1)}
            className="px-4 py-2 text-xs rounded-lg border border-brand-border text-brand-textSoft hover:text-brand-text disabled:opacity-30 transition flex items-center gap-1.5"
          >
            <Icon name="arrow_back" size={14} />
            {lang === 'tr' ? 'Geri' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 0 && !isDoctorReady}
              onClick={() => setStep(prev => prev + 1)}
              className="px-5 py-2 text-xs rounded-lg bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition flex items-center gap-1.5"
            >
              {lang === 'tr' ? 'İleri' : 'Next'}
              <Icon name="arrow_forward" size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-6 py-2 text-xs rounded-lg bg-brand-accent text-brand-bg font-bold hover:bg-brand-accentDim transition flex items-center gap-1.5 shadow-md"
            >
              {saving ? (lang === 'tr' ? 'Kurulum Tamamlanıyor...' : 'Finalizing Setup...') : (lang === 'tr' ? 'Kurulumu Tamamla ve Başlat' : 'Complete Setup & Launch')}
              <Icon name="rocket_launch" size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Theme Palette: 4-swatch color strip
// ─────────────────────────────────────────────
function ThemePalette({ themeId }: { themeId: ThemeId }) {
  const palettes: Record<ThemeId, { color: string; label: string }[]> = {
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

  return (
    <div className="flex gap-1.5 items-center">
      {swatches.map((s, i) => (
        <div
          key={i}
          title={s.label}
          className="w-5 h-5 rounded-full border border-white/10 shadow-sm flex-shrink-0 transition-transform hover:scale-110"
          style={{ background: s.color }}
        />
      ))}
    </div>
  );
}
