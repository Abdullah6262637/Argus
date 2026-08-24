import { useState, useEffect } from 'react';
import { Icon } from '../Icon';
import { StepHeading, Field, CustomSelect, SearchableCustomSelect, inputCls, Checkbox } from './FormComponents';
import { getModelLogo } from '../../utils/modelHelper';
import type { ModelInfoOut, ProviderName, ConnectionTestResponse } from '@/types';

export interface ProxyPreset {
  id: string;
  label: string;
  provider: ProviderName;
  base_url: string;
  model: string;
  placeholder_api_key?: string;
  description?: string;
}

export const PROXY_PRESETS: ProxyPreset[] = [
  {
    id: 'googleaistudio',
    label: 'Google AI Studio',
    provider: 'googleaistudio',
    base_url: '',
    model: 'gemini-2.5-flash',
    placeholder_api_key: 'AIzaSy...',
    description: 'Google AI Studio API anahtarı ile doğrudan Gemini kullanımı.'
  },
  {
    id: 'openai-official',
    label: 'OpenAI (Official)',
    provider: 'openai',
    base_url: '',
    model: 'gpt-4o-mini',
    placeholder_api_key: 'sk-proj-...',
    description: 'Resmi OpenAI API baglantisi.'
  },
  {
    id: 'anthropic-official',
    label: 'Anthropic (Official)',
    provider: 'anthropic',
    base_url: '',
    model: 'claude-3-5-sonnet-latest',
    placeholder_api_key: 'sk-ant-api03-...',
    description: 'Resmi Anthropic Claude API baglantisi.'
  },
  {
    id: 'openrouter',
    label: 'OpenRouter Proxy',
    provider: 'openrouter',
    base_url: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.5-flash',
    placeholder_api_key: 'sk-or-v1-...',
    description: 'Düşük maliyetli alternatif sağlayıcı.'
  },
  {
    id: 'groq',
    label: 'Groq Cloud (Llama/Mixtral)',
    provider: 'groq',
    base_url: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    placeholder_api_key: 'gsk_...',
    description: 'Ultra hızlı Llama model çıkarımları.'
  },
  {
    id: 'sambanova',
    label: 'SambaNova Cloud (1000+ t/s)',
    provider: 'sambanova',
    base_url: 'https://api.sambanova.ai/v1',
    model: 'Meta-Llama-3.3-70B-Instruct',
    placeholder_api_key: 'sn_...',
    description: 'Rekor hızında SambaNova LPU çıkarım motoru.'
  },
  {
    id: 'cerebras',
    label: 'Cerebras Systems (2000+ t/s)',
    provider: 'cerebras',
    base_url: 'https://api.cerebras.ai/v1',
    model: 'llama3.3-70b',
    placeholder_api_key: 'csk-...',
    description: 'Wafer-Scale Engine ile dünyanın en hızlı Llama çıkarımı.'
  },
  {
    id: 'fireworks',
    label: 'Fireworks AI (Speculative)',
    provider: 'fireworks',
    base_url: 'https://api.fireworks.ai/inference/v1',
    model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    placeholder_api_key: 'fw_...',
    description: 'Gelişmiş speculative decoding çıkarım servisi.'
  },
  {
    id: 'together',
    label: 'Together AI (Serverless)',
    provider: 'together',
    base_url: 'https://api.together.xyz/v1',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    placeholder_api_key: '••••',
    description: 'Geniş açık kaynak model kütüphanesi.'
  },
  {
    id: 'lmstudio',
    label: 'LM Studio (Yerel)',
    provider: 'local',
    base_url: 'http://localhost:1234/v1',
    model: 'meta-llama-3-8b-instruct',
    description: 'Yerel bilgisayarınızda çalışan LM Studio sunucusu.'
  },
  {
    id: 'ollama',
    label: 'Ollama (Yerel)',
    provider: 'local',
    base_url: 'http://localhost:11434/v1',
    model: 'qwen2.5:7b-instruct',
    description: 'Ollama yerel model kütüphanesi.'
  }
];

