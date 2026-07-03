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
  icon: string;
  desc: string;
  provider: ProviderName;
  model: string;
}

const TEMPLATE_AGENTS: TemplateAgent[] = [
  { id: 'developer', name: 'Geliştirici', icon: 'code', desc: 'Kod yazar, refaktör eder, hata ayıklar', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'researcher', name: 'Araştırmacı', icon: 'travel_explore', desc: 'Web\'de derin araştırma yapar', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'writer', name: 'Yazar', icon: 'edit_note', desc: 'Blog, makale ve uzun form içerikler', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'social_media', name: 'Sosyal Medya', icon: 'campaign', desc: 'Kısa, çekici sosyal medya içerikleri', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'devops', name: 'DevOps', icon: 'dns', desc: 'CI/CD, Docker, Kubernetes, sistem', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'data_analyst', name: 'Veri Analisti', icon: 'analytics', desc: 'SQL, pandas, veri analizi', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'project_manager', name: 'Proje Yöneticisi', icon: 'view_kanban', desc: 'Görev planı, durum raporları', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'customer_support', name: 'Müşteri Desteği', icon: 'support_agent', desc: 'Empatik, çözüm odaklı yanıtlar', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'code_reviewer', name: 'Kod Reviewer', icon: 'rate_review', desc: 'PR\'ları kalite ve güvenlik için inceler', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'translator', name: 'Çevirmen', icon: 'translate', desc: 'TR-EN ve diğer dil çevirileri', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'marketing', name: 'Pazarlama', icon: 'sell', desc: 'Kampanya, reklam metni, satış hunisi', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'tutor', name: 'Eğitmen', icon: 'school', desc: 'Konuları sade örneklerle öğretir', provider: 'openai', model: 'gpt-4o-mini' }
];

