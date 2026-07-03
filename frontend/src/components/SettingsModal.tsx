import { useEffect, useRef, useState } from 'react';
import { THEMES, type ThemeId } from '@/hooks/useTheme';
import { useAppearance, type Density, type FontSize } from '@/hooks/useAppearance';
import { api } from '@/api/client';
import { Icon } from './Icon';
import { getModelLogo } from '../utils/modelHelper';
import type { ConnectionTestResponse, ProviderName, AgentInfo } from '@/types';

interface SettingsModalProps {
  theme: ThemeId;
  onChangeTheme: (t: ThemeId) => void;
  onClose: () => void;
  onRequestReset: () => void;
  initialTab?: TabId;
  onEditAgent?: (id: string) => void;
  onDeleteAgent?: (id: string) => void;
  onDuplicateAgent?: (id: string) => void;
  onReloadAgents?: () => void;
}

export type TabId = 'agents' | 'theme' | 'apikeys' | 'plugins_mcp' | 'reset' | 'about';

const TAB_CONFIG: Record<TabId, { icon: string; label: string }> = {
  agents: { icon: 'smart_toy', label: 'Ajan Havuzu' },
  theme: { icon: 'palette', label: 'Görünüm' },
  apikeys: { icon: 'vpn_key', label: 'API Anahtarları' },
  plugins_mcp: { icon: 'extension', label: 'Eklentiler & MCP' },
  reset: { icon: 'restart_alt', label: 'Sıfırla' },
  about: { icon: 'info', label: 'Hakkında' }};

