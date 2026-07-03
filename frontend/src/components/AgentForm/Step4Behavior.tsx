import { useEffect, useState } from 'react';
import { Icon } from '../Icon';
import { StepHeading, Field, CustomSelect, inputCls } from './FormComponents';
import { api } from '@/api/client';
import type { SoulInfo } from '@/types';

export function StepBehavior({
  systemPrompt,
  setSystemPrompt,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  tagsText,
  setTagsText,
  isActive,
  setIsActive
}: {
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  temperature: number;
  setTemperature: (v: number) => void;
  maxTokens: number;
  setMaxTokens: (v: number) => void;
  tagsText: string;
  setTagsText: (v: string) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
}) {
  const [souls, setSouls] = useState<SoulInfo[]>([]);
  const [soulLoading, setSoulLoading] = useState(false);
  const [soulError, setSoulError] = useState<string | null>(null);
  const [savingSoul, setSavingSoul] = useState(false);
  const [soulName, setSoulName] = useState('');
  const [showSaveSoul, setShowSaveSoul] = useState(false);

  useEffect(() => {
    setSoulLoading(true);
    api.listSouls()
      .then(setSouls)
      .catch((err) => setSoulError(err instanceof Error ? err.message : String(err)))
      .finally(() => setSoulLoading(false));
  }, []);

  const handleSoulPick = async (name: string) => {
    if (!name) return;
    try {
      const detail = await api.getSoul(name);
      setSystemPrompt(detail.content);
    } catch (err) {
      setSoulError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSaveAsSoul = async () => {
    if (!soulName.trim() || !systemPrompt.trim()) return;
    setSavingSoul(true);
    setSoulError(null);
    try {
      const created = await api.createSoul(soulName.trim(), systemPrompt, false);
      setSouls((prev) => [...prev.filter((s) => s.name !== created.name), created].sort((a, b) => a.name.localeCompare(b.name)));
      setShowSaveSoul(false);
      setSoulName('');
    } catch (err) {
      setSoulError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingSoul(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto animate-step-in">
      <StepHeading
        title="Ajanin kisiligi ve davranisi"
        desc="System prompt ajanin nasil konusacacağını belirler. Hazir bir SOUL dosyası seç ya da kendin yaz."
      />

      <div className="rounded border border-brand-border bg-brand-bg/30 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider text-brand-mutedSoft inline-flex items-center gap-1.5">
            <Icon name="auto_stories" size={13} className="text-brand-accent" />
            Hazir SOUL dosyasi
          </span>
          <button
            type="button"
            onClick={() => setShowSaveSoul((v) => !v)}
            disabled={!systemPrompt.trim()}
            className="text-[11px] text-brand-accent hover:underline disabled:opacity-30"
          >
            <Icon name="save" size={12} className="inline mr-0.5" />
            Bunu yeni SOUL olarak kaydet
          </button>
        </div>
        <CustomSelect
          value=""
          onChange={handleSoulPick}
          disabled={soulLoading}
          placeholder={soulLoading ? 'Yükleniyor...' : '— Seç ve system_prompt\'a yapıştır —'}
          options={souls.map((s) => ({
            value: s.name,
            label: `${s.name}${s.is_system ? ' (sistem)' : ''} — ${s.preview.substring(0, 60)}...`
          }))}
        />

        {showSaveSoul && (
          <div className="mt-2 flex items-center gap-1.5">
            <input
              type="text"
              value={soulName}
              onChange={(e) => setSoulName(e.target.value)}
              placeholder="yeni-soul-adi (a-z, 0-9, _, -)"
              className={inputCls + ' flex-1'}
            />
            <button
              type="button"
              onClick={handleSaveAsSoul}
              disabled={savingSoul || !soulName.trim()}
              className="px-3 py-2 text-xs rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40"
            >
              {savingSoul ? '...' : 'Kaydet'}
            </button>
          </div>
        )}
        {soulError && (
          <div className="mt-2 text-[11px] text-brand-danger">{soulError}</div>
        )}
      </div>

      <Field label="System Prompt (SOUL)">
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={10}
          placeholder={`Ajanin kisiligi, kurallari, cikti bicimi...

Ornek:
- Sen deneyimli bir X uzmanisin.
- Cevaplarin kisa ve net olmali.
- Turkce konusursun.`}
          className={inputCls + ' font-mono text-xs leading-relaxed resize-y min-h-[180px]'}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={`Temperature: ${temperature.toFixed(2)}`}>
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="brand-slider my-2.5"
          />
          <div className="flex justify-between text-[10px] text-brand-mutedSoft mt-0.5">
            <span>0 (tutarli)</span>
            <span>1 (dengeli)</span>
            <span>2 (yaratici)</span>
          </div>
        </Field>
        <Field label="Max Tokens (cevap uzunlugu)">
          <input
            type="number"
            min={16}
            max={32000}
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value || '0', 10))}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Etiketler" hint="Virgulle ayir — kartta etiket olarak gorunur">
        <input
          type="text"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="orn. kod, asistan, turkce"
          className={inputCls}
        />
      </Field>

      <label className="flex items-center justify-between gap-3 text-sm text-brand-text cursor-pointer p-3 border border-brand-border bg-brand-bg/30 rounded hover:border-brand-borderStrong transition">
        <span className="flex flex-col">
          <span className="font-semibold text-brand-text">Ajan Durumu</span>
          <span className="text-xs text-brand-mutedSoft">Aktif (ajan listede görünür ve kullanılabilir olur)</span>
        </span>
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="sr-only"
            id="toggle-active"
          />
          <div
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${
              isActive ? 'bg-brand-accent' : 'bg-brand-borderStrong'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-brand-bg shadow-md transform transition-transform duration-300 ${
                isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </div>
      </label>
    </div>
  );
}
