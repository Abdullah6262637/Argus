import { useEffect, useRef, useState } from 'react';
import { THEMES, type ThemeId } from '@/hooks/useTheme';
import { useAppearance, type Density, type FontSize } from '@/hooks/useAppearance';
import { api } from '@/api/client';
import { Icon } from './Icon';
import type { ConnectionTestResponse, ProviderName } from '@/types';

interface SettingsModalProps {
  theme: ThemeId;
  onChangeTheme: (t: ThemeId) => void;
  onClose: () => void;
  onRequestReset: () => void;
  initialTab?: TabId;
}

export type TabId = 'theme' | 'apikeys' | 'reset' | 'about';

const TAB_CONFIG: Record<TabId, { icon: string; label: string }> = {
  theme: { icon: 'palette', label: 'Görünüm' },
  apikeys: { icon: 'vpn_key', label: 'API Anahtarları' },
  reset: { icon: 'restart_alt', label: 'Sıfırla' },
  about: { icon: 'info', label: 'Hakkında' }};

export function SettingsModal({
  theme,
  onChangeTheme,
  onClose,
  onRequestReset,
  initialTab}: SettingsModalProps) {
  const [tab, setTab] = useState<TabId>(initialTab ?? 'theme');

  const [initialTheme] = useState<ThemeId>(theme);
  const [pendingTheme, setPendingTheme] = useState<ThemeId>(theme);
  const isDirty = pendingTheme !== initialTheme;

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
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-backdrop-in">
      <div className="w-full max-w-3xl max-h-[92vh] flex rounded-xl border border-brand-borderStrong bg-brand-panel shadow-2xl overflow-hidden animate-modal-in">
        {/* ---------- Sol Sidebar ---------- */}
        <aside className="w-56 flex-shrink-0 border-r border-brand-border bg-brand-bg/40 flex flex-col">
          {/* Sidebar Header */}
          <div className="px-4 py-4 border-b border-brand-border flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-accent to-brand-accentDim flex items-center justify-center text-brand-bg shadow-sm">
              <Icon name="settings" size={19} weight={550} filled />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-brand-text leading-tight">
                Ayarlar
              </h2>
              <p className="text-[10px] text-brand-mutedSoft mt-0.5">
                Tercihler & yapılandırma
              </p>
            </div>
          </div>

          {/* Tab Listesi */}
          <nav className="flex-1 p-2 space-y-0.5">
            {(Object.keys(TAB_CONFIG) as TabId[]).map((t) => (
              <SidebarTab
                key={t}
                active={tab === t}
                onClick={() => setTab(t)}
                icon={TAB_CONFIG[t].icon}
                label={TAB_CONFIG[t].label}
                danger={t === 'reset'}
              />
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-brand-border text-[10px] text-brand-mutedSoft">
            <div className="flex items-center gap-1.5">
              <Icon name="verified" size={11} weight={500} />
              <span>Argus v0.4.0</span>
            </div>
          </div>
        </aside>

        {/* ---------- Sağ İçerik ---------- */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Üst başlık çubuğu */}
          <div className="h-12 px-5 flex items-center justify-between border-b border-brand-border bg-brand-panel">
            <div className="flex items-center gap-2">
              <Icon
                name={TAB_CONFIG[tab].icon}
                size={16}
                weight={550}
                filled
                className="text-brand-accent"
              />
              <h3 className="text-sm font-semibold text-brand-text">
                {TAB_CONFIG[tab].label}
              </h3>
            </div>
            <button
              onClick={handleCancel}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-panelAlt transition-all active:scale-95"
              aria-label="Kapat"
              title="Kapat (ESC)"
            >
              <Icon name="close" size={18} weight={550} />
            </button>
          </div>

          {/* İçerik */}
          <div className="flex-1 overflow-y-auto p-5">
            {tab === 'theme' && (
              <ThemeTab
                theme={pendingTheme}
                onChangeTheme={setPendingTheme}
                initialTheme={initialTheme}
              />
            )}
            {tab === 'apikeys' && <ApiKeysTab />}
            {tab === 'reset' && <ResetTab onRequestReset={onRequestReset} />}
            {tab === 'about' && <AboutTab />}
          </div>

          {/* Alt bar */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-brand-border bg-brand-bg/40">
            <div className="text-[11px]">
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 text-brand-accent font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                  Kaydedilmemiş değişiklikler
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-brand-mutedSoft">
                  <Icon name="check_circle" size={12} weight={500} filled />
                  Tüm değişiklikler güncel
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancel}
                className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-brand-border text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt hover:border-brand-borderStrong transition-all active:scale-95"
              >
                <Icon name="close" size={14} weight={550} />
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
              >
                <Icon name="save" size={14} weight={650} filled />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sidebar Tab Butonu
// ============================================================

function SidebarTab({
  active,
  onClick,
  icon,
  label,
  danger = false}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full h-9 px-3 inline-flex items-center gap-2.5 text-xs font-semibold rounded-md transition-all active:scale-[0.98] ${
        active
          ? danger
            ? 'bg-brand-danger/15 text-brand-danger'
            : 'bg-brand-accent/15 text-brand-accent'
          : 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt'
      }`}
    >
      <Icon
        name={icon}
        size={15}
        weight={active ? 600 : 500}
        filled={active}
      />
      <span className="flex-1 text-left">{label}</span>
      {active && (
        <Icon
          name="chevron_right"
          size={14}
          weight={550}
          className="opacity-70"
        />
      )}
    </button>
  );
}

// ============================================================
// Tab başlık komponenti (içeride kullanılır)
// ============================================================

function PanelHeader({
  title,
  description,
  icon}: {
  title: string;
  description?: string;
  icon?: string;
}) {
  return (
    <div className="mb-4 pb-3 border-b border-brand-border">
      <h4 className="text-[13px] font-semibold text-brand-text inline-flex items-center gap-1.5">
        {icon && (
          <Icon name={icon} size={14} weight={550} className="text-brand-accent" />
        )}
        {title}
      </h4>
      {description && (
        <p className="text-[11px] text-brand-mutedSoft mt-1 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Tema Sekmesi
// ============================================================

function ThemeTab({
  theme,
  onChangeTheme,
  initialTheme}: {
  theme: ThemeId;
  onChangeTheme: (t: ThemeId) => void;
  initialTheme: ThemeId;
}) {
  const { density, setDensity, fontSize, setFontSize } = useAppearance();

  return (
    <div className="space-y-6">
      {/* Tema seçimi */}
      <section>
        <PanelHeader
          title="Renk Teması"
          description="Bir tema seç — değişiklik anında uygulanır. Kaydet'e basmazsan eski tema geri gelir."
          icon="palette"
        />
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((t) => {
            const active = t.id === theme;
            const isOriginal = t.id === initialTheme;
            return (
              <button
                key={t.id}
                onClick={() => onChangeTheme(t.id)}
                className={`group rounded-lg border p-3 text-left transition-all active:scale-[0.98] ${
                  active
                    ? 'border-brand-accent bg-brand-accent/5 ring-2 ring-brand-accent/20 shadow-sm'
                    : 'border-brand-border hover:border-brand-borderStrong hover:bg-brand-panelAlt'
                }`}
              >
                <ThemePreview theme={t.id} />
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-brand-text">
                    {t.name}
                  </span>
                  {active ? (
                    <span className="inline-flex items-center gap-1 text-[9.5px] uppercase tracking-wider text-brand-accent font-bold">
                      <Icon name="check_circle" size={11} weight={600} filled />
                      Seçili
                    </span>
                  ) : (
                    isOriginal && (
                      <span className="text-[9px] uppercase tracking-wider text-brand-mutedSoft font-mono">
                        mevcut
                      </span>
                    )
                  )}
                </div>
                <div className="text-[10.5px] text-brand-mutedSoft mt-0.5">
                  {t.description}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Yazı boyutu */}
      <section>
        <PanelHeader
          title="Yazı Boyutu"
          description="UI'nin temel font boyutunu ayarla."
          icon="format_size"
        />
        <div className="grid grid-cols-3 gap-2">
          {(['sm', 'md', 'lg'] as FontSize[]).map((sz) => {
            const labels: Record<FontSize, string> = {
              sm: 'Küçük',
              md: 'Orta',
              lg: 'Büyük'};
            const sizes: Record<FontSize, string> = {
              sm: '12px',
              md: '14px',
              lg: '16px'};
            const previewSize: Record<FontSize, string> = {
              sm: 'text-xs',
              md: 'text-sm',
              lg: 'text-base'};
            const active = fontSize === sz;
            return (
              <button
                key={sz}
                onClick={() => setFontSize(sz)}
                className={`rounded-lg border p-2.5 text-center transition-all active:scale-[0.98] ${
                  active
                    ? 'border-brand-accent bg-brand-accent/5 ring-2 ring-brand-accent/20'
                    : 'border-brand-border hover:border-brand-borderStrong hover:bg-brand-panelAlt'
                }`}
              >
                <div
                  className={`${previewSize[sz]} font-semibold text-brand-text`}
                >
                  Aa
                </div>
                <div className="text-[11px] font-semibold text-brand-text mt-1">
                  {labels[sz]}
                </div>
                <div className="text-[10px] text-brand-mutedSoft font-mono">
                  {sizes[sz]}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* UI yoğunluğu */}
      <section>
        <PanelHeader
          title="UI Yoğunluğu"
          description="Bileşenler arası boşlukları ayarla."
          icon="density_medium"
        />
        <div className="grid grid-cols-3 gap-2">
          {(['compact', 'cozy', 'comfortable'] as Density[]).map((d) => {
            const labels: Record<Density, string> = {
              compact: 'Kompakt',
              cozy: 'Standart',
              comfortable: 'Geniş'};
            const descs: Record<Density, string> = {
              compact: 'Daha az boşluk',
              cozy: 'Varsayılan',
              comfortable: 'Daha fazla boşluk'};
            const icons: Record<Density, string> = {
              compact: 'density_small',
              cozy: 'density_medium',
              comfortable: 'density_large'};
            const active = density === d;
            return (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`rounded-lg border p-2.5 text-center transition-all active:scale-[0.98] ${
                  active
                    ? 'border-brand-accent bg-brand-accent/5 ring-2 ring-brand-accent/20'
                    : 'border-brand-border hover:border-brand-borderStrong hover:bg-brand-panelAlt'
                }`}
              >
                <Icon
                  name={icons[d]}
                  size={20}
                  weight={500}
                  className={
                    active ? 'text-brand-accent' : 'text-brand-mutedSoft'
                  }
                />
                <div className="text-[11px] font-semibold text-brand-text mt-1">
                  {labels[d]}
                </div>
                <div className="text-[10px] text-brand-mutedSoft">
                  {descs[d]}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ThemePreview({ theme }: { theme: ThemeId }) {
  const palettes: Record<ThemeId, string[]> = {
    mono: ['#000000', '#0a0a0a', '#ffffff', '#737373'],
    midnight: ['#0b1220', '#162238', '#60a5fa', '#94a3b8'],
    sunset: ['#1a0f0a', '#2d1b14', '#fb923c', '#d4b5a0'],
    forest: ['#0a1410', '#14261f', '#34d399', '#a3c4b3']};
  const colors = palettes[theme];
  return (
    <div className="flex gap-0 rounded-md overflow-hidden border border-brand-border h-12 shadow-inner">
      {colors.map((c, i) => (
        <div key={i} className="flex-1" style={{ background: c }} />
      ))}
    </div>
  );
}

// ============================================================
// API Anahtarları Sekmesi
// ============================================================

function ApiKeysTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openaiBase, setOpenaiBase] = useState('');
  const [anthropicBase, setAnthropicBase] = useState('');
  const [has, setHas] = useState<Record<string, boolean>>({});
  const [masked, setMasked] = useState<Record<string, string | null>>({});
  const [originalBases, setOriginalBases] = useState<{
    openai: string;
    anthropic: string;
  }>({ openai: '', anthropic: '' });

  const [testProvider, setTestProvider] = useState<ProviderName>('openai');
  const [testModel, setTestModel] = useState('gpt-4o-mini');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResponse | null>(null);

  // Mount tracking — async setState'leri unmount sonrası engelle
  const mountedRef = useRef(true);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    const load = async () => {
      try {
        const data = await api.getEnv();
        if (!mountedRef.current) return;

        // Defensive parse — tum alanlar opsiyonel
        const safeHas = (data && typeof data.has === 'object' && data.has) || {};
        const safeMasked =
          (data && typeof data.masked === 'object' && data.masked) || {};
        const safeValues =
          (data && typeof data.values === 'object' && data.values) || {};

        const oBase =
          typeof safeValues.OPENAI_BASE_URL === 'string'
            ? safeValues.OPENAI_BASE_URL
            : '';
        const aBase =
          typeof safeValues.ANTHROPIC_BASE_URL === 'string'
            ? safeValues.ANTHROPIC_BASE_URL
            : '';

        setHas(safeHas);
        setMasked(safeMasked);
        setOpenaiBase(oBase);
        setAnthropicBase(aBase);
        setOriginalBases({ openai: oBase, anthropic: aBase });
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mountedRef.current) setLoading(false);
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
      const values: Record<string, string | null> = {};
      if (openaiKey.trim()) values.OPENAI_API_KEY = openaiKey.trim();
      if (anthropicKey.trim()) values.ANTHROPIC_API_KEY = anthropicKey.trim();
      if (openaiBase !== originalBases.openai) {
        values.OPENAI_BASE_URL = openaiBase.trim() || null;
      }
      if (anthropicBase !== originalBases.anthropic) {
        values.ANTHROPIC_BASE_URL = anthropicBase.trim() || null;
      }

      if (Object.keys(values).length === 0) {
        // Hiçbir değişiklik yok — yine de "kaydedildi" feedback'i ver
        if (!mountedRef.current) return;
        setSaved(true);
        savedTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setSaved(false);
        }, 2000);
        return;
      }

      const res = await api.updateEnv(values);
      if (!mountedRef.current) return;

      const safeHas = (res && typeof res.has === 'object' && res.has) || {};
      const safeMasked =
        (res && typeof res.masked === 'object' && res.masked) || {};

      setHas(safeHas);
      setMasked(safeMasked);
      setOpenaiKey('');
      setAnthropicKey('');
      // Base URL'ler kaydedildi → orijinali güncelle
      setOriginalBases({
        openai: openaiBase,
        anthropic: anthropicBase});
      setSaved(true);

      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) setSaved(false);
      }, 2500);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const clearKey = async (key: 'OPENAI_API_KEY' | 'ANTHROPIC_API_KEY') => {
    setError(null);
    try {
      const res = await api.updateEnv({ [key]: null });
      if (!mountedRef.current) return;
      const safeHas = (res && typeof res.has === 'object' && res.has) || {};
      const safeMasked =
        (res && typeof res.masked === 'object' && res.masked) || {};
      setHas(safeHas);
      setMasked(safeMasked);
    } catch (err) {
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
        base_url: null});
      if (mountedRef.current) setTestResult(r);
    } catch (err) {
      if (mountedRef.current) {
        setTestResult({
          ok: false,
          provider: testProvider,
          model: testModel,
          latency_ms: 0,
          message: err instanceof Error ? err.message : String(err)});
      }
    } finally {
      if (mountedRef.current) setTesting(false);
    }
  };

  // Loading durumu — layout shift'i azaltmak için minimum yükseklik
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-brand-muted min-h-[400px]">
        <Icon
          name="progress_activity"
          size={14}
          className="animate-spin-slow"
        />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PanelHeader
        title=".env API Anahtarları"
        description="Anahtarlar backend/.env dosyasına yazılır. Asla diske düz metin olarak loglanmaz, UI'da maskelenir."
        icon="vpn_key"
      />

      <div className="space-y-3">
        <KeyRow
          label="OpenAI"
          icon="bolt"
          placeholder="sk-..."
          value={openaiKey}
          onChange={setOpenaiKey}
          hasExisting={!!has.OPENAI_API_KEY}
          maskedExisting={masked.OPENAI_API_KEY}
          onClear={() => clearKey('OPENAI_API_KEY')}
          baseLabel="Base URL"
          basePlaceholder="(varsayılan) https://api.openai.com/v1"
          baseValue={openaiBase}
          onBaseChange={setOpenaiBase}
        />
        <KeyRow
          label="Anthropic"
          icon="psychology"
          placeholder="sk-ant-..."
          value={anthropicKey}
          onChange={setAnthropicKey}
          hasExisting={!!has.ANTHROPIC_API_KEY}
          maskedExisting={masked.ANTHROPIC_API_KEY}
          onClear={() => clearKey('ANTHROPIC_API_KEY')}
          baseLabel="Base URL"
          basePlaceholder="(varsayılan) https://api.anthropic.com"
          baseValue={anthropicBase}
          onBaseChange={setAnthropicBase}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 transition-all active:scale-95 shadow-sm"
        >
          <Icon
            name={saving ? 'progress_activity' : 'save'}
            size={14}
            weight={650}
            filled
            className={saving ? 'animate-spin-slow' : ''}
          />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-[11px] text-brand-success font-semibold animate-fade-in-up">
            <Icon name="check_circle" size={13} weight={550} filled />
            Kaydedildi
          </span>
        )}
        {error && (
          <span className="inline-flex items-center gap-1 text-[11px] text-brand-danger">
            <Icon name="error" size={13} weight={500} filled />
            {error}
          </span>
        )}
      </div>

      {/* ---------- Bağlantı Testi Kartı ---------- */}
      <div className="rounded-xl border border-brand-border bg-brand-bg/40 p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-accent/15 text-brand-accent flex items-center justify-center">
            <Icon name="speed" size={18} weight={550} filled />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-brand-text">
              Bağlantıyı Test Et
            </div>
            <div className="text-[10.5px] text-brand-mutedSoft">
              Provider'a gerçek istek atıp gecikme/durum bilgisini al.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FormField label="Provider" icon="hub">
            <select
              value={testProvider}
              onChange={(e) => setTestProvider(e.target.value as ProviderName)}
              className="w-full bg-brand-bg border border-brand-border rounded-md px-2.5 py-1.5 text-xs text-brand-text focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
            >
              <option value="openai">openai</option>
              <option value="anthropic">anthropic</option>
              <option value="local">local</option>
            </select>
          </FormField>
          <FormField label="Model" icon="model_training">
            <input
              type="text"
              value={testModel}
              onChange={(e) => setTestModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className="w-full bg-brand-bg border border-brand-border rounded-md px-2.5 py-1.5 text-xs font-mono text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
            />
          </FormField>
        </div>

        <button
          onClick={runTest}
          disabled={testing || !testModel.trim()}
          className="w-full h-9 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border border-brand-border text-brand-text hover:bg-brand-panelAlt hover:border-brand-borderStrong disabled:opacity-40 transition-all active:scale-95"
        >
          <Icon
            name={testing ? 'progress_activity' : 'play_arrow'}
            size={14}
            weight={650}
            filled
            className={testing ? 'animate-spin-slow' : ''}
          />
          {testing ? 'Test Ediliyor...' : 'Test Et'}
        </button>

        {testResult && (
          <div
            className={`rounded-lg border p-3 space-y-1.5 animate-fade-in-up ${
              testResult.ok
                ? 'text-brand-success bg-brand-success/5 border-brand-success/30'
                : 'text-brand-danger bg-brand-danger/5 border-brand-danger/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold inline-flex items-center gap-1.5">
                <Icon
                  name={testResult.ok ? 'check_circle' : 'cancel'}
                  size={15}
                  weight={550}
                  filled
                />
                {testResult.ok ? 'Başarılı' : 'Başarısız'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10.5px] opacity-80 font-mono">
                <Icon name="schedule" size={11} weight={500} />
                {testResult.latency_ms} ms
              </span>
            </div>
            <div className="text-[11px] opacity-90 break-words leading-relaxed">
              {testResult.message}
            </div>
            {testResult.sample_response && (
              <div className="border-t border-current/20 pt-1.5 mt-1.5">
                <div className="text-[9.5px] uppercase tracking-wider opacity-70 mb-0.5">
                  Örnek yanıt
                </div>
                <code className="text-[10px] font-mono opacity-90 break-words">
                  {testResult.sample_response}
                </code>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Hem API key hem base URL barındıran row'u tek kart olarak gösterir. */
function KeyRow({
  label,
  icon,
  placeholder,
  value,
  onChange,
  hasExisting,
  maskedExisting,
  onClear,
  baseLabel,
  basePlaceholder,
  baseValue,
  onBaseChange}: {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hasExisting: boolean;
  maskedExisting: string | null | undefined;
  onClear: () => void;
  baseLabel: string;
  basePlaceholder: string;
  baseValue: string;
  onBaseChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="rounded-xl border border-brand-border bg-brand-bg/40 p-3.5 space-y-2.5">
      {/* Provider başlık */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-brand-accent/15 text-brand-accent flex items-center justify-center flex-shrink-0">
            <Icon name={icon} size={16} weight={550} filled />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-brand-text">
              {label}
            </div>
            <div className="text-[10px] text-brand-mutedSoft inline-flex items-center gap-1">
              {hasExisting ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-success" />
                  <span className="font-mono truncate">
                    {maskedExisting ?? '••••••••'}
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-mutedSoft" />
                  <span>Anahtar yok</span>
                </>
              )}
            </div>
          </div>
        </div>
        {hasExisting && (
          <button
            type="button"
            onClick={onClear}
            title="Anahtarı sil"
            className="w-7 h-7 rounded-md flex items-center justify-center text-brand-danger hover:bg-brand-danger/10 transition-all active:scale-95"
          >
            <Icon name="delete" size={14} weight={550} />
          </button>
        )}
      </div>

      {/* API Key input */}
      <FormField label="API Key" icon="vpn_key">
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={hasExisting ? '(değişmesin için boş bırak)' : placeholder}
            autoComplete="new-password"
            className="w-full bg-brand-bg border border-brand-border rounded-md pl-2.5 pr-9 py-1.5 text-xs font-mono text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            title={show ? 'Gizle' : 'Göster'}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center text-brand-mutedSoft hover:text-brand-text hover:bg-brand-panelAlt transition-all"
          >
            <Icon
              name={show ? 'visibility_off' : 'visibility'}
              size={14}
              weight={500}
            />
          </button>
        </div>
      </FormField>

      {/* Base URL input */}
      <FormField label={baseLabel} icon="link">
        <input
          type="text"
          value={baseValue}
          onChange={(e) => onBaseChange(e.target.value)}
          placeholder={basePlaceholder}
          className="w-full bg-brand-bg border border-brand-border rounded-md px-2.5 py-1.5 text-xs font-mono text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
        />
      </FormField>
    </div>
  );
}

/** Form alanı: ikon + etiket + içerik */
function FormField({
  label,
  icon,
  children}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[9.5px] text-brand-mutedSoft uppercase tracking-wider font-bold inline-flex items-center gap-1">
        <Icon name={icon} size={10} weight={500} />
        {label}
      </span>
      {children}
    </label>
  );
}

// ============================================================
// Sıfırla Sekmesi
// ============================================================

function ResetTab({ onRequestReset }: { onRequestReset: () => void }) {
  const items = [
    { icon: 'group', text: 'Tüm ajanlar ve API anahtarları' },
    { icon: 'forum', text: 'Tüm sohbet mesajları' },
    { icon: 'event_repeat', text: 'Tüm zamanlanmış görevler' },
    { icon: 'receipt_long', text: 'Tüm sistem logları' },
    { icon: 'memory', text: 'Tüm hafıza ve knowledge graph' },
    { icon: 'auto_awesome', text: 'Kurulum sihirbazı tekrar açılır' }];

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Tehlikeli İşlemler"
        description="Bu işlemler geri alınamaz. Lütfen dikkatli ol."
        icon="warning"
      />

      <div className="rounded-xl border-2 border-brand-danger/40 bg-brand-danger/5 p-4 space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-danger/20 text-brand-danger flex items-center justify-center flex-shrink-0">
            <Icon name="delete_forever" size={26} weight={550} filled />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-brand-text">
              Sistemi Sıfırla
            </h4>
            <p className="text-[11.5px] text-brand-textSoft mt-1 leading-relaxed">
              Tüm ajanları, sohbet geçmişini, zamanlanmış görevleri ve logları
              kalıcı olarak siler. Kurulum ekranı yeniden açılır.
            </p>
          </div>
        </div>

        {/* Silinecekler listesi — grid */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {items.map((it, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-brand-bg/40 border border-brand-danger/20"
            >
              <Icon
                name={it.icon}
                size={13}
                weight={500}
                className="text-brand-danger flex-shrink-0"
              />
              <span className="text-[10.5px] text-brand-textSoft truncate">
                {it.text}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onRequestReset}
          className="w-full h-10 inline-flex items-center justify-center gap-2 text-sm font-bold rounded-lg bg-brand-danger text-white hover:opacity-90 transition-all active:scale-95 shadow-sm"
        >
          <Icon name="restart_alt" size={18} weight={650} />
          Sistemi Sıfırla
        </button>

        <div className="flex items-start gap-1.5 text-[10px] text-brand-danger/80 italic">
          <Icon name="info" size={11} weight={500} className="flex-shrink-0 mt-px" />
          <span>
            Tıkladıktan sonra ek bir onay diyaloğu çıkacak. "SIFIRLA" yazmadan
            işlem tamamlanmaz.
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Hakkında Sekmesi
// ============================================================

function AboutTab() {
  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="text-center py-3">
        <div className="flex justify-center">
          <img
            src="/logo.png"
            className="w-16 h-16 rounded-2xl object-contain shadow-lg"
            alt="Argus Logo"
          />
        </div>
        <h2 className="text-xl font-bold text-brand-text mt-3 tracking-tight">
          Argus
        </h2>
        <p className="text-[11px] text-brand-mutedSoft mt-1 inline-flex items-center gap-1.5">
          <Icon name="bolt" size={11} weight={500} filled />
          <span>Aynı anda her şeyi gören çoklu ajan sistemi</span>
          <span className="text-brand-border">·</span>
          <span className="font-mono">v0.4.0</span>
        </p>
      </div>

      <AboutSection icon="description" title="Nedir bu program?">
        <p>
          Argus, tek bir masaüstü uygulamasından{' '}
          <strong>birden fazla AI ajanı</strong> oluşturup yönetmenizi sağlar.
          Her ajana farklı bir LLM sağlayıcı/model bağlayabilir, plan tabanlı
          otonom görevler çalıştırabilirsiniz.
        </p>
      </AboutSection>

      <AboutSection icon="auto_awesome" title="Öne Çıkan Özellikler">
        <div className="grid grid-cols-1 gap-1.5">
          <Feat icon="hub" text="Çoklu LLM: OpenAI, Anthropic, Gemini, OpenAI-uyumlu proxy'ler" />
          <Feat icon="psychology" text="Plan-driven otonomi: 1-7 step plan + reflect + replan" />
          <Feat icon="build" text="60+ tool: dosya, sistem, browser, git, email, DB, image, …" />
          <Feat icon="hub" text="Knowledge Graph + Vector store + auto-summarize" />
          <Feat icon="schedule" text="Zamanlanmış görevler (cron) + workflow YAML pipeline" />
          <Feat icon="security" text="HITL approval + HMAC-zincirli audit log + sandbox" />
          <Feat icon="palette" text="4 tema · Yazı boyutu · UI yoğunluğu" />
          <Feat icon="record_voice_over" text="Sesli komut (STT) ve metni okuma (TTS)" />
        </div>
      </AboutSection>

      <AboutSection icon="construction" title="Teknoloji Yığını">
        <div className="grid grid-cols-2 gap-2">
          <InfoRow icon="code" label="Backend" value="FastAPI · SQLAlchemy 2" />
          <InfoRow icon="api" label="Async" value="aiosqlite · APScheduler" />
          <InfoRow icon="rocket_launch" label="Frontend" value="Vite · React 18 · TS" />
          <InfoRow icon="brush" label="Styling" value="TailwindCSS" />
          <InfoRow icon="emoji_objects" label="İkonlar" value="Material Symbols" />
          <InfoRow icon="desktop_windows" label="Masaüstü" value="Electron 33" />
          <InfoRow icon="database" label="Vector" value="ChromaDB · MiniLM" />
          <InfoRow icon="account_tree" label="Graph" value="NetworkX" />
        </div>
      </AboutSection>

      <AboutSection icon="shield" title="Güvenlik">
        <div className="grid grid-cols-1 gap-1.5">
          <Feat icon="lock" text="API anahtarları yerel + Fernet ile şifreli" />
          <Feat icon="visibility_off" text="Anahtarlar her yerde maskeli (sk-a***xyz)" />
          <Feat icon="vpn_lock" text="CORS regex + trace-id propagation" />
          <Feat icon="receipt_long" text="HMAC-SHA256 zincirli audit log" />
          <Feat icon="gavel" text="Tehlikeli komutlar için HITL onay" />
        </div>
      </AboutSection>

      <div className="text-center text-[10px] text-brand-mutedSoft pt-3 border-t border-brand-border flex items-center justify-center gap-2">
        <Icon name="copyright" size={10} weight={500} />
        <span>2026 Argus</span>
        <span className="text-brand-border">·</span>
        <span>MIT Lisansı</span>
      </div>
    </div>
  );
}

function AboutSection({
  icon,
  title,
  children}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[10.5px] uppercase tracking-wider font-bold text-brand-mutedSoft mb-2 inline-flex items-center gap-1.5">
        <Icon
          name={icon}
          size={12}
          weight={550}
          className="text-brand-accent"
        />
        {title}
      </h3>
      <div className="text-xs text-brand-textSoft leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Feat({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-start gap-2 px-2.5 py-1.5 rounded-md bg-brand-panelAlt/50 border border-brand-border">
      <Icon
        name={icon}
        size={13}
        weight={550}
        className="text-brand-accent flex-shrink-0 mt-px"
      />
      <span className="text-[11px]">{text}</span>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-brand-border bg-brand-panelAlt px-2.5 py-1.5">
      <div className="text-[9px] uppercase tracking-wider text-brand-mutedSoft font-bold inline-flex items-center gap-1">
        <Icon name={icon} size={10} weight={500} />
        {label}
      </div>
      <div className="text-[11px] text-brand-text mt-0.5 font-mono truncate">
        {value}
      </div>
    </div>
  );
}