export function SettingsModal({
  theme,
  onChangeTheme,
  onClose,
  onRequestReset,
  initialTab,
  onEditAgent,
  onDeleteAgent,
  onDuplicateAgent,
  onReloadAgents}: SettingsModalProps) {
  const [tab, setTab] = useState<TabId>(initialTab ?? 'agents');

  const [initialTheme] = useState<ThemeId>(theme);
  const [pendingTheme, setPendingTheme] = useState<ThemeId>(theme);
  const isDirty = pendingTheme !== initialTheme;

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(560);

  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Measure unconstrained tab content height, add headers, footer, padding (approx 140px)
        const computedHeight = entry.contentRect.height + 140;
        const bounded = Math.max(500, Math.min(computedHeight, window.innerHeight * 0.88));
        setContentHeight(bounded);
      }
    });

    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [tab]);

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
      <div 
        style={{ height: `${contentHeight}px` }}
        className="w-full max-w-3xl max-h-[92vh] flex rounded-xl border border-brand-borderStrong bg-brand-panel shadow-2xl overflow-hidden animate-modal-in transition-[height] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
      >
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
            <div key={tab} ref={contentRef} className="animate-step-in">
              {tab === 'agents' && (
                <AgentsManagerTab
                  onEditAgent={(id) => {
                    onEditAgent?.(id);
                    onClose();
                  }}
                  onDeleteAgent={onDeleteAgent}
                  onDuplicateAgent={onDuplicateAgent}
                  onReloadAgents={onReloadAgents}
                />
              )}
              {tab === 'theme' && (
                <ThemeTab
                  theme={pendingTheme}
                  onChangeTheme={setPendingTheme}
                  initialTheme={initialTheme}
                />
              )}
              {tab === 'apikeys' && <ApiKeysTab />}
              {tab === 'plugins_mcp' && <PluginsMcpTab />}
              {tab === 'reset' && <ResetTab onRequestReset={onRequestReset} />}
              {tab === 'about' && <AboutTab />}
            </div>
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
      <div className="flex items-center justify-center gap-2 text-xs text-brand-muted min-h-[250px]">
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
  const osInfo = typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Windows') ? 'Windows x64' : navigator.userAgent.includes('Mac') ? 'macOS (Darwin)' : 'Linux') : 'Windows x64';

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
      {/* Hero */}
      <div className="text-center py-4 bg-brand-panelAlt/30 rounded-lg border border-brand-border/60 p-4 relative overflow-hidden shadow-inner">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-accent/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex justify-center">
          <img
            src="/logo.png"
            className="w-20 h-20 rounded-2xl object-contain shadow-2xl border border-brand-border/80 p-0.5 hover:scale-105 transition-transform duration-300"
            alt="Argus Logo"
          />
        </div>
        <h2 className="text-2xl font-black text-brand-text mt-3 tracking-tight">
          Argus
        </h2>
        <p className="text-xs text-brand-mutedSoft mt-1.5 inline-flex items-center gap-1.5 font-mono">
          <Icon name="bolt" size={13} weight={600} filled className="text-brand-accent animate-pulse" />
          <span>Aynı anda her şeyi gören çoklu ajan sistemi</span>
          <span className="text-brand-border">·</span>
          <span className="bg-brand-accent/10 text-brand-accent px-1.5 py-0.5 rounded text-[10px] font-bold">v0.4.5-LATEST</span>
        </p>
      </div>

      {/* Tanım */}
      <AboutSection icon="description" title="Proje Hakkında & Vizyon">
        <p className="leading-relaxed text-[11.5px] text-brand-textSoft">
          Argus; geliştiriciler, veri bilimciler ve sistem mühendisleri için tasarlanmış 
          <strong> otonom ve yarı otonom çoklu ajan (Multi-Agent) kontrol panelidir</strong>. 
          Geleneksel chat arayüzlerinin aksine Argus, her biri farklı dil modelleriyle (LLM) 
          güçlendirilmiş uzman ajanları tek bir çatı altında koordine edebilir, hedefleri gerçekleştirmek için 
          çok adımlı otonom planlama, sorgulama ve araç çalıştırma (Tool Use) süreçlerini yönetebilir.
        </p>
      </AboutSection>

      {/* Sistem Durumu */}
      <AboutSection icon="check_circle" title="Uygulama Çalışma Bilgileri">
        <div className="grid grid-cols-2 gap-2 mt-1">
          <InfoRow icon="desktop_windows" label="Çalıştığı İşletim Sistemi" value={osInfo} />
          <InfoRow icon="javascript" label="Runtime Motoru" value="Electron 33 · React 18" />
          <InfoRow icon="terminal" label="Sistem Ajan Shell" value="PowerShell (Win)" />
          <InfoRow icon="api" label="Yerel Backend API" value="FastAPI · Async Python" />
        </div>
      </AboutSection>

      {/* Öne Çıkan Özellikler */}
      <AboutSection icon="auto_awesome" title="Öne Çıkan Ajan Kabiliyetleri">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Feat icon="hub" text="Hiyerarşik Çoklu Model: OpenAI, Anthropic, Gemini, DeepSeek, Mistral, xAI Grok ve yerel modellerin (Ollama/LM Studio) tek projede eş zamanlı çalışması." />
          <Feat icon="psychology" text="Otonom Planlama Döngüsü: Hedef bazlı 1-7 adımlı dinamik planlama, yürütme, gözlem (reflection) ve planda otomatik sapma düzeltmesi (re-planning)." />
          <Feat icon="build" text="Gelişmiş Araç Entegrasyonu: 60'tan fazla yerleşik araçla (dosya sistemi, web tarayıcısı, Git, veritabanı, e-posta, terminal yürütme, görüntü üretimi)." />
          <Feat icon="schema" text="Bilgi Grafiği & Bellek: Ajanlar arası paylaşılan anlamsal ilişkileri gösteren interaktif Bilgi Grafiği (Knowledge Graph) ve ChromaDB tabanlı Vektör Bellek." />
          <Feat icon="schedule" text="Zamanlanmış Otonom Görevler: Cron ifadeleriyle tetiklenen arka plan ajansal görevleri ve karmaşık iş akışı (YAML Pipeline) desteği." />
          <Feat icon="security" text="HITL & Güvenlik: Kritik işletim sistemi ve dosya erişim işlemlerinde İnsan Onayı (Human-In-The-Loop) ve HMAC-SHA256 zincirli bütünlük kayıt sistemi." />
        </div>
      </AboutSection>

      {/* Klavye Kısayolları */}
      <AboutSection icon="keyboard" title="Klavye Kısayolları & Hızlı Erişim">
        <div className="border border-brand-border rounded-lg overflow-hidden bg-brand-panelAlt/50 text-[11px] font-mono">
          <div className="grid grid-cols-3 gap-2 p-2 border-b border-brand-border bg-brand-panel font-bold text-brand-text">
            <div>Kısayol Kombinasyonu</div>
            <div className="col-span-2">İşlem / Tetiklediği Aksiyon</div>
          </div>
          <div className="divide-y divide-brand-border">
            <div className="grid grid-cols-3 gap-2 p-2 items-center">
              <div><kbd className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border text-brand-accent">Ctrl + K</kbd></div>
              <div className="col-span-2">Komut Paletini Aç / Kapat (Fuzzy Search)</div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 items-center">
              <div><kbd className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">Ctrl + N</kbd></div>
              <div className="col-span-2">Yeni Sohbet Oturumu Başlat (Ekranı Temizle)</div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 items-center">
              <div><kbd className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">Ctrl + Shift + N</kbd></div>
              <div className="col-span-2">Yeni Uzman Ajan Yapılandırma Formunu Aç</div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 items-center">
              <div><kbd className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">Ctrl + Shift + M</kbd></div>
              <div className="col-span-2">Mevcut Sohbet Geçmişini Markdown (.md) Olarak İndir</div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 items-center">
              <div><kbd className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">Ctrl + Shift + E</kbd></div>
              <div className="col-span-2">Aktif Ajan Konfigürasyonunu Dışa Aktar (JSON)</div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 items-center">
              <div><kbd className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">Ctrl + Alt + L</kbd></div>
              <div className="col-span-2">Sistem Sağlık ve Canlı Performans Log Panelini Göster/Gizle</div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 items-center">
              <div><kbd className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">Ctrl + Shift + U</kbd></div>
              <div className="col-span-2">Ajanları Konfigürasyon Dosyasından (agents.yaml) Yeniden Oku</div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 items-center">
              <div><kbd className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">Ctrl + 1..9</kbd></div>
              <div className="col-span-2">Sıradaki Uzman Ajan ile Sohbet Ekranına Hızlıca Geçiş Yap</div>
            </div>
            <div className="grid grid-cols-3 gap-2 p-2 items-center">
              <div><kbd className="bg-brand-bg px-1.5 py-0.5 rounded border border-brand-border">Ctrl + Alt + 1..9</kbd></div>
              <div className="col-span-2">Sıradaki Uzman Ajanın Ayarlarını ve Promplarını Düzenle</div>
            </div>
          </div>
        </div>
      </AboutSection>

      {/* Güvenlik */}
      <AboutSection icon="shield" title="Mimari Güvenlik Standardı">
        <div className="grid grid-cols-1 gap-1.5">
          <Feat icon="lock" text="API Anahtarı Güvenliği: Tüm kimlik bilgileri yerel veritabanında Fernet (AES-128) şifreleme algoritması ile izole şekilde saklanır." />
          <Feat icon="visibility_off" text="Sistem Seviyesinde Maskeleme: API anahtarları loglarda ve ekran çıktılarında sk-a***xyz biçiminde güvenli şekilde maskelenir." />
          <Feat icon="receipt_long" text="Audit Bütünlük Zinciri: Ajanların gerçekleştirdiği tüm kritik eylemler, değiştirilemeyen HMAC-SHA256 zincirli audit loguna kaydedilir." />
          <Feat icon="gavel" text="Sandboxed Execution: Terminal yürütme ve dosya silme gibi yüksek riskli işlemler, kullanıcı onayı (HITL) alınmadan kesinlikle çalıştırılmaz." />
        </div>
      </AboutSection>

      <div className="text-center text-[10px] text-brand-mutedSoft pt-4 border-t border-brand-border/60 flex items-center justify-center gap-2">
        <Icon name="copyright" size={11} weight={500} />
        <span>2026 Argus Project</span>
        <span className="text-brand-border">·</span>
        <span>MIT Lisansı (Açık Kaynak)</span>
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

