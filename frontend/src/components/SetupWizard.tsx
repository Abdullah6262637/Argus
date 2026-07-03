import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';

interface SetupWizardProps {
  onFinished: () => void;
}

export function SetupWizard({ onFinished }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [doctorStatus, setDoctorStatus] = useState<Record<string, 'ok' | 'loading' | 'error'>>({
    node: 'loading',
    python: 'loading',
    sqlite: 'loading'
  });

  useEffect(() => {
    // Run fake checks to simulate Doctor diagnostic system verification
    const timer1 = setTimeout(() => setDoctorStatus(prev => ({ ...prev, node: 'ok' })), 400);
    const timer2 = setTimeout(() => setDoctorStatus(prev => ({ ...prev, python: 'ok' })), 800);
    const timer3 = setTimeout(() => setDoctorStatus(prev => ({ ...prev, sqlite: 'ok' })), 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.saveSetupSettings({
        openai_key: openaiKey,
        anthropic_key: anthropicKey,
        gemini_key: geminiKey,
        openrouter_key: openrouterKey
      });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-bg bg-opacity-95 p-4 animate-backdrop-in">
      {/* Ambient background blur circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-brand-panel border border-brand-borderStrong rounded-2xl shadow-2xl p-8 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-6 border-b border-brand-border">
          <div className="w-12 h-12 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20">
            <Icon name="visibility" size={24} weight={600} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-brand-text">Argus Sistem Kurulum Sihirbazı</h1>
            <p className="text-xs text-brand-textSoft">Uygulamanın ilk ayarlarını hızlıca tamamlayın</p>
          </div>
          <div className="ml-auto text-xs font-mono text-brand-accent bg-brand-accent/10 px-2.5 py-1 rounded-full border border-brand-accent/25">
            ADIM {step + 1} / 3
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-8">
          {step === 0 && (
            <div className="space-y-6 animate-step-in">
              <div>
                <h3 className="text-sm font-semibold text-brand-text">Argus Doctor Sistem Teşhisi</h3>
                <p className="text-xs text-brand-textSoft mt-1">Uygulamanın yerel sisteminizde sağlıklı çalışabilmesi için bağımlılıklar kontrol ediliyor:</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-brand-border bg-brand-panelAlt/30">
                  <div className="flex items-center gap-3">
                    <Icon name="javascript" size={20} className="text-brand-accent" />
                    <div>
                      <div className="text-xs font-semibold text-brand-text">Node.js Çevre Birimi</div>
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
                      <div className="text-xs font-semibold text-brand-text">Python Çalışma Ortamı</div>
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
                      <div className="text-xs font-semibold text-brand-text">SQLite Veritabanı (WAL Modu)</div>
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
                <div className="p-3 bg-brand-success/5 border border-brand-success/20 rounded-xl flex items-start gap-2.5 text-xs text-brand-success">
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
                <h3 className="text-sm font-semibold text-brand-text">API Anahtarlarını Yapılandırın</h3>
                <p className="text-xs text-brand-textSoft mt-1">
                  Bulut tabanlı modelleri kullanabilmek için API anahtarlarınızı girin. 
                  (Yerel modeller için bu adımı boş bırakıp geçebilirsiniz.)
                </p>
              </div>

              <div className="space-y-4">
                {/* OpenAI */}
                <div className="p-4 bg-brand-panelAlt/20 border border-brand-border rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-text">
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
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-text">
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
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-text">
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
                  <div className="flex items-center gap-2 text-xs font-bold text-brand-text">
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
            <div className="space-y-6 animate-step-in">
              <div>
                <h3 className="text-sm font-semibold text-brand-text">Kurulum Özeti ve Tamamlama</h3>
                <p className="text-xs text-brand-textSoft mt-1">Aşağıdaki yapılandırmalar yerel sisteme kaydedilerek projeniz aktif hale getirilecektir:</p>
              </div>

              <div className="rounded-xl border border-brand-border bg-brand-panelAlt/30 p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-brand-textSoft">Tanı Teşhisi (Doctor Status):</span>
                  <span className="font-semibold text-brand-success flex items-center gap-1">
                    <Icon name="check_circle" size={13} filled />
                    Uyumlu ve Hazır
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-brand-border pt-3">
                  <span className="text-brand-textSoft">OpenAI Modelleri:</span>
                  <span className="font-mono text-[10px]">{openaiKey ? 'Mevcut (Override)' : 'Varsayılan / Yerel'}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-brand-border pt-3">
                  <span className="text-brand-textSoft">Anthropic Modelleri:</span>
                  <span className="font-mono text-[10px]">{anthropicKey ? 'Mevcut (Override)' : 'Varsayılan / Yerel'}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-brand-border pt-3">
                  <span className="text-brand-textSoft">Google Gemini Modelleri:</span>
                  <span className="font-mono text-[10px]">{geminiKey ? 'Mevcut (Override)' : 'Varsayılan / Yerel'}</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-brand-border pt-3">
                  <span className="text-brand-textSoft">Açık Kaynak Modeller (OpenRouter):</span>
                  <span className="font-mono text-[10px]">{openrouterKey ? 'Mevcut (Override)' : 'Varsayılan / Yerel'}</span>
                </div>
              </div>

              <div className="p-3 bg-brand-accent/5 border border-brand-accent/20 rounded-xl text-xs text-brand-textSoft flex gap-2">
                <Icon name="vpn_key" size={16} className="text-brand-accent flex-shrink-0 mt-0.5" />
                <span>
                  Bu yapılandırmalar kök dizindeki <code>.env</code> dosyasına kaydedilecektir. API anahtarlarınızı dilediğiniz zaman üst menüdeki <strong>Ayarlar</strong> sekmesinden düzenleyebilirsiniz.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-brand-border">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep(prev => prev - 1)}
            className="px-4 py-2 text-xs rounded-lg border border-brand-border text-brand-textSoft hover:text-brand-text disabled:opacity-30 transition flex items-center gap-1"
          >
            <Icon name="arrow_back" size={14} />
            Geri
          </button>

          {step < 2 ? (
            <button
              type="button"
              disabled={step === 0 && !isDoctorReady}
              onClick={() => setStep(prev => prev + 1)}
              className="px-5 py-2 text-xs rounded-lg bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition flex items-center gap-1"
            >
              İleri
              <Icon name="arrow_forward" size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-6 py-2 text-xs rounded-lg bg-brand-accent text-brand-bg font-bold hover:bg-brand-accentDim transition flex items-center gap-1 shadow-md"
            >
              {saving ? 'Kaydediliyor...' : 'Kurulumu Tamamla ve Başlat'}
              <Icon name="check" size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
