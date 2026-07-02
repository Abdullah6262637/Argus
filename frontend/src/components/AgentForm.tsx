import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';
import type {
  AgentCreate,
  AgentDetail,
  ConnectionTestResponse,
  MediaCapabilityInput,
  ModelInfoOut,
  ModelsCatalog,
  ProviderName,
  AgentPermissions,
  SoulInfo} from '@/types';

interface AgentFormProps {
  initial?: AgentDetail | null;
  onSubmit: (payload: AgentCreate) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  onOpenEnvSettings?: () => void;
}

// ============================================================
// Sabitler
// ============================================================

const FALLBACK_MODELS: Record<string, ModelInfoOut[]> = {
  openai: [
    { id: 'gpt-5', label: 'GPT-5' },
    { id: 'gpt-4.1', label: 'GPT-4.1' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { id: 'o3', label: 'o3' },
    { id: 'o3-mini', label: 'o3-mini' }],
  anthropic: [
    { id: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
    { id: 'claude-sonnet-4-7', label: 'Claude Sonnet 4.7' },
    { id: 'claude-opus-4-5', label: 'Claude Opus 4.5' },
    { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
    { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' }],
  local: [
    { id: 'llama3', label: 'Llama 3' },
    { id: 'llama3.1', label: 'Llama 3.1' },
    { id: 'qwen2.5-coder', label: 'Qwen 2.5 Coder' }]};

// Sprint A.11.1: Proxy preset'leri
interface ProxyPreset {
  id: string;
  label: string;
  provider: ProviderName;
  base_url: string;
  hint?: string;
}

const PROXY_PRESETS: ProxyPreset[] = [
  { id: 'openai-official', label: 'OpenAI (resmi)', provider: 'openai', base_url: '' },
  { id: 'frostai', label: 'frostai.xyz', provider: 'openai', base_url: 'https://frostai.xyz/v1' },
  { id: 'openrouter', label: 'OpenRouter', provider: 'openai', base_url: 'https://openrouter.ai/api/v1' },
  { id: 'groq', label: 'Groq', provider: 'openai', base_url: 'https://api.groq.com/openai/v1' },
  { id: 'together', label: 'Together.ai', provider: 'openai', base_url: 'https://api.together.xyz/v1' },
  { id: 'lmstudio', label: 'LM Studio (yerel)', provider: 'local', base_url: 'http://127.0.0.1:1234/v1', hint: 'LM Studio uygulamasini ac, server\'i baslat' },
  { id: 'ollama', label: 'Ollama (yerel)', provider: 'local', base_url: 'http://127.0.0.1:11434/v1', hint: 'ollama serve calisiyor olmali' },
  { id: 'anthropic-official', label: 'Anthropic (resmi)', provider: 'anthropic', base_url: '' }];

export interface AgentTemplate {
  id: string;
  label: string;
  name: string;
  role: string;
  description: string;
  system_prompt: string;
  provider: ProviderName;
  model: string;
  temperature: number;
  permissions: AgentPermissions;
  image?: Partial<MediaCapabilityInput>;
  video?: Partial<MediaCapabilityInput>;
  audio?: Partial<MediaCapabilityInput>;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'developer',
    label: '💻 Yazılım Geliştirici',
    name: 'Yazılım Geliştirici',
    role: 'Senior Software Engineer',
    description: 'Kod yazar, hata ayıklar ve terminal komutlarını çalıştırır.',
    system_prompt: 'Sen deneyimli bir yazılım geliştiricisin. Sana verilen kodlama görevlerini yerine getir, kod yaz ve terminal komutlarıyla test et.',
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.5,
    permissions: { file_system: true, terminal_cmd: true, web_search: true, system_admin: true },
    image: { enabled: false, provider: 'openai', model: 'dall-e-3' },
    video: { enabled: false, provider: 'openai', model: 'sora-1' },
    audio: { enabled: true, provider: 'openai', model: 'whisper-1' }
  },
  {
    id: 'researcher',
    label: '🔍 Araştırmacı Asistan',
    name: 'Araştırmacı Asistan',
    role: 'Research Specialist',
    description: 'Web araması yapar, dokümanları okur ve bilgi derler.',
    system_prompt: 'Sen uzman bir araştırmacısın. Web araması ve yerel doküman okuma araçlarını kullanarak derinlemesine araştırmalar yap ve özetler oluştur.',
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    permissions: { file_system: true, terminal_cmd: false, web_search: true, system_admin: false },
    image: { enabled: false, provider: 'openai', model: 'dall-e-3' },
    video: { enabled: false, provider: 'openai', model: 'sora-1' },
    audio: { enabled: false, provider: 'openai', model: 'whisper-1' }
  },
  {
    id: 'writer',
    label: '✍️ İçerik Yazarı',
    name: 'İçerik Yazarı',
    role: 'Content Creator & Editor',
    description: 'Makaleler, raporlar ve yaratıcı metinler hazırlar.',
    system_prompt: 'Sen profesyonel bir içerik editörü ve yazarısın. Çeşitli konularda makale, blog yazısı ve raporlar hazırlar, dilleri ve tonu mükemmel kullanırsın.',
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.8,
    permissions: { file_system: true, terminal_cmd: false, web_search: true, system_admin: false },
    image: { enabled: true, provider: 'openai', model: 'dall-e-3' },
    video: { enabled: false, provider: 'openai', model: 'sora-1' },
    audio: { enabled: false, provider: 'openai', model: 'whisper-1' }
  },
  {
    id: 'devops',
    label: '🛠️ DevOps Mühendisi',
    name: 'DevOps Mühendisi',
    role: 'DevOps & SRE',
    description: 'Docker, bash betikleri ve sistem araçlarını kullanarak dağıtım yapar.',
    system_prompt: 'Sen sistem yöneticisi ve DevOps mühendisisin. Terminal komutları, Docker ve diğer araçlarla sistem kurulumlarını ve yönetimini gerçekleştirirsin.',
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.3,
    permissions: { file_system: true, terminal_cmd: true, web_search: true, system_admin: true },
    image: { enabled: false, provider: 'openai', model: 'dall-e-3' },
    video: { enabled: false, provider: 'openai', model: 'sora-1' },
    audio: { enabled: false, provider: 'openai', model: 'whisper-1' }
  }
];

// Medya modelleri icin basit sabitler
const IMAGE_MODEL_HINTS = ['dall-e-3', 'gpt-image-1', 'flux-pro', 'stable-diffusion-3'];
const VIDEO_MODEL_HINTS = ['sora-1', 'veo-2', 'runway-gen3', 'kling-1.5'];
const AUDIO_MODEL_HINTS = ['whisper-1', 'tts-1', 'tts-1-hd', 'elevenlabs-multilingual-v2'];

const STEPS = [
  'Temel Bilgiler',
  'LLM Yapilandirmasi',
  'Medya Yetenekleri',
  'Davranis',
  'Yetkiler',
  'Plugins ve MCP'] as const;
type StepIdx = 0 | 1 | 2 | 3 | 4 | 5;

// ============================================================
// Component
// ============================================================

export function AgentForm({
  initial,
  onSubmit,
  onCancel,
  submitting = false,
  onOpenEnvSettings}: AgentFormProps) {
  const isEditing = !!initial;

  // --- Durum ---
  const [step, setStep] = useState<StepIdx>(0);

  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [templateSelected, setTemplateSelected] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [provider, setProvider] = useState<ProviderName>(
    (initial?.provider as ProviderName) ?? 'openai',
  );
  const [model, setModel] = useState(initial?.model ?? 'gpt-4o-mini');
  const [baseUrl, setBaseUrl] = useState(initial?.base_url ?? '');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [clearApiKey, setClearApiKey] = useState(false);

  // Sprint A.11.1: env durumu
  const [envStatus, setEnvStatus] = useState<{ has: Record<string, boolean>; masked: Record<string, string | null> } | null>(null);
  useEffect(() => {
    api.getEnv().then((d) => setEnvStatus({ has: d.has, masked: d.masked })).catch(() => setEnvStatus(null));
  }, []);

  const [image, setImage] = useState<MediaCapabilityInput>({
    enabled: initial?.image?.enabled ?? false,
    provider: initial?.image?.provider ?? '',
    model: initial?.image?.model ?? '',
    base_url: initial?.image?.base_url ?? '',
    api_key: ''});
  const [video, setVideo] = useState<MediaCapabilityInput>({
    enabled: initial?.video?.enabled ?? false,
    provider: initial?.video?.provider ?? '',
    model: initial?.video?.model ?? '',
    base_url: initial?.video?.base_url ?? '',
    api_key: ''});
  const [audio, setAudio] = useState<MediaCapabilityInput>({
    enabled: initial?.audio?.enabled ?? false,
    provider: initial?.audio?.provider ?? '',
    model: initial?.audio?.model ?? '',
    base_url: initial?.audio?.base_url ?? '',
    api_key: ''});

  const [systemPrompt, setSystemPrompt] = useState(initial?.system_prompt ?? '');
  const [temperature, setTemperature] = useState<number>(initial?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState<number>(initial?.max_tokens ?? 1024);
  const [tagsText, setTagsText] = useState<string>((initial?.tags ?? []).join(', '));
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true);

  const [permissions, setPermissions] = useState<AgentPermissions>(initial?.permissions ?? {
    file_system: true,
    terminal_cmd: true,
    web_search: true,
    system_admin: true});

  const applyTemplate = (tpl: AgentTemplate) => {
    setName(tpl.name);
    setRole(tpl.role);
    setDescription(tpl.description);
    setSystemPrompt(tpl.system_prompt);
    setProvider(tpl.provider);
    setModel(tpl.model);
    setTemperature(tpl.temperature);
    setPermissions(tpl.permissions);
    setTemplateSelected(true);
    setSelectedTemplateId(tpl.id);

    if (tpl.image) {
      setImage({
        enabled: !!tpl.image.enabled,
        provider: tpl.image.provider ?? '',
        model: tpl.image.model ?? '',
        base_url: tpl.image.base_url ?? '',
        api_key: ''
      });
    }
    if (tpl.video) {
      setVideo({
        enabled: !!tpl.video.enabled,
        provider: tpl.video.provider ?? '',
        model: tpl.video.model ?? '',
        base_url: tpl.video.base_url ?? '',
        api_key: ''
      });
    }
    if (tpl.audio) {
      setAudio({
        enabled: !!tpl.audio.enabled,
        provider: tpl.audio.provider ?? '',
        model: tpl.audio.model ?? '',
        base_url: tpl.audio.base_url ?? '',
        api_key: ''
      });
    }
  };

  const handleClearTemplate = () => {
    setName('');
    setRole('');
    setDescription('');
    setSystemPrompt('');
    setProvider('openai');
    setModel('gpt-4o-mini');
    setTemperature(0.7);
    setPermissions({
      file_system: true,
      terminal_cmd: true,
      web_search: true,
      system_admin: true
    });
    setImage({
      enabled: false,
      provider: '',
      model: '',
      base_url: '',
      api_key: ''
    });
    setVideo({
      enabled: false,
      provider: '',
      model: '',
      base_url: '',
      api_key: ''
    });
    setAudio({
      enabled: false,
      provider: '',
      model: '',
      base_url: '',
      api_key: ''
    });
    setTemplateSelected(false);
    setSelectedTemplateId(null);
  };

  const [error, setError] = useState<string | null>(null);

  // Model katalogu
  const [catalog, setCatalog] = useState<ModelsCatalog | null>(null);
  useEffect(() => {
    api.getModelsCatalog().then(setCatalog).catch(() => setCatalog(null));
  }, []);
  const modelSuggestions: ModelInfoOut[] = useMemo(() => {
    const fromCatalog = catalog ? (catalog as unknown as Record<string, ModelInfoOut[] | undefined>)[provider] : null;
    if (fromCatalog && fromCatalog.length > 0) return fromCatalog;
    return FALLBACK_MODELS[provider] ?? FALLBACK_MODELS.openai;
  }, [catalog, provider]);

  useEffect(() => {
    if (!isEditing) setModel(modelSuggestions[0]?.id ?? '');
  }, [provider, isEditing, modelSuggestions]);

  // Baglanti testi
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResponse | null>(null);
  useEffect(() => setTestResult(null), [provider, model, baseUrl, apiKey]);

  const handleTest = async (useEnvKey = false) => {
    setTesting(true);
    setTestResult(null);
    try {
      const resp = await api.testAgentConnection({
        provider,
        model: model.trim(),
        api_key: useEnvKey ? null : (apiKey.trim() || null),
        base_url: baseUrl.trim() || null});
      setTestResult(resp);
    } catch (err) {
      setTestResult({
        ok: false,
        provider,
        model,
        latency_ms: 0,
        message: err instanceof Error ? err.message : String(err)});
    } finally {
      setTesting(false);
    }
  };

  const canJumpTo = (targetStep: number) => {
    if (targetStep <= step) return true;
    if (templateSelected || isEditing) return true;
    return targetStep === step + 1 && canGoNext();
  };

  // Kayit
  const canGoNext = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return model.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Ajan adi zorunlu.');
      setStep(0);
      return;
    }
    if (!model.trim()) {
      setError('Model adi zorunlu.');
      setStep(1);
      return;
    }
    const cleanMedia = (m: MediaCapabilityInput) => {
      if (!m.enabled && !m.provider && !m.model && !m.base_url && !m.api_key) return null;
      return {
        enabled: !!m.enabled,
        provider: m.provider?.trim() || null,
        model: m.model?.trim() || null,
        base_url: m.base_url?.trim() || null,
        api_key: m.api_key?.trim() || null} as MediaCapabilityInput;
    };

    const payload: AgentCreate = {
      name: name.trim(),
      role: role.trim(),
      description: description.trim(),
      provider,
      model: model.trim(),
      system_prompt: systemPrompt,
      base_url: baseUrl.trim() || null,
      api_key: apiKey.trim() || null,
      clear_api_key: clearApiKey,
      temperature,
      max_tokens: maxTokens,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      is_active: isActive,
      image: cleanMedia(image),
      video: cleanMedia(video),
      audio: cleanMedia(audio),
      permissions: permissions};

    if (clearApiKey) {
      payload.api_key = null;
    } else if (isEditing && !apiKey.trim()) {
      delete (payload as Partial<AgentCreate>).api_key;
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-backdrop-in">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-lg border border-brand-borderStrong bg-brand-panel shadow-2xl animate-modal-in">
        {/* Baslik + Adim gostergesi */}
        <div className="px-6 py-4 border-b border-brand-border bg-brand-panelAlt">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-brand-text tracking-wide">
                {isEditing ? 'Ajani Duzenle' : 'Yeni Ajan Olustur'}
              </h2>
              <p className="text-[11px] text-brand-muted mt-0.5">
                Adim {step + 1} / {STEPS.length} — {STEPS[step]}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-brand-muted hover:text-brand-text text-2xl leading-none px-2"
              aria-label="Kapat"
            >
              ×
            </button>
          </div>
          <Stepper current={step} onJump={(i) => canJumpTo(i) && setStep(i as StepIdx)} canJumpTo={canJumpTo} />
        </div>

        {/* Icerik */}
        <div className="flex-1 overflow-y-auto p-6">
          <div key={step} className="animate-step-in">
            {step === 0 && (
              <StepBasic
                name={name}
                setName={setName}
                role={role}
                setRole={setRole}
                description={description}
                setDescription={setDescription}
                onApplyTemplate={applyTemplate}
                selectedTemplateId={selectedTemplateId}
                onClearTemplate={handleClearTemplate}
              />
            )}

            {step === 1 && (
              <StepLLM
                provider={provider}
                setProvider={setProvider}
                model={model}
                setModel={setModel}
                baseUrl={baseUrl}
                setBaseUrl={setBaseUrl}
                apiKey={apiKey}
                setApiKey={setApiKey}
                showApiKey={showApiKey}
                setShowApiKey={setShowApiKey}
                clearApiKey={clearApiKey}
                setClearApiKey={setClearApiKey}
                modelSuggestions={modelSuggestions}
                isEditing={isEditing}
                initial={initial}
                onTest={handleTest}
                testing={testing}
                testResult={testResult}
                envStatus={envStatus}
                onOpenEnvSettings={onOpenEnvSettings}
              />
            )}

            {step === 2 && (
              <StepMedia
                image={image}
                setImage={setImage}
                video={video}
                setVideo={setVideo}
                audio={audio}
                setAudio={setAudio}
                isEditing={isEditing}
                initialImageMask={initial?.image?.api_key_masked}
                initialVideoMask={initial?.video?.api_key_masked}
                initialAudioMask={initial?.audio?.api_key_masked}
              />
            )}

            {step === 3 && (
              <StepBehavior
                systemPrompt={systemPrompt}
                setSystemPrompt={setSystemPrompt}
                temperature={temperature}
                setTemperature={setTemperature}
                maxTokens={maxTokens}
                setMaxTokens={setMaxTokens}
                tagsText={tagsText}
                setTagsText={setTagsText}
                isActive={isActive}
                setIsActive={setIsActive}
              />
            )}

            {step === 4 && (
              <StepPermissions
                permissions={permissions}
                setPermissions={setPermissions}
              />
            )}

            {step === 5 && <StepPlugins />}
          </div>

          {error && (
            <div className="mt-4 p-3 text-xs text-brand-danger bg-brand-danger/10 border border-brand-danger/40 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-brand-border bg-brand-panelAlt">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded border border-brand-border text-brand-textSoft hover:text-brand-text hover:border-brand-borderStrong transition"
          >
            Iptal
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep((s) => (Math.max(0, s - 1) as StepIdx))}
              disabled={step === 0}
              className="px-4 py-2 text-sm rounded border border-brand-border text-brand-textSoft hover:text-brand-text disabled:opacity-30 transition"
            >
              Geri
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => canGoNext() && setStep((s) => (s + 1) as StepIdx)}
                disabled={!canGoNext()}
                className="px-5 py-2 text-sm rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition"
              >
                Ileri
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 text-sm rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-50 transition"
              >
                {submitting
                  ? 'Kaydediliyor...'
                  : isEditing
                    ? 'Degisiklikleri Kaydet'
                    : 'Ajani Olustur'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Stepper
// ============================================================

function Stepper({
  current,
  onJump,
  canJumpTo}: {
  current: number;
  onJump: (i: number) => void;
  canJumpTo: (i: number) => boolean;
}) {
  return (
    <div className="flex items-center gap-1 mt-3">
      {STEPS.map((label, i) => {
        const active = i === current;
        const done = i < current;
        const allowed = canJumpTo(i);
        return (
          <button
            key={label}
            type="button"
            onClick={() => allowed && onJump(i)}
            disabled={!allowed}
            className={`flex-1 group transition-all duration-200 ${!allowed ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition ${
                  active
                    ? 'bg-brand-accent text-brand-bg border-brand-accent'
                    : done
                      ? 'bg-brand-accent/20 text-brand-accent border-brand-accent/40'
                      : 'bg-brand-bg text-brand-muted border-brand-border'
                }`}
              >
                {done ? <Icon name="check" size={14} weight={700} /> : i + 1}
              </div>
              <div
                className={`text-[10px] uppercase tracking-wider font-semibold hidden md:block ${
                  active ? 'text-brand-accent' : 'text-brand-muted'
                }`}
              >
                {label}
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px mt-3 ml-6 ${done ? 'bg-brand-accent/50' : 'bg-brand-border'}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Adim 1: Temel
// ============================================================

function StepBasic({
  name,
  setName,
  role,
  setRole,
  description,
  setDescription,
  onApplyTemplate,
  selectedTemplateId,
  onClearTemplate}: {
  name: string;
  setName: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  onApplyTemplate: (tpl: AgentTemplate) => void;
  selectedTemplateId: string | null;
  onClearTemplate: () => void;
}) {
  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <StepHeading
        title="Ajan kimligini tanit"
        desc="Ajanina bir isim ver ve ne is yapacagini kisa bicimde anlat."
      />

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[10px] font-semibold text-brand-textSoft uppercase tracking-wider">
            Sablon Galerisi (Hizli Baslangic)
          </label>
          {selectedTemplateId && (
            <button
              type="button"
              onClick={onClearTemplate}
              className="text-[10px] text-brand-danger hover:underline inline-flex items-center gap-0.5"
            >
              <Icon name="cancel" size={12} />
              Şablonu İptal Et
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {AGENT_TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onApplyTemplate(tpl)}
                className={`p-2.5 text-left text-xs rounded border transition flex flex-col gap-1 active:scale-[0.98] ${
                  isSelected
                    ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/30 font-semibold'
                    : 'border-brand-border bg-brand-panelAlt hover:border-brand-accent hover:bg-brand-panel'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-brand-text">{tpl.label}</span>
                  {isSelected && (
                    <span className="text-brand-accent flex items-center">
                      <Icon name="check_circle" size={13} filled />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-brand-muted line-clamp-1">{tpl.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Ajan Adi *">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="orn. Kodcu Asistan"
          className={inputCls}
          autoFocus
        />
      </Field>
      <Field label="Rol / Unvan">
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="orn. Senior Full-Stack Developer"
          className={inputCls}
        />
      </Field>
      <Field label="Aciklama">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Ajanin ne yaptigini kisa acikla — UI'de kartta gorunecek."
          className={inputCls + ' resize-y'}
        />
      </Field>
    </div>
  );
}

// ============================================================
// Adim 2: LLM (Sprint A.11.1)
// ============================================================

function StepLLM({
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
  modelSuggestions,
  isEditing,
  initial,
  onTest,
  testing,
  testResult,
  envStatus,
  onOpenEnvSettings}: {
  provider: ProviderName;
  setProvider: (v: ProviderName) => void;
  model: string;
  setModel: (v: string) => void;
  baseUrl: string;
  setBaseUrl: (v: string) => void;
  apiKey: string;
  setApiKey: (v: string) => void;
  showApiKey: boolean;
  setShowApiKey: (fn: (v: boolean) => boolean) => void;
  clearApiKey: boolean;
  setClearApiKey: (v: boolean) => void;
  modelSuggestions: ModelInfoOut[];
  isEditing: boolean;
  initial?: AgentDetail | null;
  onTest: (useEnvKey?: boolean) => void;
  testing: boolean;
  testResult: ConnectionTestResponse | null;
  envStatus: { has: Record<string, boolean>; masked: Record<string, string | null> } | null;
  onOpenEnvSettings?: () => void;
}) {
  const [presetId, setPresetId] = useState<string>('');

  const applyPreset = (id: string) => {
    setPresetId(id);
    if (!id) return;
    const p = PROXY_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setProvider(p.provider);
    setBaseUrl(p.base_url);
  };

  const baseHint =
    provider === 'openai'
      ? 'OpenAI-uyumlu herhangi bir endpoint girebilirsin (OpenRouter, Azure OpenAI, LM Studio, Ollama, Together, Groq, frostai.xyz vb.)'
      : provider === 'anthropic'
        ? 'Varsayilan: https://api.anthropic.com — Anthropic uyumlu bir proxy kullaniyorsan gir.'
        : 'Yerel servis URL\'i (Ollama: http://localhost:11434/v1, LM Studio: http://localhost:1234/v1)';

  // .env'de hangi key var?
  const envKey = provider === 'openai' ? 'OPENAI_API_KEY' : provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : null;
  const envHasKey = envKey ? !!envStatus?.has?.[envKey] : false;
  const envMaskedKey = envKey ? envStatus?.masked?.[envKey] : null;
  const isLocal = provider === 'local';

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <StepHeading
        title="Modelin nereden gelecek?"
        desc="LLM saglayicisini, kullanacagin modeli ve (varsa) ozel endpoint ile API anahtarini gir."
      />

      {/* Sprint A.11.1: Proxy preset */}
      <Field label="Proxy / Preset (opsiyonel)">
        <CustomSelect
          value={presetId}
          onChange={applyPreset}
          placeholder="— Manuel yapılandırma —"
          options={PROXY_PRESETS.map((p) => ({
            value: p.id,
            label: `${p.label}${p.base_url ? ` — ${p.base_url}` : ''}`
          }))}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Sağlayıcı *">
          <CustomSelect
            value={provider}
            onChange={(v) => setProvider(v as ProviderName)}
            options={[
              { value: 'openai', label: 'OpenAI (ve uyumlu)' },
              { value: 'anthropic', label: 'Anthropic (Claude)' },
              { value: 'local', label: 'Yerel (Ollama, LM Studio vb.)' }
            ]}
          />
        </Field>
        <Field label="Model *">
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            list={`model-suggestions-${provider}`}
            placeholder="orn. gpt-4o-mini"
            className={inputCls}
          />
          <datalist id={`model-suggestions-${provider}`}>
            {modelSuggestions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
                {m.description ? ` - ${m.description}` : ''}
              </option>
            ))}
          </datalist>
        </Field>
      </div>

      {!isLocal && (
        <>
          {/* Sprint A.11.1: .env durumu */}
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
                  {onOpenEnvSettings ? (
                    <button
                      type="button"
                      onClick={onOpenEnvSettings}
                      className="text-brand-accent underline hover:text-brand-accentDim"
                    >
                      Ayarlar &rarr; API Anahtarlari
                    </button>
                  ) : (
                    <span className="font-semibold">Ayarlar &rarr; API Anahtarlari</span>
                  )}
                  {' '}sekmesinden ekle.
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
                onClick={() => setShowApiKey((v) => !v)}
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

          <div className="rounded border border-brand-border bg-brand-bg/50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-brand-text">Baglantiyi Test Et</div>
                <div className="text-[11px] text-brand-muted mt-0.5">
                  Provider'a kucuk bir istek atip dogrula.
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onTest(false)}
                  disabled={testing || !model.trim()}
                  className="text-xs px-3 py-1.5 rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition whitespace-nowrap"
                >
                  {testing ? '...' : 'Bu key ile'}
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

            {testResult && (
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
                <div className="opacity-90 break-words">{testResult.message}</div>
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

// ============================================================
// Adim 3: Medya
// ============================================================

function StepMedia({
  image,
  setImage,
  video,
  setVideo,
  audio,
  setAudio,
  isEditing,
  initialImageMask,
  initialVideoMask,
  initialAudioMask}: {
  image: MediaCapabilityInput;
  setImage: (v: MediaCapabilityInput) => void;
  video: MediaCapabilityInput;
  setVideo: (v: MediaCapabilityInput) => void;
  audio: MediaCapabilityInput;
  setAudio: (v: MediaCapabilityInput) => void;
  isEditing: boolean;
  initialImageMask?: string | null;
  initialVideoMask?: string | null;
  initialAudioMask?: string | null;
}) {
  return (
    <div className="space-y-3 max-w-xl mx-auto">
      <StepHeading
        title="Medya yetenekleri (opsiyonel)"
        desc="Ajanina gorsel/video/ses uretim veya anlama yetenegi eklemek istersen doldur. Hepsi opsiyonel — bos birakabilirsin."
      />

      <MediaCapabilityBlock
        title="Gorsel"
        iconName="image"
        placeholder="orn. dall-e-3, flux-pro"
        modelHints={IMAGE_MODEL_HINTS}
        value={image}
        onChange={setImage}
        isEditing={isEditing}
        existingMask={initialImageMask}
      />
      <MediaCapabilityBlock
        title="Video"
        iconName="movie"
        placeholder="orn. sora-1, veo-2"
        modelHints={VIDEO_MODEL_HINTS}
        value={video}
        onChange={setVideo}
        isEditing={isEditing}
        existingMask={initialVideoMask}
      />
      <MediaCapabilityBlock
        title="Ses"
        iconName="graphic_eq"
        placeholder="orn. whisper-1, tts-1-hd"
        modelHints={AUDIO_MODEL_HINTS}
        value={audio}
        onChange={setAudio}
        isEditing={isEditing}
        existingMask={initialAudioMask}
      />
    </div>
  );
}

function MediaCapabilityBlock({
  title,
  iconName,
  placeholder,
  modelHints,
  value,
  onChange,
  isEditing,
  existingMask}: {
  title: string;
  iconName: string;
  placeholder: string;
  modelHints: string[];
  value: MediaCapabilityInput;
  onChange: (v: MediaCapabilityInput) => void;
  isEditing: boolean;
  existingMask?: string | null;
}) {
  const listId = `media-${title.toLowerCase()}-models`;
  const update = (patch: Partial<MediaCapabilityInput>) => onChange({ ...value, ...patch });
  return (
    <div
      className={`rounded border p-3 transition ${
        value.enabled
          ? 'border-brand-accent/40 bg-brand-panelAlt'
          : 'border-brand-border bg-brand-bg/30'
      }`}
    >
      <label className="flex items-center justify-between gap-2 cursor-pointer">
        <span className="flex items-center gap-2 text-brand-accent">
          <Icon name={iconName} size={18} />
          <span className="text-sm font-semibold text-brand-text">{title}</span>
        </span>
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={!!value.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="sr-only"
            id={`toggle-${title}`}
          />
          <div
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${
              value.enabled ? 'bg-brand-accent' : 'bg-brand-borderStrong'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-brand-bg shadow-md transform transition-transform duration-300 ${
                value.enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </div>
      </label>
      {value.enabled && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={value.provider ?? ''}
              onChange={(e) => update({ provider: e.target.value })}
              placeholder="Saglayici (opsiyonel)"
              className={inputCls}
            />
            <input
              type="text"
              value={value.model ?? ''}
              onChange={(e) => update({ model: e.target.value })}
              list={listId}
              placeholder={placeholder}
              className={inputCls}
            />
            <datalist id={listId}>
              {modelHints.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
          <input
            type="text"
            value={value.base_url ?? ''}
            onChange={(e) => update({ base_url: e.target.value })}
            placeholder="Base URL (opsiyonel)"
            className={inputCls}
          />
          <div>
            <input
              type="password"
              value={value.api_key ?? ''}
              onChange={(e) => update({ api_key: e.target.value })}
              placeholder={
                isEditing && existingMask
                  ? `API Key (mevcut: ${existingMask})`
                  : 'API Key (opsiyonel, bos birakabilirsin)'
              }
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Adim 4: Davranis (Sprint A.11.3 — soul dropdown)
// ============================================================

function StepBehavior({
  systemPrompt,
  setSystemPrompt,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
  tagsText,
  setTagsText,
  isActive,
  setIsActive}: {
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
    <div className="space-y-4 max-w-2xl mx-auto">
      <StepHeading
        title="Ajanin kisiligi ve davranisi"
        desc="System prompt ajanin nasil konusacagini belirler. Hazir bir SOUL dosyasi sec ya da kendin yaz."
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
            className="w-full accent-white"
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

      <label className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="accent-white"
        />
        Aktif (ajan listede gorunsun)
      </label>
    </div>
  );
}

// ============================================================
// Yardimci bilesenler
// ============================================================

const inputCls =
  'w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm text-brand-text placeholder:text-brand-mutedSoft focus:outline-none focus:border-brand-accent transition';

interface CustomSelectProps<T> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  placeholder?: string;
  disabled?: boolean;
}

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Seçiniz...',
  disabled = false
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectedOpt = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent transition flex items-center justify-between text-left disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : placeholder}</span>
        <Icon
          name="expand_more"
          size={16}
          className={`text-brand-mutedSoft transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-accent' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-[80] bg-brand-panel border border-brand-borderStrong rounded-md shadow-xl max-h-60 overflow-y-auto py-1 animate-command-palette-in">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-sm transition flex items-center justify-between ${
                value === opt.value
                  ? 'bg-brand-accent/15 text-brand-accent font-semibold'
                  : 'text-brand-textSoft hover:bg-brand-panelAlt hover:text-brand-text'
              }`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Icon name="check" size={14} className="text-brand-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-brand-textSoft">{label}</span>
      {children}
      {hint && (
        <span className="block text-[11px] text-brand-mutedSoft leading-snug">
          {hint}
        </span>
      )}
    </label>
  );
}

function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-4">
      <h3 className="text-base font-semibold text-brand-text">{title}</h3>
      <p className="text-xs text-brand-muted mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}

// ============================================================
// Adim 5: Yetkiler (Sprint A.11.2: presetler)
// ============================================================

interface ToolHint {
  name: string;
  desc: string;
}

interface PermissionCategory {
  key: keyof AgentPermissions;
  title: string;
  icon: string;
  desc: string;
  tools: ToolHint[];
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    key: 'file_system',
    title: 'Dosya Sistemi',
    icon: 'folder',
    desc: 'Yerel dosyalari okuma, yazma, kopyalama, silme ve arama yetkileri.',
    tools: [
      { name: 'read_file', desc: 'Dosya icerigini okur' },
      { name: 'write_file', desc: 'Dosyaya yazar (ustune yazar)' },
      { name: 'append_file', desc: 'Dosya sonuna ekler' },
      { name: 'list_dir', desc: 'Klasor icerigini listeler' },
      { name: 'search_files', desc: 'Dosyalarda metin arar' },
      { name: 'copy_file / move_file / delete_file', desc: 'Kopyala / tasi / sil' },
      { name: 'mkdir', desc: 'Klasor olusturur' },
      { name: 'zip / unzip', desc: 'Arsiv islemleri' },
      { name: 'read_document', desc: 'PDF / DOCX / XLSX okuma' },
      { name: 'pdf_generate / xlsx_write', desc: 'PDF / XLSX uretir' }]},
  {
    key: 'terminal_cmd',
    title: 'Terminal ve Komut Calistirma',
    icon: 'terminal',
    desc: 'CMD/PowerShell/Bash komutlari, git, paket yoneticileri, kod degerlendirme.',
    tools: [
      { name: 'run_command', desc: 'Whitelist\'teki komutlari calistirir' },
      { name: 'open_app', desc: 'Uygulama acar' },
      { name: 'python_eval', desc: 'Sandbox\'ta Python kodu calistirir' },
      { name: 'evaluate_math', desc: 'Matematik ifadesini hesaplar' },
      { name: 'regex_match', desc: 'Regex eslesmeleri' },
      { name: 'list_processes / kill_process', desc: 'Surec yonetimi' },
      { name: 'git_*', desc: 'Git: clone, status, commit, push, pull, branch...' },
      { name: 'db_query / db_execute / db_schema', desc: 'SQLite/Postgres erisimi' }]},
  {
    key: 'web_search',
    title: 'Web Erisimi',
    icon: 'public',
    desc: 'Internet aramalari, sayfa okuma, browser otomasyonu, e-posta, mesajlasma.',
    tools: [
      { name: 'web_search', desc: 'Web aramasi' },
      { name: 'open_url', desc: 'URL acar' },
      { name: 'http_request', desc: 'GET/POST/PUT/DELETE istegi' },
      { name: 'download_file', desc: 'Dosya indirir' },
      { name: 'browser_navigate / browser_click / browser_fill', desc: 'Playwright otomasyonu' },
      { name: 'read_webpage', desc: 'Sayfayi okuyup metne donustur' },
      { name: 'email_send / email_read_inbox', desc: 'SMTP / IMAP' },
      { name: 'slack_send / discord_send / telegram_send', desc: 'Mesajlasma' },
      { name: 'image_generate', desc: 'OpenAI image API' }]},
  {
    key: 'system_admin',
    title: 'Sistem Yonetimi',
    icon: 'admin_panel_settings',
    desc: 'Ekran yakalama, fare/klavye otomasyonu, pencere ve guc yonetimi. Dikkatli kullanin.',
    tools: [
      { name: 'screenshot', desc: 'Ekran goruntusu alir' },
      { name: 'click / mouse_move', desc: 'Fare olaylari' },
      { name: 'type_text / key_press', desc: 'Klavye olaylari' },
      { name: 'list_windows / focus_window', desc: 'Pencere listesi/odak' },
      { name: 'minimize / maximize / close_window', desc: 'Pencere kontrolu' },
      { name: 'clipboard_get / clipboard_set', desc: 'Pano' },
      { name: 'show_notification / play_beep / text_to_speech', desc: 'Bildirim & ses' },
      { name: 'set_volume / lock_screen', desc: 'Sistem kontrolu' },
      { name: 'shutdown / cancel_shutdown', desc: 'Kapatma planlama' }]}];

interface PermissionPreset {
  id: string;
  label: string;
  icon: string;
  desc: string;
  values: AgentPermissions;
}

const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    id: 'readonly',
    label: 'Salt-okunur',
    icon: 'lock',
    desc: 'Sadece sohbet — hicbir sistem aracina erisim yok',
    values: { file_system: false, terminal_cmd: false, web_search: false, system_admin: false }},
  {
    id: 'researcher',
    label: 'Arastirmaci',
    icon: 'travel_explore',
    desc: 'Web arama + sayfa okuma; dosya/terminal yok',
    values: { file_system: false, terminal_cmd: false, web_search: true, system_admin: false }},
  {
    id: 'writer',
    label: 'Yazar',
    icon: 'edit_note',
    desc: 'Dosya yazma + web arama; terminal yok',
    values: { file_system: true, terminal_cmd: false, web_search: true, system_admin: false }},
  {
    id: 'developer',
    label: 'Gelistirici',
    icon: 'code',
    desc: 'Dosya + terminal + git + web; sistem yonetimi yok',
    values: { file_system: true, terminal_cmd: true, web_search: true, system_admin: false }},
  {
    id: 'full',
    label: 'Tam yetkili',
    icon: 'verified_user',
    desc: 'Hersey acik — ekran/klavye/fare dahil',
    values: { file_system: true, terminal_cmd: true, web_search: true, system_admin: true }}];

function permsEqual(a: AgentPermissions, b: AgentPermissions): boolean {
  return a.file_system === b.file_system && a.terminal_cmd === b.terminal_cmd
    && a.web_search === b.web_search && a.system_admin === b.system_admin;
}

function StepPermissions({
  permissions,
  setPermissions}: {
  permissions: AgentPermissions;
  setPermissions: (v: AgentPermissions) => void;
}) {
  // Mevcut izinler hangi preset'le eslesiyor?
  const matchedPreset = PERMISSION_PRESETS.find((p) => permsEqual(p.values, permissions));
  const [selectedPresetId, setSelectedPresetId] = useState<string>(matchedPreset?.id ?? 'custom');

  useEffect(() => {
    const m = PERMISSION_PRESETS.find((p) => permsEqual(p.values, permissions));
    setSelectedPresetId(m?.id ?? 'custom');
  }, [permissions]);

  const update = (patch: Partial<AgentPermissions>) =>
    setPermissions({ ...permissions, ...patch });

  const applyPreset = (id: string) => {
    setSelectedPresetId(id);
    if (id === 'custom') return;
    const p = PERMISSION_PRESETS.find((x) => x.id === id);
    if (p) setPermissions(p.values);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <StepHeading
        title="Guvenlik ve Izinler"
        desc="Hazir bir izin profili sec ya da Ozel ile detayli ayar yap."
      />

      {/* Preset secici */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {PERMISSION_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p.id)}
            className={`text-left rounded border p-2.5 transition flex items-start gap-2 ${
              selectedPresetId === p.id
                ? 'border-brand-accent bg-brand-panelAlt ring-1 ring-brand-accent/30'
                : 'border-brand-border bg-brand-bg/30 hover:border-brand-borderStrong'
            }`}
            title={p.desc}
          >
            <Icon name={p.icon} size={18} className={selectedPresetId === p.id ? 'text-brand-accent' : 'text-brand-muted'} />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-brand-text">{p.label}</div>
              <div className="text-[10px] text-brand-mutedSoft truncate">{p.desc}</div>
            </div>
          </button>
        ))}
        <button
          type="button"
          onClick={() => applyPreset('custom')}
          className={`text-left rounded border p-2.5 transition flex items-start gap-2 ${
            selectedPresetId === 'custom'
              ? 'border-brand-accent bg-brand-panelAlt ring-1 ring-brand-accent/30'
              : 'border-brand-border bg-brand-bg/30 hover:border-brand-borderStrong'
          }`}
        >
          <Icon name="tune" size={18} className={selectedPresetId === 'custom' ? 'text-brand-accent' : 'text-brand-muted'} />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-brand-text">Ozel</div>
            <div className="text-[10px] text-brand-mutedSoft truncate">Detayli ayarla</div>
          </div>
        </button>
      </div>

      {/* Custom mode: kategori detaylari */}
      {selectedPresetId === 'custom' && (
        <div className="space-y-3">
          {PERMISSION_CATEGORIES.map((cat) => (
            <PermissionBlock
              key={cat.key}
              title={cat.title}
              desc={cat.desc}
              icon={cat.icon}
              tools={cat.tools}
              enabled={permissions[cat.key]}
              onChange={(v) => update({ [cat.key]: v } as Partial<AgentPermissions>)}
            />
          ))}
        </div>
      )}

      {/* Preset mode: ozet */}
      {selectedPresetId !== 'custom' && (
        <div className="rounded border border-brand-border bg-brand-bg/30 p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-brand-mutedSoft">
            Bu profil su izinleri verir:
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {PERMISSION_CATEGORIES.map((cat) => {
              const on = permissions[cat.key];
              return (
                <div
                  key={cat.key}
                  className={`flex items-center gap-2 text-xs rounded px-2 py-1.5 border ${
                    on
                      ? 'border-brand-success/30 bg-brand-success/5 text-brand-text'
                      : 'border-brand-border bg-brand-bg/40 text-brand-mutedSoft'
                  }`}
                >
                  <Icon name={on ? 'check_circle' : 'cancel'} size={14} className={on ? 'text-brand-success' : 'text-brand-mutedSoft'} />
                  <Icon name={cat.icon} size={13} />
                  <span className="truncate">{cat.title}</span>
                </div>
              );
            })}
          </div>
          <div className="text-[10px] text-brand-mutedSoft pt-1 border-t border-brand-border">
            Ince ayar yapmak istersen <strong>Ozel</strong>'i sec.
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionBlock({
  title,
  desc,
  icon,
  tools,
  enabled,
  onChange}: {
  title: string;
  desc: string;
  icon: string;
  tools: ToolHint[];
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const visibleTools = showAll ? tools : tools.slice(0, 6);

  return (
    <div
      className={`rounded border p-3 transition ${
        enabled
          ? 'border-brand-accent/40 bg-brand-panelAlt'
          : 'border-brand-border bg-brand-bg/30'
      }`}
    >
      <label className="flex items-start justify-between gap-2 cursor-pointer text-brand-text">
        <div className="flex gap-3 min-w-0">
          <div className="text-brand-accent mt-0.5">
            <Icon name={icon} size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-[11px] text-brand-muted mt-0.5">{desc}</div>
          </div>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-white mt-1 flex-shrink-0"
        />
      </label>

      {/* Tool listesi (chip + tooltip) */}
      <div className={`mt-2 pt-2 border-t border-brand-border/60 transition ${enabled ? 'opacity-100' : 'opacity-50'}`}>
        <div className="text-[10px] uppercase tracking-wider text-brand-mutedSoft mb-1.5">
          Bu kategori asagidaki tool'lara erisim verir:
        </div>
        <div className="flex flex-wrap gap-1">
          {visibleTools.map((t) => (
            <span
              key={t.name}
              title={t.desc}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border border-brand-border bg-brand-panel text-brand-textSoft cursor-help"
            >
              <Icon name="bolt" size={10} className="text-brand-accent" />
              {t.name}
            </span>
          ))}
          {tools.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="text-[10px] text-brand-accent hover:underline px-1"
            >
              {showAll ? 'Az goster' : `+${tools.length - 6} daha`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Adim 6: Plugins / MCP (Sprint A.11.4 — placeholder)
// ============================================================

function StepPlugins() {
  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <StepHeading
        title="Plugins ve MCP"
        desc="Bu ajana ek tool kaynaklari (plugin'ler / MCP sunuculari) atayabilirsin. Hepsi opsiyonel."
      />

      <div className="rounded border border-brand-accent/30 bg-brand-accent/5 p-3 text-xs flex items-start gap-2">
        <Icon name="hourglass_empty" size={16} className="text-brand-accent flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-brand-accent">Yakinda:</strong> Bu adim ileride buradaki plugin
          kayitlarini (<code className="font-mono">plugins/</code>) ve MCP sunucularini
          (<code className="font-mono">backend/agents/mcp_servers.yaml</code>) ajan-bazli secebilmeni
          saglayacak. Su an icin geri/ileri butonlariyla atlayabilirsin.
        </div>
      </div>

      <div className="rounded border border-brand-border bg-brand-bg/30 p-3 space-y-2">
        <div className="text-[11px] text-brand-mutedSoft">
          <strong>Bilgi:</strong> Plugin'ler ve MCP sunuculari su an{' '}
          <strong>tum ajanlar tarafindan ortak</strong> kullanilir; ayrica ajan-bazli
          aktiflestirme henuz desteklenmiyor.
        </div>
        <ul className="space-y-1 text-[11px] text-brand-textSoft list-none pl-0">
          <li className="flex items-start gap-1.5">
            <Icon name="info" size={12} className="text-brand-accent flex-shrink-0 mt-0.5" />
            Plugin ekleme: <code className="font-mono">plugins/</code> klasorune Python paketi
          </li>
          <li className="flex items-start gap-1.5">
            <Icon name="info" size={12} className="text-brand-accent flex-shrink-0 mt-0.5" />
            MCP server ekleme: <code className="font-mono">backend/agents/mcp_servers.yaml</code>'a
            yeni giris ekleyip <code>enabled: true</code> yap
          </li>
        </ul>
      </div>
    </div>
  );
}