function PluginsMcpTab() {
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [plugins, setPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingServer, setTogglingServer] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleServer = async (name: string, enabled: boolean) => {
    setTogglingServer(name);
    setError(null);
    setWarningMessage(null);
    try {
      const resp = await api.toggleMcpServer(name, enabled);
      setMcpServers((prev) =>
        prev.map((s) => (s.name === name ? { ...s, enabled } : s))
      );
      setWarningMessage(resp.message || 'Değişiklik kaydedildi. Etkinleşmesi için backend servisini yeniden başlatın.');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setTogglingServer(null);
    }
  };

  const getMcpIcon = (name: string) => {
    if (name === 'filesystem') return 'folder';
    if (name === 'github') return 'code';
    if (name === 'sqlite') return 'database';
    if (name === 'brave-search') return 'search';
    if (name === 'puppeteer') return 'open_in_browser';
    if (name === 'slack') return 'chat';
    if (name === 'memory') return 'memory';
    if (name === 'fetch') return 'download';
    return 'dns';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-brand-muted min-h-[250px]">
        <Icon name="progress_activity" size={14} className="animate-spin" />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning/Success Banner */}
      {warningMessage && (
        <div className="p-3 text-xs text-brand-accent bg-brand-accent/10 border border-brand-accent/40 rounded flex items-start gap-2 animate-fade-in-down">
          <Icon name="warning" size={16} className="text-brand-accent flex-shrink-0 mt-0.5" />
          <span>{warningMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3 text-xs text-brand-danger bg-brand-danger/10 border border-brand-danger/40 rounded flex items-start gap-2 animate-fade-in-down">
          <Icon name="error" size={16} className="text-brand-danger flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: MCP Servers */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="dns" size={18} className="text-brand-accent" />
          <h4 className="text-sm font-semibold text-brand-text">Model Context Protocol (MCP) Sunucuları</h4>
        </div>
        <p className="text-xs text-brand-mutedSoft mb-3">
          MCP sunucuları, yapay zeka modellerine ek araçlar (dosya okuma, GitHub erişimi, internet araması vb.) kazandırır.
        </p>

        <div className="space-y-3">
          {mcpServers.map((srv) => {
            const isToggling = togglingServer === srv.name;
            return (
              <div
                key={srv.name}
                className={`rounded border p-3.5 transition-all duration-300 ${
                  srv.enabled
                    ? 'border-brand-accent/40 bg-brand-panelAlt shadow-sm shadow-brand-accent/5'
                    : 'border-brand-border bg-brand-bg/30'
                } hover:border-brand-borderStrong`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3 min-w-0">
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded overflow-hidden">
                      <img
                        src={`/mcp/${srv.name}.png`}
                        alt={srv.name}
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fb = document.getElementById(`mcp-fb-${srv.name}`);
                          if (fb) fb.style.display = 'block';
                        }}
                      />
                      <div id={`mcp-fb-${srv.name}`} style={{ display: 'none' }} className="text-brand-accent">
                        <Icon name={getMcpIcon(srv.name)} size={20} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-brand-text capitalize">{srv.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold ${
                            srv.enabled
                              ? 'bg-brand-accent/15 text-brand-accent'
                              : 'bg-brand-borderStrong/40 text-brand-mutedSoft'
                          }`}
                        >
                          {srv.enabled ? 'Etkin' : 'Pasif'}
                        </span>
                      </div>
                      <div className="text-xs text-brand-muted mt-1 leading-snug">{srv.description}</div>
                      
                      {srv.command && srv.command.length > 0 && (
                        <div className="mt-2 text-[10px] font-mono bg-brand-bg/60 border border-brand-border p-1.5 rounded text-brand-mutedSoft overflow-x-auto whitespace-nowrap">
                          {srv.command.join(' ')}
                        </div>
                      )}

                      {srv.env && Object.keys(srv.env).length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="text-[10px] font-semibold text-brand-textSoft">Ortam Değişkenleri:</div>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.keys(srv.env).map((k) => (
                              <span key={k} className="text-[10px] font-mono bg-brand-panelAlt px-1.5 py-0.5 border border-brand-border rounded text-brand-mutedSoft">
                                {k}: <span className="text-brand-text">{srv.env[k] ? '***' : 'tanımlı değil'}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative flex items-center mt-1 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={!!srv.enabled}
                      disabled={isToggling}
                      onChange={(e) => handleToggleServer(srv.name, e.target.checked)}
                      className="sr-only"
                      id={`mcp-toggle-${srv.name}`}
                    />
                    <div
                      onClick={() => !isToggling && handleToggleServer(srv.name, !srv.enabled)}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 cursor-pointer ${
                        srv.enabled ? 'bg-brand-accent' : 'bg-brand-borderStrong'
                      } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-brand-bg shadow-md transform transition-transform duration-300 ${
                          srv.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-brand-border" />

      {/* SECTION 2: System Plugins */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon name="extension" size={18} className="text-brand-accent" />
          <h4 className="text-sm font-semibold text-brand-text">Sistem Eklentileri (Plugins)</h4>
        </div>
        <p className="text-xs text-brand-mutedSoft mb-3">
          Eklentiler, sistem klasöründeki (<code className="font-mono">plugins/</code>) Python betikleridir ve backend tarafından otomatik olarak taranıp sisteme tool olarak dahil edilir.
        </p>

        {plugins.length === 0 ? (
          <div className="p-4 rounded border border-brand-border bg-brand-bg/10 text-center text-xs text-brand-muted">
            <Icon name="hourglass_empty" size={24} className="mx-auto mb-2 text-brand-mutedSoft" />
            <span>plugins/ klasöründe henüz aktif bir Python eklentisi bulunamadı.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {plugins.map((plug) => (
              <div
                key={plug.name}
                className="rounded border border-brand-border bg-brand-bg/30 p-3.5 hover:border-brand-borderStrong transition-all"
              >
                <div className="flex items-start gap-3">
                  <Icon name="description" size={20} className="text-brand-accent mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-brand-text font-mono">{plug.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-bold bg-brand-success/15 text-brand-success">
                        Yüklendi
                      </span>
                    </div>

                    {plug.loaded_tools && plug.loaded_tools.length > 0 ? (
                      <div className="mt-2.5 space-y-1.5">
                        <div className="text-[10px] font-semibold text-brand-textSoft uppercase tracking-wider">Kayıt Edilen Araçlar (Tools):</div>
                        <div className="flex flex-wrap gap-1">
                          {plug.loaded_tools.map((tool: string) => (
                            <span
                              key={tool}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border border-brand-border bg-brand-panel text-brand-textSoft"
                            >
                              <Icon name="bolt" size={10} className="text-brand-accent" />
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-brand-mutedSoft italic">Bu eklenti herhangi bir tool kaydetmedi.</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Ajan Yönetimi Sekmesi
// ============================================================

function AgentsManagerTab({
  onEditAgent,
  onDeleteAgent,
  onDuplicateAgent,
  onReloadAgents
}: {
  onEditAgent?: (id: string) => void;
  onDeleteAgent?: (id: string) => void;
  onDuplicateAgent?: (id: string) => void;
  onReloadAgents?: () => void;
}) {
  const [allAgents, setAllAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const list = await api.listAgents(true); // includeInactive = true
      setAllAgents(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.updateAgent(id, { is_active: !currentStatus });
      await loadAgents();
      onReloadAgents?.(); // reload App.tsx active agents list
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-brand-text">Ajan Havuzu (Tüm Ajanlar)</h3>
        <p className="text-[11px] text-brand-mutedSoft mt-0.5">
          Sistemdeki aktif ve pasif tüm uzman ajanları buradan yönetebilir, pasif ajanları tekrar aktifleştirebilirsiniz.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-xs text-brand-mutedSoft font-mono">
          Yükleniyor...
        </div>
      ) : allAgents.length === 0 ? (
        <div className="text-center py-8 text-xs text-brand-mutedSoft font-mono">
          Sistemde tanımlı ajan bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1">
          {allAgents.map((agent) => (
            <div
              key={agent.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition ${
                agent.is_active
                  ? 'bg-brand-panelAlt/40 border-brand-border hover:border-brand-borderStrong'
                  : 'bg-brand-bg/25 border-brand-border/40 opacity-70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={getModelLogo(agent.model, agent.provider)}
                  alt=""
                  className="w-8 h-8 object-contain rounded-md bg-brand-bg/50 p-1 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs truncate text-brand-text">{agent.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide font-mono uppercase ${
                      agent.is_active 
                        ? 'bg-brand-accent/10 text-brand-accent' 
                        : 'bg-brand-muted/15 text-brand-mutedSoft'
                    }`}>
                      {agent.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                  <div className="text-[10px] text-brand-mutedSoft font-mono truncate mt-0.5">
                    {agent.provider} / {agent.model}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Switch (Durum değiştirme) */}
                <button
                  type="button"
                  onClick={() => handleToggleActive(agent.id, agent.is_active)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                    agent.is_active ? 'bg-brand-accent' : 'bg-brand-muted/20'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      agent.is_active ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>

                {/* Düzenle */}
                <button
                  type="button"
                  onClick={() => onEditAgent?.(agent.id)}
                  title="Düzenle"
                  className="p-1 rounded hover:bg-brand-panelAlt text-brand-muted hover:text-brand-text transition"
                >
                  <Icon name="edit" size={14} />
                </button>

                {/* Kopyala */}
                <button
                  type="button"
                  onClick={() => {
                    onDuplicateAgent?.(agent.id);
                    setTimeout(() => loadAgents(), 1200); // refresh list
                  }}
                  title="Kopyala"
                  className="p-1 rounded hover:bg-brand-panelAlt text-brand-muted hover:text-brand-text transition"
                >
                  <Icon name="content_copy" size={14} />
                </button>

                {/* Sil */}
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAgent?.(agent.id);
                    setTimeout(() => loadAgents(), 1200); // refresh list
                  }}
                  title="Sil"
                  className="p-1 rounded hover:bg-brand-danger/10 text-brand-muted hover:text-brand-danger transition"
                >
                  <Icon name="delete" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}