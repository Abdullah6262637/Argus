import { useEffect, useState } from 'react';
import { THEMES, type ThemeId } from '@/hooks/useTheme';
import { api } from '@/api/client';
import { Icon } from './Icon';
import type { ProviderName } from '@/types';

interface OnboardingProps {
  theme: ThemeId;
  onChangeTheme: (t: ThemeId) => void;
  onFinish: () => void;
  onCreateFirstAgent: () => void;
}

// Sprint A.11.5: 12 hazir sablon ajan + provider/model bilgisi
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
  { id: 'data_analyst', name: 'Veri Analisti', icon: 'analytics', desc: 'SQL, pandas, görselleştirme', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'project_manager', name: 'Proje Yöneticisi', icon: 'view_kanban', desc: 'Görev plani, durum raporları', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'customer_support', name: 'Müşteri Desteği', icon: 'support_agent', desc: 'Empatik, çözüm odaklı yanıtlar', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'code_reviewer', name: 'Kod Reviewer', icon: 'rate_review', desc: 'PR\'ları kalite ve güvenlik için inceler', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'translator', name: 'Çevirmen', icon: 'translate', desc: 'TR-EN ve diğer dil çevirileri', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'marketing', name: 'Pazarlama', icon: 'sell', desc: 'Kampanya, reklam metni, satış hunisi', provider: 'openai', model: 'gpt-4o-mini' },
  { id: 'tutor', name: 'Eğitmen', icon: 'school', desc: 'Konuları sade örneklerle öğretir', provider: 'openai', model: 'gpt-4o-mini' }];

type Slide = {
  id: string;
  label: string;
  icon: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
};