export function Step2LLM({
  provider,
  setProvider,
  model,
  setModel,
  baseUrl,
  setBaseUrl,
  apiKey,
  setApiKey,
  showApiKey,
  setShowApiKey,
  clearApiKey,
  setClearApiKey,
  presetId,
  applyPreset,
  modelSuggestions,
  envStatus,
  testing,
  testResult,
  onTest,
  isEditing,
  initial,
  verifySsl,
  setVerifySsl
}: {
  provider: ProviderName;
  setProvider: (v: ProviderName) => void;
  model: string;
  setModel: (v: string) => void;
  baseUrl: string;
  setBaseUrl: (v: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  showApiKey: boolean;
  setShowApiKey: (v: boolean) => void;
  clearApiKey: boolean;
  setClearApiKey: (v: boolean) => void;
  presetId: string;
  applyPreset: (id: string) => void;
  modelSuggestions: ModelInfoOut[];
  envStatus: any;
  testing: boolean;
  testResult: ConnectionTestResponse | null;
  onTest: (useEnv: boolean) => void;
  isEditing: boolean;
  initial?: any;
  verifySsl: boolean;
  setVerifySsl: (v: boolean) => void;
}) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!testing) {
      setActiveStep(0);
      return;
    }
    const t1 = setTimeout(() => setActiveStep(1), 350);
    const t2 = setTimeout(() => setActiveStep(2), 750);
    const t3 = setTimeout(() => setActiveStep(3), 1300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [testing]);

  const envKey = 
    provider === 'openai' ? 'OPENAI_API_KEY' : 
    provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 
    provider === 'gemini' ? 'GEMINI_API_KEY' : 
    provider === 'googleaistudio' ? 'GEMINI_API_KEY' : 
    provider === 'openrouter' ? 'OPENROUTER_API_KEY' : 
    provider === 'groq' ? 'GROQ_API_KEY' : 
    provider === 'deepseek' ? 'DEEPSEEK_API_KEY' : 
    provider === 'mistral' ? 'MISTRAL_API_KEY' : 
    provider === 'xai' ? 'XAI_API_KEY' :
    provider === 'sambanova' ? 'SAMBANOVA_API_KEY' :
    provider === 'cerebras' ? 'CEREBRAS_API_KEY' :
    provider === 'fireworks' ? 'FIREWORKS_API_KEY' :
    provider === 'together' ? 'TOGETHER_API_KEY' : null;
  const envHasKey = envKey ? !!envStatus?.has?.[envKey] : false;
  const envMaskedKey = envKey ? envStatus?.masked?.[envKey] : null;
  const isLocal = provider === 'local';

  const baseHint = isLocal
    ? 'Ollama için: http://localhost:11434/v1, LM Studio için: http://localhost:1234/v1'
    : 'Özel proxy adresi kullanıyorsanız girin. Boş bırakırsanız varsayılan kullanılır.';

  return (
    <div className="space-y-4 max-w-xl mx-auto animate-step-in">
      <StepHeading
        title="Modelin nereden gelecek?"
        desc="LLM saglayicisini, kullanacagin modeli ve (varsa) ozel endpoint ile API anahtarini gir."
      />

      <Field label="Proxy / Preset (opsiyonel)">
        <CustomSelect
          value={presetId}
          onChange={applyPreset}
          placeholder="— Manuel yapılandırma —"
          options={PROXY_PRESETS.map((p) => {
            const providerImg = 
              p.id === 'openai-official' ? 'openai-official' :
              p.id === 'googleaistudio' ? 'googleaistudio' :
              p.id === 'frostai' ? 'frostai' :
              p.id === 'openrouter' ? 'openrouter' :
              p.id === 'groq' ? 'groq' :
              p.id === 'sambanova' ? 'sambanova' :
              p.id === 'cerebras' ? 'cerebras' :
              p.id === 'fireworks' ? 'fireworks' :
              p.id === 'together' ? 'together' :
              p.id === 'lmstudio' ? 'lmstudio' :
              p.id === 'ollama' ? 'local' :
              p.id === 'anthropic-official' ? 'anthropic' : 'openai-official';
            return {
              value: p.id,
              label: (
                <span className="flex items-center gap-2">
                  <img src={`/providers/${providerImg}.png?v=3`} alt={p.label} className="w-4 h-4 object-contain rounded-sm" />
                  <span>{p.label}{p.base_url ? ` — ${p.base_url}` : ''}</span>
                </span>
              )
            };
          })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Sağlayıcı *">
          <CustomSelect
            value={provider}
            onChange={(v) => setProvider(v as ProviderName)}
            options={[
              {
                value: 'openai',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/openai-official.png?v=3" alt="OpenAI" className="w-4 h-4 object-contain rounded-sm" />
                    <span>OpenAI (ve uyumlu)</span>
                  </span>
                )
              },
              {
                value: 'anthropic',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/anthropic.png?v=3" alt="Anthropic" className="w-4 h-4 object-contain rounded-sm" />
                    <span>Anthropic (Claude)</span>
                  </span>
                )
              },
              {
                value: 'gemini',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/gemini.png?v=3" alt="Gemini" className="w-4 h-4 object-contain rounded-sm" />
                    <span>Google Gemini (Vertex/GCP)</span>
                  </span>
                )
              },
              {
                value: 'googleaistudio',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/googleaistudio.png?v=3" alt="Google AI Studio" className="w-4 h-4 object-contain rounded-sm" />
                    <span>Google AI Studio</span>
                  </span>
                )
              },
              {
                value: 'openrouter',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/openrouter.png?v=3" alt="OpenRouter" className="w-4 h-4 object-contain rounded-sm" />
                    <span>OpenRouter</span>
                  </span>
                )
              },
              {
                value: 'groq',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/groq.png?v=3" alt="Groq" className="w-4 h-4 object-contain rounded-sm" />
                    <span>Groq Cloud</span>
                  </span>
                )
              },
              {
                value: 'sambanova',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/sambanova.png?v=3" alt="SambaNova" className="w-4 h-4 object-contain rounded-sm" />
                    <span>SambaNova Cloud (1000+ t/s)</span>
                  </span>
                )
              },
              {
                value: 'cerebras',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/cerebras.png?v=3" alt="Cerebras" className="w-4 h-4 object-contain rounded-sm" />
                    <span>Cerebras Systems (2000+ t/s)</span>
                  </span>
                )
              },
              {
                value: 'fireworks',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/fireworks.png?v=3" alt="Fireworks AI" className="w-4 h-4 object-contain rounded-sm" />
                    <span>Fireworks AI</span>
                  </span>
                )
              },
              {
                value: 'together',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/together.png?v=3" alt="Together AI" className="w-4 h-4 object-contain rounded-sm" />
                    <span>Together AI</span>
                  </span>
                )
              },
              {
                value: 'deepseek',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/deepseek.png?v=3" alt="DeepSeek" className="w-4 h-4 object-contain rounded-sm" />
                    <span>DeepSeek</span>
                  </span>
                )
              },
              {
                value: 'mistral',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/mistral.png?v=3" alt="Mistral AI" className="w-4 h-4 object-contain rounded-sm" />
                    <span>Mistral AI</span>
                  </span>
                )
              },
              {
                value: 'xai',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/xai.png?v=3" alt="xAI" className="w-4 h-4 object-contain rounded-sm" />
                    <span>xAI (Grok)</span>
                  </span>
                )
              },
              {
                value: 'local',
                label: (
                  <span className="flex items-center gap-2">
                    <img src="/providers/local.png?v=3" alt="Yerel" className="w-4 h-4 object-contain rounded-sm" />
                    <span>Yerel (Ollama, LM Studio vb.)</span>
                  </span>
                )
              }
            ]}
          />
        </Field>
        <Field label="Model *">
          <SearchableCustomSelect
            value={model}
            onChange={(v) => setModel(v)}
            onCustomAdd={(v) => setModel(v)}
            options={modelSuggestions.map((m) => ({
              value: m.id,
              searchString: `${m.id} ${m.label}`,
              label: (
                <span className="flex items-center gap-2">
                  <img src={getModelLogo(m.id, provider)} alt="" className="w-4 h-4 object-contain rounded-sm" />
                  <span className="font-mono text-xs">{m.label || m.id}</span>
                </span>
              )
            }))}
            placeholder="— Model seçin veya aratın —"
          />
        </Field>
      </div>

      {!isLocal && (
        <>
          {envKey && (
            envHasKey ? (
              <div className="rounded-xl bg-brand-success/10 p-2.5 text-[11px] text-brand-success flex items-start gap-2">
                <Icon name="check_circle" size={14} filled className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong>.env'de {envKey} hazır</strong> ({envMaskedKey ?? '••••'}). Bu ajan otomatik
                  kullanacak; istersen aşağıya farklı bir anahtar yapıştırıp override edebilirsin.
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-brand-warning/10 p-2.5 text-[11px] text-brand-warning flex items-start gap-2">
                <Icon name="warning" size={14} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong>.env'de {envKey} yok</strong>. Aşağıya buraya özel bir anahtar yapıştır
                  veya{' '}
                  <span className="font-semibold">Ayarlar &rarr; API Anahtarları</span> sekmesinden ekle.
                </div>
              </div>
            )
          )}

          <Field label="Base URL" hint={baseHint}>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="Boş bırak veya https://..."
              className={inputCls}
            />
          </Field>

          <Field
            label={`API Anahtarı${isEditing ? ' (boş bırakırsan değişmez)' : ' (boş = .env\'deki kullanılır)'}`}
            hint={
              isEditing && initial?.api_key_masked
                ? `Mevcut: ${initial.api_key_masked}`
                : undefined
            }
          >
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={isEditing ? '(değişmesin)' : envHasKey ? '(.env\'deki kullanılacak)' : 'sk-...'}
                className={`${inputCls.replace('px-3.5', 'pl-3.5')} pr-16`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-brand-muted hover:text-brand-text px-2 py-0.5 bg-brand-panelAlt/80 rounded-md"
              >
                {showApiKey ? 'Gizle' : 'Göster'}
              </button>
            </div>
            {isEditing && initial?.has_api_key && (
              <div className="mt-2">
                <Checkbox
                  id="clear-api-key"
                  checked={clearApiKey}
                  onChange={setClearApiKey}
                  label={<span className="text-xs text-brand-danger font-medium">Kayıtlı API Anahtarını Sil (Varsayılana Dön)</span>}
                />
              </div>
            )}
          </Field>

          <div className="rounded-xl bg-brand-panelAlt/40 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-brand-text">Bağlantıyı Test Et</div>
                <div className="text-[11px] text-brand-muted mt-0.5">
                  Provider'a küçük bir istek atıp doğrula.
                </div>
                <div className="mt-2">
                  <Checkbox
                    checked={verifySsl}
                    onChange={setVerifySsl}
                    label={<span className="text-[11px] text-brand-mutedSoft font-medium">SSL Sertifikasını Doğrula</span>}
                  />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onTest(false)}
                  disabled={testing || !model.trim()}
                  className="text-xs px-3 py-1.5 rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition whitespace-nowrap"
                >
                  {testing ? 'Test Ediliyor' : 'Bu key ile'}
                </button>
                {envHasKey && !apiKey.trim() && (
                  <button
                    type="button"
                    onClick={() => onTest(true)}
                    disabled={testing || !model.trim()}
                    className="text-xs px-3 py-1.5 rounded bg-brand-panelAlt text-brand-textSoft hover:text-brand-text disabled:opacity-40 transition whitespace-nowrap"
                    title=".env'deki anahtarla test eder"
                  >
                    .env ile
                  </button>
                )}
              </div>
            </div>

            {/* Minimal Connection Steps Tracer */}
            {testing && (
              <div className="pt-3 space-y-3 animate-step-in">
                <div className="text-[11px] uppercase tracking-wider text-brand-mutedSoft font-bold flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                  Bağlantı Sınaması Yapılıyor...
                </div>
                
                <div className="space-y-2.5 pl-3.5">
                  <TracerStep index={0} activeStep={activeStep} text="API Parametreleri ve biçim doğrulaması" />
                  <TracerStep index={1} activeStep={activeStep} text="Güvenli HTTP/HTTPS istemcisi oluşturulması" />
                  <TracerStep index={2} activeStep={activeStep} text="Sunucuya sınama paketi gönderilmesi (max_tokens: 32)" />
                  <TracerStep index={3} activeStep={activeStep} text="Uzak sunucu yanıtının çözümlenmesi" />
                </div>
              </div>
            )}

            {testResult && !testing && (
              <div
                className={`rounded-xl text-[11px] p-2.5 space-y-1 ${
                  testResult.ok
                    ? 'text-brand-success bg-brand-success/10'
                    : 'text-brand-danger bg-brand-danger/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold inline-flex items-center gap-1.5">
                    <Icon
                      name={testResult.ok ? 'check_circle' : 'cancel'}
                      size={14}
                      weight={500}
                      filled
                    />
                    {testResult.ok ? 'Başarılı' : 'Başarısız'}
                  </span>
                  <span className="opacity-70 font-mono">{testResult.latency_ms} ms</span>
                </div>
                <div className="opacity-90 break-words whitespace-pre-wrap">{testResult.message}</div>
                {testResult.sample_response && (
                  <div className="text-brand-muted pt-1 mt-1">
                    <span className="uppercase text-[10px] tracking-wider">Örneklem:</span>{' '}
                    <span className="font-mono text-[10px]">{testResult.sample_response}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {isLocal && (
        <Field label="Yerel Endpoint URL" hint={baseHint}>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:11434/v1"
            className={inputCls}
          />
        </Field>
      )}
    </div>
  );
}

function TracerStep({ index, activeStep, text }: { index: number; activeStep: number; text: string }) {
  const isCompleted = activeStep > index;
  const isActive = activeStep === index;
  const isPending = activeStep < index;

  return (
    <div className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${
      isActive ? 'text-brand-text font-semibold' : isCompleted ? 'text-brand-success/90' : 'text-brand-mutedSoft'
    }`}>
      {isCompleted && (
        <Icon name="check" size={14} className="text-brand-success animate-scale-in" />
      )}
      {isActive && (
        <Icon name="progress_activity" size={14} className="animate-spin text-brand-accent" />
      )}
      {isPending && (
        <span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold text-brand-mutedSoft">
          {index + 1}
        </span>
      )}
      <span>{text}</span>
    </div>
  );
}
