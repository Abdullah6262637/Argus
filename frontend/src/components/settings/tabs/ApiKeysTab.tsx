import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/client';
import type { ConnectionTestResponse, ProviderName } from '@/types';
import { Icon } from '../../Icon';
import { CustomSelect } from '../../CustomSelect';
import { PanelHeader } from '../shared/PanelHeader';
import { FormField } from '../shared/FormField';
import { KeyRow } from '../shared/KeyRow';

export function ApiKeysTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [deepseekKey, setDeepseekKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [mistralKey, setMistralKey] = useState('');

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

  const mountedRef = useRef(true);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    const load = async () => {
      try {
        const data = await api.getEnv();
        if (!mountedRef.current) return;

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
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const payload: Record<string, string> = {};
      if (openaiKey.trim()) payload.OPENAI_API_KEY = openaiKey.trim();
      if (anthropicKey.trim()) payload.ANTHROPIC_API_KEY = anthropicKey.trim();
      if (geminiKey.trim()) payload.GEMINI_API_KEY = geminiKey.trim();
      if (groqKey.trim()) payload.GROQ_API_KEY = groqKey.trim();
      if (deepseekKey.trim()) payload.DEEPSEEK_API_KEY = deepseekKey.trim();
      if (openrouterKey.trim()) payload.OPENROUTER_API_KEY = openrouterKey.trim();
      if (mistralKey.trim()) payload.MISTRAL_API_KEY = mistralKey.trim();

      if (openaiBase !== originalBases.openai) {
        payload.OPENAI_BASE_URL = openaiBase.trim();
      }
      if (anthropicBase !== originalBases.anthropic) {
        payload.ANTHROPIC_BASE_URL = anthropicBase.trim();
      }

      const res = await api.updateEnv(payload);

      if (mountedRef.current) {
        const safeHas = (res && typeof res.has === 'object' && res.has) || {};
        const safeMasked =
          (res && typeof res.masked === 'object' && res.masked) || {};

        setHas(safeHas);
        setMasked(safeMasked);
        setOpenaiKey('');
        setAnthropicKey('');
        setGeminiKey('');
        setGroqKey('');
        setDeepseekKey('');
        setOpenrouterKey('');
        setMistralKey('');
        setOriginalBases({ openai: openaiBase, anthropic: anthropicBase });
        setSaved(true);

        savedTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) setSaved(false);
        }, 3000);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  };

  const clearKey = async (keyName: string) => {
    setError(null);
    try {
      const res = await api.updateEnv({ [keyName]: '' });
      if (mountedRef.current) {
        const safeHas = (res && typeof res.has === 'object' && res.has) || {};
        const safeMasked =
          (res && typeof res.masked === 'object' && res.masked) || {};
        setHas(safeHas);
        setMasked(safeMasked);
      }
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
      const res = await api.testAgentConnection({ provider: testProvider, model: testModel });
      if (mountedRef.current) setTestResult(res);
    } catch (err) {
      if (mountedRef.current) {
        setTestResult({
          ok: false,
          provider: testProvider,
          model: testModel,
          latency_ms: 0,
          message: err instanceof Error ? err.message : String(err),
        });
      }
    } finally {
      if (mountedRef.current) setTesting(false);
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
    <div className="space-y-6">
      <PanelHeader
        title="API Anahtarları"
        description="Servis sağlayıcılarınızın API anahtarlarını ekleyerek ajanlarını aktif hale getirebilirsiniz."
        icon="vpn_key"
      />

      {/* Provider List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <KeyRow
          providerId="openai"
          label="OpenAI"
          logoUrl="/providers/openai-official.png?v=3"
          placeholder="sk-..."
          value={openaiKey}
          onChange={setOpenaiKey}
          hasExisting={!!has.OPENAI_API_KEY}
          maskedExisting={masked.OPENAI_API_KEY}
          onClear={() => clearKey('OPENAI_API_KEY')}
          baseLabel="Base URL"
          basePlaceholder="https://api.openai.com/v1"
          baseValue={openaiBase}
          onBaseChange={setOpenaiBase}
        />
        <KeyRow
          providerId="anthropic"
          label="Anthropic Claude"
          logoUrl="/providers/anthropic.png?v=3"
          placeholder="sk-ant-..."
          value={anthropicKey}
          onChange={setAnthropicKey}
          hasExisting={!!has.ANTHROPIC_API_KEY}
          maskedExisting={masked.ANTHROPIC_API_KEY}
          onClear={() => clearKey('ANTHROPIC_API_KEY')}
          baseLabel="Base URL"
          basePlaceholder="https://api.anthropic.com"
          baseValue={anthropicBase}
          onBaseChange={setAnthropicBase}
        />
        <KeyRow
          providerId="gemini"
          label="Google Gemini"
          logoUrl="/providers/gemini.png?v=3"
          placeholder="AIzaSy..."
          value={geminiKey}
          onChange={setGeminiKey}
          hasExisting={!!has.GEMINI_API_KEY}
          maskedExisting={masked.GEMINI_API_KEY}
          onClear={() => clearKey('GEMINI_API_KEY')}
        />
        <KeyRow
          providerId="groq"
          label="Groq Cloud"
          logoUrl="/providers/groq.png?v=3"
          placeholder="gsk_..."
          value={groqKey}
          onChange={setGroqKey}
          hasExisting={!!has.GROQ_API_KEY}
          maskedExisting={masked.GROQ_API_KEY}
          onClear={() => clearKey('GROQ_API_KEY')}
        />
        <KeyRow
          providerId="deepseek"
          label="DeepSeek AI"
          logoUrl="/providers/deepseek.png?v=3"
          placeholder="sk-..."
          value={deepseekKey}
          onChange={setDeepseekKey}
          hasExisting={!!has.DEEPSEEK_API_KEY}
          maskedExisting={masked.DEEPSEEK_API_KEY}
          onClear={() => clearKey('DEEPSEEK_API_KEY')}
        />
        <KeyRow
          providerId="openrouter"
          label="OpenRouter"
          logoUrl="/providers/openrouter.png?v=3"
          placeholder="sk-or-..."
          value={openrouterKey}
          onChange={setOpenrouterKey}
          hasExisting={!!has.OPENROUTER_API_KEY}
          maskedExisting={masked.OPENROUTER_API_KEY}
          onClear={() => clearKey('OPENROUTER_API_KEY')}
        />
        <KeyRow
          providerId="mistral"
          label="Mistral AI"
          logoUrl="/providers/mistral.png?v=3"
          placeholder="api_..."
          value={mistralKey}
          onChange={setMistralKey}
          hasExisting={!!has.MISTRAL_API_KEY}
          maskedExisting={masked.MISTRAL_API_KEY}
          onClear={() => clearKey('MISTRAL_API_KEY')}
        />
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-brand-border/30">
        <div className="flex items-center gap-2">
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

      {/* Bağlantı Testi Kartı */}
      <div className="p-4 rounded-2xl bg-brand-panelAlt/30 space-y-3 mt-4">
        <div className="flex items-center gap-2">
          <Icon name="speed" size={17} className="text-brand-accent" />
          <h4 className="text-xs font-semibold text-brand-text">Bağlantıyı Hızlı Test Et</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField label="Sağlayıcı" icon="hub">
            <CustomSelect
              value={testProvider}
              onChange={(val) => setTestProvider(val as ProviderName)}
              options={[
                { value: 'openai', label: 'OpenAI' },
                { value: 'anthropic', label: 'Anthropic' },
                { value: 'gemini', label: 'Google Gemini' },
                { value: 'groq', label: 'Groq' },
                { value: 'deepseek', label: 'DeepSeek' },
                { value: 'openrouter', label: 'OpenRouter' },
                { value: 'mistral', label: 'Mistral AI' },
                { value: 'local', label: 'Yerel (Ollama / LM Studio)' },
              ]}
            />
          </FormField>
          <FormField label="Model İsmi" icon="model_training">
            <input
              type="text"
              value={testModel}
              onChange={(e) => setTestModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className="w-full bg-brand-bg/80 border border-brand-border/40 rounded-xl px-3 py-2 text-xs font-mono text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent transition-all"
            />
          </FormField>
        </div>

        <button
          onClick={runTest}
          disabled={testing || !testModel.trim()}
          className="w-full h-9 inline-flex items-center justify-center gap-2 text-xs font-semibold rounded-xl bg-brand-panelAlt hover:bg-brand-panelAlt/80 text-brand-text disabled:opacity-40 transition-all active:scale-95 shadow-sm"
        >
          <Icon
            name={testing ? 'progress_activity' : 'play_arrow'}
            size={15}
            className={testing ? 'animate-spin-slow' : ''}
          />
          {testing ? 'Bağlantı Test Ediliyor...' : 'Bağlantıyı Test Et'}
        </button>

        {testResult && (
          <div
            className={`rounded-xl p-3.5 space-y-1.5 animate-fade-in ${
              testResult.ok
                ? 'text-brand-success bg-brand-success/10 border border-brand-success/20'
                : 'text-brand-danger bg-brand-danger/10 border border-brand-danger/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold inline-flex items-center gap-1.5">
                <Icon
                  name={testResult.ok ? 'check_circle' : 'cancel'}
                  size={16}
                  filled
                />
                {testResult.ok ? 'Bağlantı Başarılı' : 'Bağlantı Başarısız'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10.5px] opacity-80 font-mono">
                <Icon name="schedule" size={12} />
                {testResult.latency_ms} ms
              </span>
            </div>
            <div className="text-[11px] opacity-90 break-words leading-relaxed">
              {testResult.message}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
