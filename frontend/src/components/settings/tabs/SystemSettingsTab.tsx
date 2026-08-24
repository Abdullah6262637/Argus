import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from '../../Icon';
import { PanelHeader } from '../shared/PanelHeader';
import { ToggleSwitch } from '../shared/ToggleSwitch';

export function SystemSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
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
        PLAN_REFLECTION_ENABLED: String(reflection),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-2 text-brand-mutedSoft text-xs">
        <Icon
          name="progress_activity"
          size={20}
          className="animate-spin-slow text-brand-accent"
        />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Sistem Ayarları & Çalışma Limitleri"
        description="Ajanların çalışma sınırlarını ve planlama algoritmalarını yapılandırın."
        icon="settings"
      />

      <div className="space-y-3.5">
        {/* Card 1: Max Steps */}
        <div className="p-4 rounded-2xl bg-brand-panelAlt/50 space-y-3 transition-all hover:bg-brand-panelAlt/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="straighten" size={16} className="text-brand-accent" />
              <span className="text-xs font-semibold text-brand-text">
                Maksimum Ajan Adım Sayısı
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold text-brand-accent px-2 py-0.5 rounded-lg bg-brand-accent/15">
                {maxSteps} Adım
              </span>
              <span className="text-[10.5px] text-brand-mutedSoft font-medium">
                Önerilen: 5-8
              </span>
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="20"
            value={maxSteps}
            onChange={(e) => setMaxSteps(parseInt(e.target.value))}
            className="w-full accent-brand-accent h-1.5 bg-brand-bg/80 rounded-lg appearance-none cursor-pointer"
          />

          <p className="text-[10.5px] text-brand-mutedSoft leading-relaxed">
            Ajanın tek bir görevi çözerken sonsuz döngüye girmeden atabileceği maksimum araç (tool) adım sınırıdır.
          </p>
        </div>

        {/* Card 2: Max Tokens */}
        <div className="p-4 rounded-2xl bg-brand-panelAlt/50 space-y-3 transition-all hover:bg-brand-panelAlt/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="toll" size={16} className="text-brand-accent" />
              <span className="text-xs font-semibold text-brand-text">
                Maksimum Çıktı Token Sınırı
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold text-brand-accent px-2 py-0.5 rounded-lg bg-brand-accent/15">
                {maxTokens} Token
              </span>
              <span className="text-[10.5px] text-brand-mutedSoft font-medium">
                Normal: 1024 - 4096
              </span>
            </div>
          </div>

          <input
            type="range"
            min="256"
            max="8192"
            step="256"
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
            className="w-full accent-brand-accent h-1.5 bg-brand-bg/80 rounded-lg appearance-none cursor-pointer"
          />

          <p className="text-[10.5px] text-brand-mutedSoft leading-relaxed">
            Ajanın tek bir LLM yanıtında üretebileceği maksimum token uzunluğudur. Çok büyük değerler yanıt gecikmesini artırabilir.
          </p>
        </div>

        {/* Card 3: Reflection Toggle */}
        <div className="p-4 rounded-2xl bg-brand-panelAlt/50 flex items-center justify-between gap-4 transition-all hover:bg-brand-panelAlt/70">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-brand-accent/10 flex items-center justify-center flex-shrink-0 text-brand-accent mt-0.5">
              <Icon name="psychology" size={18} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-brand-text">
                Ajan Düşünme Modu (Reflection)
              </h4>
              <p className="text-[10.5px] text-brand-mutedSoft mt-0.5 leading-relaxed">
                Ajanın bir adıma karar vermeden önce kendi planlarını sorgulamasını ve içsel değerlendirme yapmasını aktif eder.
              </p>
            </div>
          </div>
          <ToggleSwitch
            checked={reflection}
            onChange={() => setReflection(!reflection)}
            title="Düşünme modunu aç/kapat"
          />
        </div>
      </div>

      {/* Footer Action Button */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="h-9 px-5 inline-flex items-center gap-2 text-xs font-bold rounded-xl bg-brand-accent text-black hover:bg-brand-accentDim disabled:opacity-40 transition-all active:scale-95 shadow-sm"
        >
          <Icon
            name={saving ? 'progress_activity' : 'save'}
            size={15}
            className={saving ? 'animate-spin-slow' : ''}
          />
          {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-xs text-brand-success font-semibold animate-fade-in">
            <Icon name="check_circle" size={15} filled />
            Değişiklikler kaydedildi
          </span>
        )}
        {error && (
          <span className="inline-flex items-center gap-1.5 text-xs text-brand-danger font-medium">
            <Icon name="error" size={15} filled />
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