export function Onboarding({
  theme,
  onChangeTheme,
  onFinish,
  onCreateFirstAgent}: OnboardingProps) {
  const [step, setStep] = useState(0);

  // .env duzenleme state (Sprint A.7)
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiBase, setOpenaiBase] = useState('');
  const [anthropicBase, setAnthropicBase] = useState('');
  const [envHas, setEnvHas] = useState<Record<string, boolean>>({});
  const [envMasked, setEnvMasked] = useState<Record<string, string | null>>({});
  const [envSaving, setEnvSaving] = useState(false);
  const [envSaved, setEnvSaved] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);

  // Template secim state (Sprint A.7) — set
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(
    new Set(TEMPLATE_AGENTS.map((t) => t.id)),
  );

  // Sprint A.11.5: Bulk provider update state
  const [bulkProvider, setBulkProvider] = useState<ProviderName>('openai');
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);
  // template'lerin guncel provider'larini takip etmek icin (UI badge'leri)
  const [templateProviders, setTemplateProviders] = useState<Record<string, ProviderName>>(
    Object.fromEntries(TEMPLATE_AGENTS.map((t) => [t.id, t.provider])),
  );

  useEffect(() => {
    api.getEnv()
      .then((data) => {
        setEnvHas(data.has || {});
        setEnvMasked(data.masked || {});
        setOpenaiBase((data.values?.OPENAI_BASE_URL as string) ?? '');
        setAnthropicBase((data.values?.ANTHROPIC_BASE_URL as string) ?? '');
      })
      .catch(() => { /* sessiz */ });

    // Mevcut ajanlarin gercek provider'larini cek
    api.listAgents()
      .then((agents) => {
        const map: Record<string, ProviderName> = {};
        for (const a of agents) {
          if (TEMPLATE_AGENTS.some((t) => t.id === a.id)) {
            map[a.id] = a.provider as ProviderName;
          }
        }
        setTemplateProviders((prev) => ({ ...prev, ...map }));
      })
      .catch(() => { /* sessiz */ });
  }, []);

  const saveEnv = async () => {
    setEnvSaving(true);
    setEnvError(null);
    setEnvSaved(false);
    try {
      const values: Record<string, string | null> = {};
      if (openaiKey.trim()) values.OPENAI_API_KEY = openaiKey.trim();
      if (anthropicKey.trim()) values.ANTHROPIC_API_KEY = anthropicKey.trim();
      if (openaiBase !== (envMasked?.OPENAI_BASE_URL ?? '')) {
        values.OPENAI_BASE_URL = openaiBase.trim() || null;
      }
      if (anthropicBase !== (envMasked?.ANTHROPIC_BASE_URL ?? '')) {
        values.ANTHROPIC_BASE_URL = anthropicBase.trim() || null;
      }
      if (Object.keys(values).length === 0) {
        setEnvSaved(true);
        return;
      }
      const res = await api.updateEnv(values);
      setEnvHas(res.has || {});
      setEnvMasked(res.masked || {});
      setOpenaiKey('');
      setAnthropicKey('');
      setEnvSaved(true);
    } catch (err) {
      setEnvError(err instanceof Error ? err.message : String(err));
    } finally {
      setEnvSaving(false);
    }
  };

  const toggleTemplate = (id: string) => {
    setSelectedTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Sectim sonrasi: secilmeyen template'leri pasiflestir
  const applyTemplateSelection = async () => {
    const toDeactivate = TEMPLATE_AGENTS
      .filter((t) => !selectedTemplates.has(t.id))
      .map((t) => t.id);
    await Promise.allSettled(
      toDeactivate.map((id) =>
        api.updateAgent(id, { is_active: false } as any).catch(() => null),
      ),
    );
  };

  // Sprint A.11.5: Bulk provider update
  const applyBulkProvider = async () => {
    // .env'de gerekli key var mi?
    const reqKey = bulkProvider === 'anthropic' ? 'ANTHROPIC_API_KEY'
      : bulkProvider === 'openai' ? 'OPENAI_API_KEY'
      : null;
    if (reqKey && !envHas[reqKey]) {
      setBulkResult(`__WARN__${reqKey} .env'de yok. Önce "Anahtar" slaytına dön ve key ekle.`);
      return;
    }
    setBulkApplying(true);
    setBulkResult(null);
    try {
      const baseUrl = bulkProvider === 'openai'
        ? openaiBase || null
        : bulkProvider === 'anthropic'
          ? anthropicBase || null
          : null;
      const res = await api.bulkUpdateProvider({
        provider: bulkProvider,
        base_url: baseUrl,
        agent_ids: TEMPLATE_AGENTS.map((t) => t.id),
        skip_ids: ['sa']});
      setBulkResult(`__OK__${res.updated} ajan güncellendi`);
      // template provider state guncelle
      const map: Record<string, ProviderName> = {};
      for (const id of res.agent_ids) map[id] = bulkProvider;
      setTemplateProviders((prev) => ({ ...prev, ...map }));
    } catch (err) {
      setBulkResult(`__ERR__${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBulkApplying(false);
    }
  };

  const slides: Slide[] = [
    {
      id: 'welcome',
      label: 'Hoş Geldin',
      icon: 'waving_hand',
      title: "Argus'a Hoş Geldin",
      subtitle: 'Yerel AI ajan sisteminiz kurulmaya hazır',
      content: (
        <div className="space-y-3 text-sm text-brand-textSoft leading-relaxed">
          <p>
            Argus, masaüstünde <strong>birden fazla AI ajanını</strong>{' '}
            tek çatıda yöneten bir uygulamadır. Her ajanın kendi kişiliği,
            kendi LLM sağlayıcısı, kendi API anahtarı olabilir.
          </p>
          <p>
            Klasik bir chatbottan <em>çok daha fazlası</em>: zamanlanmış
            görevler, medya yetenekleri, 4 farklı tema, sağ tık menüler —
            hepsi çevrimdışı çalışan yerel bir uygulamada.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-2">
            <FeatureMini icon="smart_toy" text="Çoklu ajan" />
            <FeatureMini icon="hub" text="Çoklu LLM" />
            <FeatureMini icon="computer" text="Tamamen yerel" />
          </div>
        </div>
      )},
    {
      id: 'theme',
      label: 'Tema',
      icon: 'palette',
      title: 'Temani sec',
      subtitle: 'Istedigin zaman ayarlardan degisebilirsin',
      content: (
        <div className="space-y-4 text-sm text-brand-textSoft leading-relaxed">
          <p>
            Gozuine rahat gelecek bir tema sec. Degisiklik anlik olarak ekrana
            yansiyacak — boylece hangisini sevdigini gorerek karar verebilirsin.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {THEMES.map((t) => {
              const active = t.id === theme;
              return (
                <button
                  key={t.id}
                  onClick={() => onChangeTheme(t.id)}
                  className={`rounded border p-3 text-left transition ${
                    active
                      ? 'border-brand-accent bg-brand-panelAlt ring-1 ring-brand-accent/30'
                      : 'border-brand-border hover:border-brand-borderStrong'
                  }`}
                >
                  <ThemeStrip id={t.id} />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-brand-text">
                      {t.name}
                    </span>
                    {active && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-brand-accent font-bold">
                        <Icon name="check_circle" size={12} filled /> secili
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-brand-muted mt-0.5">
                    {t.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )},
    {
      id: 'providers',
      label: 'LLM',
      icon: 'hub',
      title: 'Modelin nereden gelecek?',
      subtitle: 'OpenAI, Anthropic ve herhangi bir uyumlu endpoint',
      content: (
        <div className="space-y-3 text-sm text-brand-textSoft leading-relaxed">
          <p>
            Argus bir modele bağımlı <strong>değildir</strong>. Aşağıdakilerin
            hepsini destekler:
          </p>
          <ul className="space-y-2 pl-0 list-none">
            <ProviderItem
              icon="bolt"
              name="OpenAI"
              desc="GPT-5, GPT-4.1, GPT-4o, o3, o4-mini ve digerleri"
            />
            <ProviderItem
              icon="psychology"
              name="Anthropic"
              desc="Claude Opus 4.7, Sonnet 4.5, Haiku 4.5 vb."
            />
            <ProviderItem
              icon="extension"
              name="OpenAI uyumlu proxy/provider'lar"
              desc="OpenRouter, Azure OpenAI, LM Studio, Ollama, Groq, Together, frostai.xyz, kendi ozel endpoint'in..."
            />
          </ul>
          <div className="rounded border border-brand-accent/30 bg-brand-accent/5 p-3 text-xs flex items-start gap-2">
            <Icon name="lightbulb" size={16} className="text-brand-accent flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-brand-accent">Ipucu:</strong> Her ajan
              kendi <code className="font-mono text-brand-accent">base_url</code>{' '}
              ve <code className="font-mono text-brand-accent">api_key</code>'ini
              kullanabilir.
            </div>
          </div>
        </div>
      )},
    {
      id: 'setup',
      label: 'Anahtar',
      icon: 'key',
      title: 'API anahtarlarini gir (opsiyonel)',
      subtitle: 'Simdi gir, sonra ayarlardan da degistirebilirsin',
      content: (
        <div className="space-y-4 text-sm text-brand-textSoft leading-relaxed">
          <p className="text-xs">
            Anahtarlar <code className="font-mono text-brand-accent">backend/.env</code> dosyasina yazilir
            ve <strong>asla sunucuya gonderilmez</strong>. Bos birakirsan ileride{' '}
            <strong>Ayarlar → API Anahtarlari</strong> sekmesinden ekleyebilirsin.
          </p>

          <div className="space-y-3">
            <EnvKeyField
              label="OpenAI API Key"
              icon="bolt"
              placeholder="sk-..."
              value={openaiKey}
              onChange={setOpenaiKey}
              hasExisting={!!envHas.OPENAI_API_KEY}
              maskedExisting={envMasked.OPENAI_API_KEY}
            />
            <EnvUrlField
              label="OpenAI Base URL (opsiyonel)"
              placeholder="https://api.openai.com/v1 veya proxy"
              value={openaiBase}
              onChange={setOpenaiBase}
            />
            <EnvKeyField
              label="Anthropic API Key"
              icon="psychology"
              placeholder="sk-ant-..."
              value={anthropicKey}
              onChange={setAnthropicKey}
              hasExisting={!!envHas.ANTHROPIC_API_KEY}
              maskedExisting={envMasked.ANTHROPIC_API_KEY}
            />
            <EnvUrlField
              label="Anthropic Base URL (opsiyonel)"
              placeholder="https://api.anthropic.com veya proxy"
              value={anthropicBase}
              onChange={setAnthropicBase}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={saveEnv}
              disabled={envSaving}
              className="px-4 py-2 text-xs rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition inline-flex items-center gap-1.5"
            >
              <Icon name="save" size={14} />
              {envSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
            {envSaved && (
              <span className="text-[11px] text-brand-success inline-flex items-center gap-1">
                <Icon name="check_circle" size={12} filled /> Kaydedildi
              </span>
            )}
            {envError && (
              <span className="text-[11px] text-brand-danger">{envError}</span>
            )}
          </div>

          <ul className="list-none pl-0 space-y-1 text-[11px] pt-1 border-t border-brand-border mt-2">
            <CheckItem text="Anahtarlar yalnizca yerel .env dosyasinda saklanir" />
            <CheckItem text="UI'da maskelenmis gorunur (ornek: sk-a***-xyz)" />
            <CheckItem text="Bos birakirsan adim atlanir; ileride ekleyebilirsin" />
          </ul>
        </div>
      )},
    {
      id: 'templates',
      label: 'Sablonlar',
      icon: 'category',
      title: 'Hazir ajan sablonlarini sec',
      subtitle: '12 sablonu ihtiyacina gore aktif/pasif yapabilirsin',
      content: (
        <div className="space-y-3 text-sm text-brand-textSoft leading-relaxed">
          <p className="text-xs">
            Hangileri <strong>aktif</strong> baslasin? Pasif yaptiklarini sonradan tek tikla
            yeniden ekleyebilirsin.
          </p>

          {/* Sprint A.11.5: Bulk provider update */}
          <div className="rounded border border-brand-accent/30 bg-brand-accent/5 p-2.5 space-y-2">
            <div className="text-[11px] font-semibold text-brand-accent inline-flex items-center gap-1.5">
              <Icon name="sync" size={13} />
              Tüm şablonları aynı provider'a bağla
            </div>
            <div className="flex items-center gap-2">
              <select
                value={bulkProvider}
                onChange={(e) => setBulkProvider(e.target.value as ProviderName)}
                className="flex-1 bg-brand-bg border border-brand-border rounded px-2 py-1.5 text-xs text-brand-text"
              >
                <option value="openai">OpenAI / proxy</option>
                <option value="anthropic">Anthropic</option>
                <option value="local">Yerel (Ollama, LM Studio)</option>
              </select>
              <button
                onClick={applyBulkProvider}
                disabled={bulkApplying}
                className="px-3 py-1.5 text-xs rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition"
              >
                {bulkApplying ? 'Uyguluyor...' : 'Uygula'}
              </button>
            </div>
            {bulkResult && (
              <div
                className={`text-[11px] flex items-center gap-1.5 ${
                  bulkResult.startsWith('__OK__')
                    ? 'text-brand-success'
                    : bulkResult.startsWith('__ERR__')
                      ? 'text-brand-danger'
                      : 'text-yellow-500'
                }`}
              >
                <Icon
                  name={
                    bulkResult.startsWith('__OK__')
                      ? 'check_circle'
                      : bulkResult.startsWith('__ERR__')
                        ? 'error'
                        : 'warning'
                  }
                  size={13}
                  weight={500}
                  filled
                />
                <span>
                  {bulkResult.replace(/^__(OK|ERR|WARN)__/, '')}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] text-brand-mutedSoft">
              {selectedTemplates.size} / {TEMPLATE_AGENTS.length} aktif
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTemplates(new Set(TEMPLATE_AGENTS.map((t) => t.id)))}
                className="text-[11px] text-brand-accent hover:underline"
              >
                Tumunu sec
              </button>
              <button
                onClick={() => setSelectedTemplates(new Set())}
                className="text-[11px] text-brand-mutedSoft hover:text-brand-text"
              >
                Tumunu kaldir
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATE_AGENTS.map((t) => {
              const active = selectedTemplates.has(t.id);
              const currentProvider = templateProviders[t.id] ?? t.provider;
              const reqKey = currentProvider === 'anthropic' ? 'ANTHROPIC_API_KEY'
                : currentProvider === 'openai' ? 'OPENAI_API_KEY'
                : null;
              const keyMissing = reqKey ? !envHas[reqKey] : false;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTemplate(t.id)}
                  className={`text-left rounded border p-2.5 transition flex items-start gap-2 ${
                    active
                      ? 'border-brand-accent bg-brand-panelAlt ring-1 ring-brand-accent/30'
                      : 'border-brand-border bg-brand-bg/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center flex-shrink-0 ${
                      active
                        ? 'bg-brand-accent/15 text-brand-accent'
                        : 'bg-brand-panel text-brand-muted'
                    }`}
                  >
                    <Icon name={t.icon} size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-brand-text flex items-center gap-1">
                      {t.name}
                      {active && (
                        <Icon name="check_circle" size={11} filled className="text-brand-accent" />
                      )}
                    </div>
                    <div className="text-[10px] text-brand-mutedSoft truncate">{t.desc}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <ProviderBadge provider={currentProvider} />
                      {keyMissing && (
                        <span title={`${reqKey} .env'de yok`} className="text-[9px] text-brand-warning inline-flex items-center gap-0.5">
                          <Icon name="warning" size={10} />
                          key yok
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )},
    {
      id: 'permissions',
      label: 'Izinler',
      icon: 'admin_panel_settings',
      title: 'Ajan Guvenligi ve Yetkiler',
      subtitle: 'Her ajanin sistemde neleri kontrol edecegine siz karar verin.',
      content: (
        <div className="space-y-3 text-sm text-brand-textSoft leading-relaxed">
          <p>
            Guvenlik odakli tasarimi sayesinde, her bir ajan icin otonom yetenekleri kisitlayabilir veya serbest birakabilirsiniz. 
            Ajan olustururken <strong>Dosya Sistemi</strong>, <strong>Terminal Calistirmak</strong> gibi hassas izinler tek tek ayarlanabilir.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <FeatureMini icon="folder_locked" text="Dosya Okuma/Yazma" />
            <FeatureMini icon="terminal" text="Sistem Komutlari" />
            <FeatureMini icon="public" text="Web Agi Erisimi" />
            <FeatureMini icon="security" text="Tam Sistem Yetkisi" />
          </div>
          <div className="rounded border border-brand-accent/30 bg-brand-accent/5 p-3 text-xs flex items-start gap-2 mt-2">
            <Icon name="info" size={16} className="text-brand-accent flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-brand-accent">Unutmayin:</strong> Yanlislikla yikici bir komut calistirilmasini onlemek icin, test ajanlarinda terminal yetkisini her zaman kapatabilirsiniz.
            </div>
          </div>
        </div>
      )},
    {
      id: 'usage',
      label: 'Kullanim',
      icon: 'menu_book',
      title: 'Temel kullanim kilavuzu',
      subtitle: 'Ajanlar, sohbet, gorevler ve ayarlar',
      content: (
        <div className="space-y-3 text-sm text-brand-textSoft leading-relaxed">
          <div className="grid grid-cols-1 gap-2">
            <UsageCard
              icon="add_circle"
              title="Yeni ajan olustur"
              desc="Sag ustteki '+ Yeni Ajan' butonuyla 6 adimli sihirbazi ac. Saglayici, model, soul, izin profili, plugin'ler — hepsi tek yerde."
            />
            <UsageCard
              icon="ads_click"
              title="Sag tik menusu"
              desc="Sol paneldeki ajana sag tiklayinca 5 secenek: Duzenle, Yeni Sohbet, Kopyala, Disa Aktar, Sil."
            />
            <UsageCard
              icon="schedule"
              title="Zamanlanmis gorev"
              desc="Sag panelden cron ile her gun/saat tetiklenen gorevler ekle. Preset'lerden tek tikla sec."
            />
            <UsageCard
              icon="tune"
              title="Ayarlar"
              desc="Sag ustteki disli ikonuyla temasni degistir, API anahtarlarini yonet, sistemi sifirla."
            />
            <UsageCard
              icon="forum"
              title="Sohbet"
              desc="Ajani sectikten sonra ortada sohbet penceresi acilir. Enter ile gonder, Shift+Enter ile yeni satir."
            />
          </div>
        </div>
      )},
    {
      id: 'ready',
      label: 'Hazir',
      icon: 'rocket_launch',
      title: selectedTemplates.size > 0 ? `${selectedTemplates.size} ajan seni bekliyor` : 'Hadi ilk ajanini olusturalim',
      subtitle: selectedTemplates.size > 0 ? 'Ana sayfaya gec ve sohbete basla' : 'Yeni ajan formu acilacak',
      content: (
        <div className="space-y-4 text-center">
          <div className="text-5xl py-4 text-brand-accent">
            <Icon name={selectedTemplates.size > 0 ? 'celebration' : 'rocket_launch'} size={64} filled />
          </div>
          <div className="text-sm text-brand-textSoft leading-relaxed max-w-sm mx-auto">
            {selectedTemplates.size > 0 ? (
              <>
                Sectigin <strong>{selectedTemplates.size}</strong> sablon aktif kalacak. Diger
                {' '}{TEMPLATE_AGENTS.length - selectedTemplates.size} sablon pasiflestirilecek
                (sonra ayarlardan geri actirabilirsin).
              </>
            ) : (
              <>
                Hicbir sablon secmedin. Ilk adimi <strong>"Ilk Ajanimi Olustur"</strong> ile
                atabilir veya <strong>"Daha sonra"</strong> ile kendin kesfedebilirsin.
              </>
            )}
          </div>
          <div className="flex gap-2 justify-center pt-3">
            {selectedTemplates.size > 0 ? (
              <>
                <button
                  onClick={async () => {
                    await applyTemplateSelection();
                    onFinish();
                  }}
                  className="px-5 py-2.5 text-sm rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim transition inline-flex items-center gap-2"
                >
                  <Icon name="home" size={18} />
                  Ana Sayfaya Git
                </button>
                <button
                  onClick={async () => {
                    await applyTemplateSelection();
                    onFinish();
                    onCreateFirstAgent();
                  }}
                  className="px-5 py-2.5 text-sm rounded border border-brand-border text-brand-textSoft hover:text-brand-text hover:border-brand-borderStrong transition inline-flex items-center gap-2"
                >
                  <Icon name="add_circle" size={18} />
                  Yeni Ajan da Olustur
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={async () => {
                    await applyTemplateSelection();
                    onFinish();
                    onCreateFirstAgent();
                  }}
                  className="px-5 py-2.5 text-sm rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim transition inline-flex items-center gap-2"
                >
                  <Icon name="rocket_launch" size={18} />
                  Ilk Ajanimi Olustur
                </button>
                <button
                  onClick={async () => {
                    await applyTemplateSelection();
                    onFinish();
                  }}
                  className="px-5 py-2.5 text-sm rounded border border-brand-border text-brand-textSoft hover:text-brand-text hover:border-brand-borderStrong transition"
                >
                  Daha sonra
                </button>
              </>
            )}
          </div>
        </div>
      )}];

  const current = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-brand-bg text-brand-text">
      {/* Ust bar */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-brand-border bg-brand-panel flex-shrink-0">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            className="w-6 h-6 rounded object-contain"
            alt="Argus Logo"
          />
          <span className="text-sm font-semibold tracking-wide">Argus</span>
          <span className="text-[11px] text-brand-muted">· Kurulum</span>
        </div>
        <button
          onClick={onFinish}
          className="text-[11px] text-brand-muted hover:text-brand-text transition"
        >
          Kurulumu atla
        </button>
      </div>

      {/* Icerik */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-10">
          {/* Progress */}
          <div className="flex items-center gap-1 mb-8">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className="flex-1 group"
                type="button"
              >
                <div
                  className={`h-1 rounded-full transition ${
                    i <= step ? 'bg-brand-accent' : 'bg-brand-border'
                  }`}
                />
                <div
                  className={`mt-1.5 text-[10px] uppercase tracking-wider transition ${
                    i === step
                      ? 'text-brand-accent font-bold'
                      : i < step
                        ? 'text-brand-text'
                        : 'text-brand-muted'
                  }`}
                >
                  {s.label}
                </div>
              </button>
            ))}
          </div>

          {/* Slayt Icerigi (Animasyonlu) */}
          <div key={current.id} className="animate-fade-in-up">
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-brand-panelAlt border border-brand-border flex items-center justify-center text-brand-accent">
                <Icon name={current.icon} size={32} />
              </div>
              <h2 className="text-2xl font-bold text-brand-text tracking-wide">
                {current.title}
              </h2>
              <p className="text-xs text-brand-muted mt-1.5">{current.subtitle}</p>
            </div>

            {/* Icerik kart */}
            <div className="rounded-lg border border-brand-border bg-brand-panel p-6">
              {current.content}
            </div>
          </div>
        </div>
      </div>

      {/* Navigasyon */}
      <div className="px-8 py-4 border-t border-brand-border bg-brand-panel flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-4 py-2 text-sm rounded border border-brand-border text-brand-textSoft hover:text-brand-text disabled:opacity-30 transition inline-flex items-center gap-1"
        >
          <Icon name="arrow_back" size={16} /> Geri
        </button>
        <div className="text-[11px] text-brand-mutedSoft">
          {step + 1} / {slides.length}
        </div>
        {!isLast ? (
          <button
            onClick={() => setStep((s) => Math.min(slides.length - 1, s + 1))}
            className="px-5 py-2 text-sm rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim transition inline-flex items-center gap-1"
          >
            Ileri <Icon name="arrow_forward" size={16} />
          </button>
        ) : (
          <div style={{ width: 80 }} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// Alt bilesenler
// ============================================================

function FeatureMini({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="rounded border border-brand-border bg-brand-panelAlt px-3 py-2 text-center">
      <div className="text-brand-accent flex justify-center">
        <Icon name={icon} size={22} />
      </div>
      <div className="text-[11px] text-brand-textSoft mt-0.5">{text}</div>
    </div>
  );
}

function ProviderItem({
  icon,
  name,
  desc}: {
  icon: string;
  name: string;
  desc: string;
}) {
  return (
    <li className="rounded border border-brand-border bg-brand-panelAlt px-3 py-2 flex items-start gap-3">
      <div className="w-8 h-8 rounded bg-brand-panel text-brand-accent flex items-center justify-center flex-shrink-0">
        <Icon name={icon} size={20} />
      </div>
      <div>
        <div className="text-sm font-semibold text-brand-text">{name}</div>
        <div className="text-[11px] text-brand-muted mt-0.5">{desc}</div>
      </div>
    </li>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <Icon
        name="check_circle"
        size={14}
        filled
        className="text-brand-success flex-shrink-0 mt-0.5"
      />
      <span>{text}</span>
    </li>
  );
}

function UsageCard({
  icon,
  title,
  desc}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded border border-brand-border bg-brand-panelAlt p-3 flex items-start gap-3">
      <div className="w-9 h-9 rounded bg-brand-panel text-brand-accent flex items-center justify-center flex-shrink-0">
        <Icon name={icon} size={22} />
      </div>
      <div>
        <div className="text-sm font-semibold text-brand-text">{title}</div>
        <div className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">
          {desc}
        </div>
      </div>
    </div>
  );
}

// Sprint A.11.5: Provider badge
function ProviderBadge({ provider }: { provider: ProviderName }) {
  const styles: Partial<Record<ProviderName, { label: string; cls: string }>> = {
    openai: { label: 'OpenAI', cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
    anthropic: { label: 'Anthropic', cls: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
    local: { label: 'Yerel', cls: 'border-blue-500/40 bg-blue-500/10 text-blue-400' }};
  const s = styles[provider] ?? { label: provider, cls: 'border-brand-border bg-brand-panel text-brand-textSoft' };
  return (
    <span className={`inline-flex items-center px-1 py-0.5 rounded text-[9px] font-mono border ${s.cls}`}>
      {s.label}
    </span>
  );
}

// ============================================================
// Env editor alt bilesenleri (Sprint A.7)
// ============================================================

function EnvKeyField({
  label,
  icon,
  placeholder,
  value,
  onChange,
  hasExisting,
  maskedExisting}: {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hasExisting: boolean;
  maskedExisting: string | null | undefined;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-[11px] text-brand-textSoft flex items-center gap-1.5 mb-1">
        <Icon name={icon} size={13} className="text-brand-accent" />
        {label}
        {hasExisting && (
          <span className="text-[10px] text-brand-mutedSoft">
            (mevcut: {maskedExisting ?? '••••'})
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hasExisting ? '(degismesin icin bos birak)' : placeholder}
          autoComplete="new-password"
          className="w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent transition pr-16"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-brand-muted hover:text-brand-text px-2 py-0.5 border border-brand-border rounded"
        >
          {show ? 'Gizle' : 'Goster'}
        </button>
      </div>
    </div>
  );
}

function EnvUrlField({
  label,
  placeholder,
  value,
  onChange}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px] text-brand-textSoft mb-1 block">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent transition"
      />
    </div>
  );
}

function ThemeStrip({ id }: { id: ThemeId }) {
  const palettes: Record<ThemeId, string[]> = {
    mono: ['#000000', '#0a0a0a', '#ffffff', '#737373'],
    midnight: ['#0b1220', '#162238', '#60a5fa', '#94a3b8'],
    sunset: ['#1a0f0a', '#2d1b14', '#fb923c', '#d4b5a0'],
    forest: ['#0a1410', '#14261f', '#34d399', '#a3c4b3']};
  return (
    <div className="flex rounded overflow-hidden border border-brand-border h-10">
      {palettes[id].map((c, i) => (
        <div key={i} className="flex-1" style={{ background: c }} />
      ))}
    </div>
  );
}