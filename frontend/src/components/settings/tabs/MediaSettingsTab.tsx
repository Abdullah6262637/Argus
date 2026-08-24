import { useEffect, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from '../../Icon';
import { CustomSelect } from '../../CustomSelect';
import { PanelHeader } from '../shared/PanelHeader';
import { FormField } from '../shared/FormField';
import { ToggleSwitch } from '../shared/ToggleSwitch';

export function MediaSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        VOICE_ENABLED: String(voice),
        BROWSER_HEADLESS: String(headless),
        BROWSER_TIMEOUT_MS: String(browserTimeout),
        LOG_FORMAT: logFormat,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center text-xs text-brand-muted py-10">Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <PanelHeader
        title="Ses Desteği & Tarayıcı Tercihleri"
        description="Ajanların medya oynatma ve tarayıcı görünürlük tercihlerini yapılandırın."
        icon="volume_up"
      />
      <div className="space-y-5 py-2">
        {/* Voice switcher */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-brand-text inline-flex items-center gap-1.5">
              <Icon name="record_voice_over" size={14} className="text-brand-accent" />
              Sesli Yanıt ve Asistan Modu
            </div>
            <div className="text-[10px] text-brand-mutedSoft mt-0.5 leading-normal">
              Ajanın anons yapmasını, TTS (Text-to-Speech) sesli geri bildirim sistemlerini aktif hale getirir.
            </div>
          </div>
          <ToggleSwitch
            checked={voice}
            onChange={() => setVoice(!voice)}
            title="Ses modunu aç/kapat"
          />
        </div>

        {/* Headless switcher */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-brand-text inline-flex items-center gap-1.5">
              <Icon name="open_in_new" size={14} className="text-brand-accent" />
              Tarayıcı Headless Modu (Gizli Tarayıcı)
            </div>
            <div className="text-[10px] text-brand-mutedSoft mt-0.5 leading-normal">
              Ajan internette gezinti yaparken tarayıcı penceresinin gizlenmesini sağlar. Kapatılırsa Playwright tarayıcısı ekranınızda görünür olarak açılır.
            </div>
          </div>
          <ToggleSwitch
            checked={headless}
            onChange={() => setHeadless(!headless)}
            title="Headless modunu aç/kapat"
          />
        </div>

        {/* Browser timeout */}
        <FormField label="Tarayıcı Yükleme Zaman Aşımı (ms)" icon="timer">
          <input
            type="number"
            step="1000"
            min="5000"
            max="120000"
            value={browserTimeout}
            onChange={(e) => setBrowserTimeout(parseInt(e.target.value) || 30000)}
            className="w-full bg-brand-panelAlt border border-brand-border rounded-lg h-9 px-3 text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent transition-all"
            placeholder="30000"
          />
          <p className="text-[10px] text-brand-mutedSoft mt-1 leading-normal">
            Milisaniye cinsinden (Örn: 30000 = 30 saniye). Ajanın web sayfalarının yüklenmesini bekleyeceği maksimum süredir.
          </p>
        </FormField>

        <FormField label="Sistem Log Formatı" icon="description">
          <CustomSelect
            value={logFormat}
            onChange={(val) => setLogFormat(val)}
            options={[
              { value: 'text', label: 'Düz Metin (Standart Okunabilir)' },
              { value: 'json', label: 'Yapılandırılmış JSON (Makine Okunabilir)' },
            ]}
          />
          <p className="text-[10px] text-brand-mutedSoft mt-1 leading-normal">
            Backend hata ve işlem loglarının diskte hangi veri formatıyla yazılacağını belirler.
          </p>
        </FormField>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="h-9 px-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg bg-brand-accent text-brand-bg hover:bg-brand-accentDim disabled:opacity-40 transition-all active:scale-95 shadow-sm"
        >
          <Icon name={saving ? 'progress_activity' : 'save'} size={14} className={saving ? 'animate-spin-slow' : ''} />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-[11px] text-brand-success font-semibold">
            <Icon name="check_circle" size={13} filled /> Kaydedildi
          </span>
        )}
        {error && (
          <span className="inline-flex items-center gap-1 text-[11px] text-brand-danger">
            <Icon name="error" size={13} filled /> {error}
          </span>
        )}
      </div>
    </div>
  );
}