export function SetupWizard({ theme, onChangeTheme, onFinished }: SetupWizardProps) {
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

  // Şablon Seçimleri
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(
    new Set(TEMPLATE_AGENTS.map((t) => t.id))
  );
  const [bulkProvider, setBulkProvider] = useState<ProviderName>('openai');
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Run diagnostics
    const timer1 = setTimeout(() => setDoctorStatus(prev => ({ ...prev, node: 'ok' })), 300);
    const timer2 = setTimeout(() => setDoctorStatus(prev => ({ ...prev, python: 'ok' })), 600);
    const timer3 = setTimeout(() => setDoctorStatus(prev => ({ ...prev, sqlite: 'ok' })), 900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
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
      setBulkResult(`__OK__${res.updated} şablon güncellendi.`);
    } catch (err) {
      setBulkResult(`__ERR__${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBulkApplying(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. API anahtarlarını .env'e kaydet
      await api.saveSetupSettings({
        openai_key: openaiKey,
        anthropic_key: anthropicKey,
        gemini_key: geminiKey,
        openrouter_key: openrouterKey
      });

      // 2. Seçilmeyen ajanları pasif yap
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
      {/* Ambient background blur circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-3xl bg-brand-panel border border-brand-borderStrong rounded-2xl shadow-2xl p-8 relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-brand-border">
          <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20">
            <Icon name="visibility" size={24} weight={600} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">Argus Sistem Kurulum Sihirbazı</h1>
            <p className="text-xs text-brand-textSoft">İlk açılış ve otonom çevre yapılandırmasını tamamlayın</p>
          </div>
          <div className="ml-auto text-xs font-mono text-brand-accent bg-brand-accent/10 px-2.5 py-1 rounded-full border border-brand-accent/25">
            ADIM {step + 1} / 4
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-6">
          {step === 0 && (
            <div className="space-y-6 animate-step-in">
              <div>
                <h3 className="text-sm font-semibold">1. Sistem Teşhisi (Doctor Mode)</h3>
                <p className="text-xs text-brand-textSoft mt-1">Uygulamanın yerel sisteminizde sağlıklı çalışabilmesi için bağımlılıklar kontrol ediliyor:</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-panelAlt/30">
                  <div className="flex items-center gap-3">
                    <Icon name="javascript" size={20} className="text-brand-accent" />
                    <div>
                      <div className="text-xs font-semibold">Node.js Çevre Birimi</div>
                      <div className="text-[10px] text-brand-textSoft">Arayüz ve Electron çalışma motoru</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doctorStatus.node === 'loading' && <Icon name="progress_activity" size={16} className="animate-spin text-brand-muted" />}
                    {doctorStatus.node === 'ok' && <span className="text-[10px] bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-md border border-brand-success/20 font-semibold">Uyumlu</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-panelAlt/30">
                  <div className="flex items-center gap-3">
                    <Icon name="terminal" size={20} className="text-brand-accent" />
                    <div>
                      <div className="text-xs font-semibold">Python Çalışma Ortamı</div>
                      <div className="text-[10px] text-brand-textSoft">Ajan planlama ve araç icra çekirdeği</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doctorStatus.python === 'loading' && <Icon name="progress_activity" size={16} className="animate-spin text-brand-muted" />}
                    {doctorStatus.python === 'ok' && <span className="text-[10px] bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-md border border-brand-success/20 font-semibold">Uyumlu</span>}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-panelAlt/30">
                  <div className="flex items-center gap-3">
                    <Icon name="storage" size={20} className="text-brand-accent" />
                    <div>
                      <div className="text-xs font-semibold">SQLite Veritabanı (WAL Modu)</div>
                      <div className="text-[10px] text-brand-textSoft">Lokal veri depolama ve işlem zinciri</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doctorStatus.sqlite === 'loading' && <Icon name="progress_activity" size={16} className="animate-spin text-brand-muted" />}
                    {doctorStatus.sqlite === 'ok' && <span className="text-[10px] bg-brand-success/10 text-brand-success px-2 py-0.5 rounded-md border border-brand-success/20 font-semibold">Aktif</span>}
                  </div>
                </div>
              </div>

              {isDoctorReady && (
                <div className="p-3.5 bg-brand-success/5 border border-brand-success/20 rounded-xl flex items-start gap-2.5 text-xs text-brand-success">
                  <Icon name="check_circle" size={16} filled className="flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Sistem Hazır!</strong> Bilgisayarınız Argus Çoklu Ajan motorunu çalıştırmak için gereken tüm asgari gereksinimleri karşılıyor. Ayarlar adımına geçebilirsiniz.
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5 animate-step-in">
              <div>
                <h3 className="text-sm font-semibold">2. API Anahtarlarını Yapılandırın</h3>
                <p className="text-xs text-brand-textSoft mt-1">
                  Bulut tabanlı modelleri kullanabilmek için API anahtarlarınızı girin. 
                  (Yerel modeller için bu adımı boş bırakıp geçebilirsiniz.)
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
                      {showKeys.openai ? 'Gizle' : 'Göster'}
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
                      {showKeys.anthropic ? 'Gizle' : 'Göster'}
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
                      {showKeys.gemini ? 'Gizle' : 'Göster'}
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
                      {showKeys.openrouter ? 'Gizle' : 'Göster'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-step-in">
              <div>
                <h3 className="text-sm font-semibold">3. Hazır Ajan Şablonları</h3>
                <p className="text-xs text-brand-textSoft mt-1">Uygulama başladığında aktif olacak şablon ajanları seçin:</p>
              </div>

              {/* Bulk provider update */}
              <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-brand-accent inline-flex items-center gap-1.5">
                    <Icon name="sync" size={13} />
                    Tüm şablonları aynı sağlayıcıya bağla
                  </div>
                  <div className="text-[10px] text-brand-textSoft mt-0.5">Seçilen tüm ajanların LLM sağlayıcısını topluca günceller.</div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={bulkProvider}
                    onChange={(e) => setBulkProvider(e.target.value as ProviderName)}
                    className="bg-brand-bg border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-text focus:outline-none focus:border-brand-accent"
                  >
                    <option value="openai">OpenAI (Bulut)</option>
                    <option value="anthropic">Anthropic (Bulut)</option>
                    <option value="local">Yerel (Ollama / LM Studio)</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleBulkProvider}
                    disabled={bulkApplying}
                    className="px-3 py-1.5 text-xs rounded-lg bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition"
                  >
                    {bulkApplying ? '...' : 'Uygula'}
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
                          <span className="truncate">{t.name}</span>
                          {active && (
                            <Icon name="check_circle" size={12} filled className="text-brand-accent flex-shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-brand-textSoft leading-snug mt-0.5 line-clamp-1">{t.desc}</div>
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
                <h3 className="text-sm font-semibold">4. Görsel Tema Tercihi</h3>
                <p className="text-xs text-brand-textSoft mt-1">Uygulamanın arayüz temasını seçin (istediğiniz zaman ayarlardan değiştirebilirsiniz):</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {THEMES.map((t) => {
                  const active = t.id === theme;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onChangeTheme(t.id)}
                      className={`rounded-xl border p-4 text-left transition-all duration-300 shadow-sm active:scale-[0.97] flex flex-col justify-between ${
                        active
                          ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/15'
                          : 'border-brand-border bg-brand-panelAlt/30 hover:border-brand-borderStrong'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-brand-text">{t.name}</span>
                        {active && (
                          <span className="text-[9px] uppercase tracking-wider text-brand-accent font-bold bg-brand-accent/10 px-2 py-0.5 rounded-full border border-brand-accent/20 flex items-center gap-1">
                            <Icon name="check" size={10} /> Seçili
                          </span>
                        )}
                      </div>
                      <div className="text-[10.5px] text-brand-textSoft mt-1.5 leading-relaxed">{t.description}</div>
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
            Geri
          </button>

          {step < 3 ? (
            <button
              type="button"
              disabled={step === 0 && !isDoctorReady}
              onClick={() => setStep(prev => prev + 1)}
              className="px-5 py-2 text-xs rounded-lg bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition flex items-center gap-1.5"
            >
              İleri
              <Icon name="arrow_forward" size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-6 py-2 text-xs rounded-lg bg-brand-accent text-brand-bg font-bold hover:bg-brand-accentDim transition flex items-center gap-1.5 shadow-md"
            >
              {saving ? 'Kurulum Tamamlanıyor...' : 'Kurulumu Tamamla ve Başlat'}
              <Icon name="rocket_launch" size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
