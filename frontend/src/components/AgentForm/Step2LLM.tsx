import { Icon } from '../Icon';
import { StepHeading, Field, CustomSelect, SearchableCustomSelect, inputCls } from './FormComponents';
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
    model: 'llama3-70b-8192',
    placeholder_api_key: 'gsk_...',
    description: 'Ultra hızlı Llama model çıkarımları.'
  },
  {
    id: 'together',
    label: 'Together AI (Serverless)',
    provider: 'openai',
    base_url: 'https://api.together.xyz/v1',
    model: 'meta-llama/Llama-3-70b-chat-hf',
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
    provider === 'openrouter' ? 'OPENROUTER_API_KEY' : 
    provider === 'groq' ? 'GROQ_API_KEY' : 
    provider === 'deepseek' ? 'DEEPSEEK_API_KEY' : 
    provider === 'mistral' ? 'MISTRAL_API_KEY' : 
    provider === 'xai' ? 'XAI_API_KEY' : null;
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
              p.id === 'frostai' ? 'frostai' :
              p.id === 'openrouter' ? 'openrouter' :
              p.id === 'groq' ? 'groq' :
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
                    <span>Google Gemini</span>
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
              <div className="rounded border border-brand-success/40 bg-brand-success/5 p-2.5 text-[11px] text-brand-success flex items-start gap-2">
                <Icon name="check_circle" size={14} filled className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong>.env'de {envKey} hazir</strong> ({envMaskedKey ?? '••••'}). Bu ajan otomatik
                  kullanacak; istersen asagiya farkli bir anahtar yapistirip override edebilirsin.
                </div>
              </div>
            ) : (
              <div className="rounded border border-brand-warning/40 bg-brand-warning/5 p-2.5 text-[11px] text-brand-warning flex items-start gap-2">
                <Icon name="warning" size={14} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong>.env'de {envKey} yok</strong>. Asagiya buraya ozel bir anahtar yapistir
                  veya{' '}
                  <span className="font-semibold">Ayarlar &rarr; API Anahtarlari</span> sekmesinden ekle.
                </div>
              </div>
            )
          )}

          <Field label="Base URL" hint={baseHint}>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="Bos birak veya https://..."
              className={inputCls}
            />
          </Field>

          <Field
            label={`API Anahtari${isEditing ? ' (bos birakirsan degismez)' : ' (bos = .env\'deki kullanilir)'}`}
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
                placeholder={isEditing ? '(degismesin)' : envHasKey ? '(.env\'deki kullanilacak)' : 'sk-...'}
                className={inputCls + ' pr-16'}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-brand-muted hover:text-brand-text px-2 py-0.5 border border-brand-border rounded"
              >
                {showApiKey ? 'Gizle' : 'Goster'}
              </button>
            </div>
            {isEditing && initial?.has_api_key && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="clear-api-key"
                  checked={clearApiKey}
                  onChange={(e) => setClearApiKey(e.target.checked)}
                  className="rounded bg-brand-bg/50 border-brand-border text-brand-accent focus:ring-brand-accent/50"
                />
                <label htmlFor="clear-api-key" className="text-xs text-brand-danger font-medium cursor-pointer">
                  Kayitli API Anahtarini Sil (Varsayilana Don)
                </label>
              </div>
            )}
          </Field>

          <div className="rounded border border-brand-border bg-brand-bg/50 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-brand-text">Baglantiyi Test Et</div>
                <div className="text-[11px] text-brand-muted mt-0.5">
                  Provider'a kucuk bir istek atip dogrula.
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer mt-1.5 select-none">
                  <input
                    type="checkbox"
                    checked={verifySsl}
                    onChange={(e) => setVerifySsl(e.target.checked)}
                    className="rounded bg-brand-bg/50 border-brand-border text-brand-accent focus:ring-brand-accent/50 w-3.5 h-3.5"
                  />
                  <span className="text-[10px] text-brand-mutedSoft font-medium">SSL Sertifikasını Doğrula</span>
                </label>
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
                    className="text-xs px-3 py-1.5 rounded border border-brand-border text-brand-textSoft hover:text-brand-text disabled:opacity-40 transition whitespace-nowrap"
                    title=".env'deki anahtarla test eder"
                  >
                    .env ile
                  </button>
                )}
              </div>
            </div>

            {/* Premium Connection Steps Tracer */}
            {testing && (
              <div className="p-3 bg-brand-panelAlt/30 border border-brand-border rounded-xl space-y-2.5 animate-step-in">
                <div className="text-[10px] uppercase tracking-wider text-brand-accent font-bold mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-ping" />
                  Bağlantı Sınaması Yapılıyor...
                </div>
                
                <div className="space-y-2">
                  <TracerStep index={0} activeStep={activeStep} text="API Parametreleri ve biçim doğrulaması" />
                  <TracerStep index={1} activeStep={activeStep} text="Güvenli HTTP/HTTPS istemcisi oluşturulması" />
                  <TracerStep index={2} activeStep={activeStep} text="Sunucuya sınama paketi gönderilmesi (max_tokens: 32)" />
                  <TracerStep index={3} activeStep={activeStep} text="Uzak sunucu yanıtının çözümlenmesi" />
                </div>
              </div>
            )}

            {testResult && !testing && (
              <div
                className={`rounded border text-[11px] p-2.5 space-y-1 ${
                  testResult.ok
                    ? 'text-brand-success bg-brand-success/5 border-brand-success/30'
                    : 'text-brand-danger bg-brand-danger/5 border-brand-danger/30'
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
                  <div className="text-brand-muted border-t border-current/20 pt-1 mt-1">
                    <span className="uppercase text-[10px] tracking-wider">Orneklem:</span>{' '}
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
        <Icon name="check_circle" size={14} filled className="text-brand-success animate-scale-in" />
      )}
      {isActive && (
        <Icon name="progress_activity" size={14} className="animate-spin text-brand-accent" />
      )}
      {isPending && (
        <div className="w-3.5 h-3.5 rounded-full border border-brand-border flex items-center justify-center text-[9px] font-bold text-brand-mutedSoft">
          {index + 1}
        </div>
      )}
      <span>{text}</span>
    </div>
  );
}
