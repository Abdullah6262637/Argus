import { useEffect, useMemo, useState } from 'react';
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
  AgentPermissions
} from '@/types';

// Step components
import { Step1Basic } from './AgentForm/Step1Basic';
import { Step2LLM, PROXY_PRESETS } from './AgentForm/Step2LLM';
import { Step3Media } from './AgentForm/Step3Media';
import { StepBehavior } from './AgentForm/Step4Behavior';
import { Step5Permissions } from './AgentForm/Step5Permissions';
import { Step6Plugins } from './AgentForm/Step6Plugins';
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

interface AgentFormProps {
  initial?: AgentDetail | null;
  onSubmit: (payload: AgentCreate) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}

const FALLBACK_MODELS: Record<string, ModelInfoOut[]> = {
  openai: [
    { id: 'gpt-5.6-sol', label: 'GPT-5.6 Sol (Reasoning Flagship)' },
    { id: 'gpt-5.6-terra', label: 'GPT-5.6 Terra (Balanced)' },
    { id: 'gpt-5.6-luna', label: 'GPT-5.6 Luna (Lightweight)' },
    { id: 'gpt-5.5', label: 'GPT-5.5 Flagship' },
    { id: 'gpt-5.5-pro', label: 'GPT-5.5 Pro (Advanced)' },
    { id: 'gpt-5.4-thinking', label: 'GPT-5.4 Thinking (Deep Reasoning)' },
    { id: 'gpt-5.4-pro', label: 'GPT-5.4 Pro' },
    { id: 'gpt-5.4-instant', label: 'GPT-5.4 Instant' },
    { id: 'gpt-4o', label: 'GPT-4o (Multimodal Flagship)' },
    { id: 'gpt-4o-mini', label: 'GPT-4o mini (Fast & Cost-Effective)' },
    { id: 'o1', label: 'o1 (Reasoning model for complex tasks)' },
    { id: 'o1-mini', label: 'o1-mini (Fast reasoning model)' },
    { id: 'o3', label: 'o3 (Latest high-speed reasoning)' },
    { id: 'o3-mini', label: 'o3-mini (High-speed reasoning mini)' },
    { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { id: 'gpt-4', label: 'GPT-4 (Original)' },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ],
  anthropic: [
    { id: 'claude-fable-5', label: 'Claude Fable 5 (Frontier Intelligence)' },
    { id: 'claude-mythos-5', label: 'Claude Mythos 5 (Glasswing Enterprise)' },
    { id: 'claude-sonnet-5', label: 'Claude Sonnet 5 (Flagship Balanced)' },
    { id: 'claude-opus-4.8', label: 'Claude Opus 4.8 (Enterprise Code & Reason)' },
    { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet (Latest)' },
    { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku (Latest)' },
    { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' }
  ],
  gemini: [
    { id: 'gemini-3.5-pro', label: 'Gemini 3.5 Pro (Premium Reasoning)' },
    { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Long Context 1M)' },
    { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Stable)' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Stable)' },
    { id: 'gemma-4-12b', label: 'Gemma 4 12B (Latest Google Open Weights)' },
    { id: 'gemma-2-27b', label: 'Gemma 2 27B' },
    { id: 'gemma-2-9b', label: 'Gemma 2 9B' }
  ],
  googleaistudio: [
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' }
  ],
  deepseek: [
    { id: 'deepseek-v4-pro', label: 'DeepSeek-V4 Pro (MoE 1.6T parameter)' },
    { id: 'deepseek-v4-flash', label: 'DeepSeek-V4 Flash (High Speed)' },
    { id: 'deepseek-v3', label: 'DeepSeek-V3' },
    { id: 'deepseek-coder', label: 'DeepSeek Coder' },
    { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner (R1)' }
  ],
  mistral: [
    { id: 'mistral-large-3', label: 'Mistral Large 3 (Flagship)' },
    { id: 'mistral-medium-3.5', label: 'Mistral Medium 3.5' },
    { id: 'mistral-small-4', label: 'Mistral Small 4' },
    { id: 'codestral-latest', label: 'Codestral (Coding Specialist)' },
    { id: 'pixtral-large-latest', label: 'Pixtral Large (Multimodal)' },
    { id: 'open-mixtral-8x22b', label: 'Mixtral 8x22B (Open Weights)' },
    { id: 'open-mixtral-8x7b', label: 'Mixtral 8x7B (Open Weights)' }
  ],
  xai: [
    { id: 'grok-4.3', label: 'Grok 4.3 (Latest stable flagship)' },
    { id: 'grok-build-0.1', label: 'Grok Build 0.1 (Developer model)' },
    { id: 'grok-2', label: 'Grok 2' },
    { id: 'grok-beta', label: 'Grok Beta' }
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Groq LPU Speed)' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (Groq LPU Instant)' },
    { id: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B (Groq LPU Balanced)' },
    { id: 'llama-3.1-405b-reasoning', label: 'Llama 3.1 405B (Reasoning Flagship)' },
    { id: 'mixtral-8x7b-instruct', label: 'Mixtral 8x7B (Instruct)' },
    { id: 'gemma-2-9b-it', label: 'Gemma 2 9B IT' },
    { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1 Distill Llama 70B' }
  ],
  openrouter: [
    { id: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'NVIDIA: Llama 3.1 Nemotron 70B' },
    { id: 'nvidia/llama-3.1-nemotron-70b-instruct:free', label: 'NVIDIA: Llama 3.1 Nemotron 70B (Free)' },
    { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'NVIDIA: Nemotron-3 Ultra 550B (Free)' },
    { id: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'NVIDIA: Nemotron-3 Super 120B (Free)' },
    { id: 'nvidia/nemotron-3-nano-omni:free', label: 'NVIDIA: Nemotron-3 Nano Omni (Free)' },
    { id: 'openai/gpt-5.6-sol', label: 'OpenAI: GPT-5.6 Sol (Reasoning Flagship)' },
    { id: 'openai/gpt-5.6-terra', label: 'OpenAI: GPT-5.6 Terra (Balanced)' },
    { id: 'openai/gpt-5.6-luna', label: 'OpenAI: GPT-5.6 Luna (Lightweight)' },
    { id: 'openai/gpt-5.5', label: 'OpenAI: GPT-5.5 Flagship' },
    { id: 'openai/gpt-5.5-pro', label: 'OpenAI: GPT-5.5 Pro (Advanced)' },
    { id: 'openai/gpt-5.4-thinking', label: 'OpenAI: GPT-5.4 Thinking (Deep Reasoning)' },
    { id: 'openai/gpt-5.4-pro', label: 'OpenAI: GPT-5.4 Pro' },
    { id: 'openai/gpt-5.4-instant', label: 'OpenAI: GPT-5.4 Instant' },
    { id: 'openai/gpt-4o', label: 'OpenAI: GPT-4o (Multimodal Flagship)' },
    { id: 'openai/gpt-4o-mini', label: 'OpenAI: GPT-4o mini (Fast & Cost-Effective)' },
    { id: 'openai/o1', label: 'OpenAI: o1 (Reasoning model for complex tasks)' },
    { id: 'openai/o1-mini', label: 'OpenAI: o1-mini (Fast reasoning model)' },
    { id: 'openai/o3', label: 'OpenAI: o3 (Latest high-speed reasoning)' },
    { id: 'openai/o3-mini', label: 'OpenAI: o3-mini (High-speed reasoning mini)' },
    { id: 'openai/gpt-4-turbo', label: 'OpenAI: GPT-4 Turbo' },
    { id: 'openai/gpt-4', label: 'OpenAI: GPT-4 (Original)' },
    { id: 'openai/gpt-3.5-turbo', label: 'OpenAI: GPT-3.5 Turbo' },
    { id: 'anthropic/claude-fable-5', label: 'Anthropic: Claude Fable 5 (Frontier Intelligence)' },
    { id: 'anthropic/claude-mythos-5', label: 'Anthropic: Claude Mythos 5 (Glasswing Enterprise)' },
    { id: 'anthropic/claude-sonnet-5', label: 'Anthropic: Claude Sonnet 5 (Flagship Balanced)' },
    { id: 'anthropic/claude-opus-4.8', label: 'Anthropic: Claude Opus 4.8 (Enterprise Code & Reason)' },
    { id: 'anthropic/claude-3-5-sonnet-latest', label: 'Anthropic: Claude 3.5 Sonnet (Latest)' },
    { id: 'anthropic/claude-3-5-haiku-latest', label: 'Anthropic: Claude 3.5 Haiku (Latest)' },
    { id: 'anthropic/claude-3-opus-20240229', label: 'Anthropic: Claude 3 Opus' },
    { id: 'anthropic/claude-3-sonnet-20240229', label: 'Anthropic: Claude 3 Sonnet' },
    { id: 'anthropic/claude-3-haiku-20240307', label: 'Anthropic: Claude 3 Haiku' },
    { id: 'google/gemini-3.5-pro', label: 'Google: Gemini 3.5 Pro (Premium Reasoning)' },
    { id: 'google/gemini-3.5-flash', label: 'Google: Gemini 3.5 Flash (Long Context 1M)' },
    { id: 'google/gemini-3.1-pro-preview', label: 'Google: Gemini 3.1 Pro Preview' },
    { id: 'google/gemini-2.5-pro', label: 'Google: Gemini 2.5 Pro' },
    { id: 'google/gemini-2.5-flash', label: 'Google: Gemini 2.5 Flash' },
    { id: 'google/gemini-1.5-pro', label: 'Google: Gemini 1.5 Pro (Stable)' },
    { id: 'google/gemini-1.5-flash', label: 'Google: Gemini 1.5 Flash (Stable)' },
    { id: 'google/gemma-4-12b', label: 'Google: Gemma 4 12B (Latest Google Open Weights)' },
    { id: 'google/gemma-2-27b', label: 'Google: Gemma 2 27B' },
    { id: 'google/gemma-2-9b', label: 'Google: Gemma 2 9B' },
    { id: 'deepseek/deepseek-v4-pro', label: 'DeepSeek: DeepSeek-V4 Pro (MoE 1.6T parameter)' },
    { id: 'deepseek/deepseek-v4-flash', label: 'DeepSeek: DeepSeek-V4 Flash (High Speed)' },
    { id: 'deepseek/deepseek-v3', label: 'DeepSeek: DeepSeek-V3' },
    { id: 'deepseek/deepseek-coder', label: 'DeepSeek: DeepSeek Coder' },
    { id: 'deepseek/deepseek-reasoner', label: 'DeepSeek: DeepSeek Reasoner (R1)' },
    { id: 'mistralai/mistral-large-3', label: 'Mistral: Mistral Large 3 (Flagship)' },
    { id: 'mistralai/mistral-medium-3.5', label: 'Mistral: Mistral Medium 3.5' },
    { id: 'mistralai/mistral-small-4', label: 'Mistral: Mistral Small 4' },
    { id: 'mistralai/codestral-latest', label: 'Mistral: Codestral (Coding Specialist)' },
    { id: 'mistralai/pixtral-large-latest', label: 'Mistral: Pixtral Large (Multimodal)' },
    { id: 'mistralai/open-mixtral-8x22b', label: 'Mistral: Mixtral 8x22B (Open Weights)' },
    { id: 'mistralai/open-mixtral-8x7b', label: 'Mistral: Mixtral 8x7B (Open Weights)' },
    { id: 'x-ai/grok-4.3', label: 'xAI: Grok 4.3 (Latest stable flagship)' },
    { id: 'x-ai/grok-build-0.1', label: 'xAI: Grok Build 0.1 (Developer model)' },
    { id: 'x-ai/grok-2', label: 'xAI: Grok 2' },
    { id: 'x-ai/grok-beta', label: 'xAI: Grok Beta' },
    { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B Instruct' },
    { id: 'meta-llama/llama-3.1-405b-instruct', label: 'Llama 3.1 405B Instruct' },
    { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B Instruct' },
    { id: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B Instruct' },
    { id: 'qwen/qwen-2.5-72b-instruct', label: 'Qwen 2.5 72B Instruct' },
    { id: 'qwen/qwen-2.5-coder-32b-instruct', label: 'Qwen 2.5 Coder 32B Instruct' },
    { id: 'qwen/qwen-2.5-7b-instruct', label: 'Qwen 2.5 7B Instruct' },
    { id: 'cohere/command-r-plus', label: 'Cohere Command R+' },
    { id: 'cohere/command-r', label: 'Cohere Command R' },
    { id: 'microsoft/phi-4', label: 'Microsoft Phi 4' },
    { id: 'microsoft/phi-3-medium-128k-instruct', label: 'Microsoft Phi 3 Medium 128k' }
  ],
  local: [
    { id: 'llama3.3', label: 'Llama 3.3' },
    { id: 'llama3.1', label: 'Llama 3.1' },
    { id: 'llama3', label: 'Llama 3' },
    { id: 'qwen2.5-coder', label: 'Qwen 2.5 Coder' },
    { id: 'qwen2.5', label: 'Qwen 2.5' },
    { id: 'deepseek-r1', label: 'DeepSeek R1' },
    { id: 'phi4', label: 'Phi 4 (Microsoft)' },
    { id: 'phi3', label: 'Phi 3 (Microsoft)' },
    { id: 'mistral', label: 'Mistral 7B' },
    { id: 'mixtral', label: 'Mixtral 8x7B' },
    { id: 'gemma2', label: 'Gemma 2' },
    { id: 'codellama', label: 'Code Llama' }
  ],
  sambanova: [
    { id: 'Meta-Llama-3.3-70B-Instruct', label: 'Meta Llama 3.3 70B Instruct (1000+ tok/s)' },
    { id: 'Meta-Llama-3.1-405B-Instruct', label: 'Meta Llama 3.1 405B (SambaNova)' },
    { id: 'Meta-Llama-3.1-70B-Instruct', label: 'Meta Llama 3.1 70B (SambaNova)' },
    { id: 'Meta-Llama-3.1-8B-Instruct', label: 'Meta Llama 3.1 8B (SambaNova)' },
    { id: 'DeepSeek-R1', label: 'DeepSeek R1 (SambaNova)' }
  ],
  cerebras: [
    { id: 'llama3.3-70b', label: 'Llama 3.3 70B (2000+ tok/s)' },
    { id: 'llama3.1-8b', label: 'Llama 3.1 8B' }
  ],
  fireworks: [
    { id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', label: 'Llama 3.3 70B Instruct' },
    { id: 'accounts/fireworks/models/deepseek-r1', label: 'DeepSeek R1 (Fireworks)' },
    { id: 'accounts/fireworks/models/deepseek-v3', label: 'DeepSeek V3 (Fireworks)' }
  ],
  together: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Instruct Turbo' },
    { id: 'deepseek-ai/DeepSeek-R1', label: 'DeepSeek R1 (Together AI)' },
    { id: 'deepseek-ai/DeepSeek-V3', label: 'DeepSeek V3 (Together AI)' }
  ]
};

const STEPS = [
  'Temel Bilgiler',
  'LLM Yapilandirmasi',
  'Medya Yetenekleri',
  'Davranis',
  'Yetkiler',
  'Plugins ve MCP'
] as const;

type StepIdx = 0 | 1 | 2 | 3 | 4 | 5;

export function AgentForm({
  initial,
  onSubmit,
  onCancel,
  submitting = false
}: AgentFormProps) {
  const isEditing = !!initial;

  // --- Durum ---
  const [step, setStep] = useState<StepIdx>(0);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onCancel();
    }, 240);
  };

  const [name, setName] = useState(initial?.name ?? '');
  const [role, setRole] = useState(initial?.role ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [templateSelected, setTemplateSelected] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [provider, setProvider] = useState<ProviderName>(
    (initial?.provider as ProviderName) ?? 'openai'
  );
  const [model, setModel] = useState(initial?.model ?? 'gpt-4o-mini');
  const [baseUrl, setBaseUrl] = useState(initial?.base_url ?? '');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [clearApiKey, setClearApiKey] = useState(false);
  const [presetId, setPresetId] = useState<string>('');

  // env durumu
  const [envStatus, setEnvStatus] = useState<{ has: Record<string, boolean>; masked: Record<string, string | null> } | null>(null);
  useEffect(() => {
    api.getEnv().then((d) => setEnvStatus({ has: d.has, masked: d.masked })).catch(() => setEnvStatus(null));
  }, []);

  const [image, setImage] = useState<MediaCapabilityInput>({
    enabled: initial?.image?.enabled ?? false,
    provider: initial?.image?.provider ?? '',
    model: initial?.image?.model ?? '',
    base_url: initial?.image?.base_url ?? '',
    api_key: ''
  });
  const [video, setVideo] = useState<MediaCapabilityInput>({
    enabled: initial?.video?.enabled ?? false,
    provider: initial?.video?.provider ?? '',
    model: initial?.video?.model ?? '',
    base_url: initial?.video?.base_url ?? '',
    api_key: ''
  });
  const [audio, setAudio] = useState<MediaCapabilityInput>({
    enabled: initial?.audio?.enabled ?? false,
    provider: initial?.audio?.provider ?? '',
    model: initial?.audio?.model ?? '',
    base_url: initial?.audio?.base_url ?? '',
    api_key: ''
  });

  const [systemPrompt, setSystemPrompt] = useState(initial?.system_prompt ?? '');
  const [temperature, setTemperature] = useState<number>(initial?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState<number>(initial?.max_tokens ?? 1024);
  const [tagsText, setTagsText] = useState<string>((initial?.tags ?? []).join(', '));
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true);

  const [permissions, setPermissions] = useState<AgentPermissions>(initial?.permissions ?? {
    file_system: true,
    terminal_cmd: true,
    web_search: true,
    system_admin: true
  });

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

  const applyPreset = (id: string) => {
    setPresetId(id);
    if (!id) return;
    const p = PROXY_PRESETS.find((x) => x.id === id);
    if (p) {
      setProvider(p.provider);
      setBaseUrl(p.base_url);
      setModel(p.model);
    }
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
  const [verifySsl, setVerifySsl] = useState(true);
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
        base_url: baseUrl.trim() || null,
        verify_ssl: verifySsl
      });
      setTestResult(resp);
    } catch (err) {
      setTestResult({
        ok: false,
        provider,
        model,
        latency_ms: 0,
        message: err instanceof Error ? err.message : String(err)
      });
    } finally {
      setTesting(false);
    }
  };

  const canJumpTo = (targetStep: number) => {
    if (targetStep <= step) return true;
    if (templateSelected || isEditing) return true;
    return targetStep === step + 1 && canGoNext();
  };

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
        api_key: m.api_key?.trim() || null
      } as MediaCapabilityInput;
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
      permissions: permissions
    };

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
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
    >
      <div className={`w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-brand-borderStrong bg-brand-panel shadow-2xl relative overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
        {/* Minimalist background */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-brand-panel" />

        {/* Baslik + Adim gostergesi */}
        <div className="relative z-10 px-6 pt-5 pb-3 bg-brand-panelAlt/90 backdrop-blur-[2px]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-brand-text tracking-wide">
                {isEditing ? 'Ajanı Düzenle' : 'Yeni Ajan Oluştur'}
              </h2>
              <p className="text-[11px] text-brand-muted mt-0.5">
                Adım {step + 1} / {STEPS.length} — {STEPS[step]}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-brand-muted hover:text-brand-text text-2xl leading-none px-2"
              aria-label="Kapat"
            >
              ×
            </button>
          </div>
          <Stepper current={step} onJump={(i) => canJumpTo(i) && setStep(i as StepIdx)} canJumpTo={canJumpTo} />
        </div>

        {/* Icerik */}
        <div className="relative z-10 h-[480px] overflow-y-auto p-6">
          <div key={step} className="animate-step-in">
            {step === 0 && (
              <Step1Basic
                name={name}
                setName={setName}
                role={role}
                setRole={setRole}
                description={description}
                setDescription={setDescription}
                onApplyTemplate={applyTemplate}
                selectedTemplateId={selectedTemplateId}
                onClearTemplate={handleClearTemplate}
                isEditing={isEditing}
              />
            )}

            {step === 1 && (
              <Step2LLM
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
                presetId={presetId}
                applyPreset={applyPreset}
                modelSuggestions={modelSuggestions}
                isEditing={isEditing}
                initial={initial}
                onTest={handleTest}
                testing={testing}
                testResult={testResult}
                envStatus={envStatus}
                verifySsl={verifySsl}
                setVerifySsl={setVerifySsl}
              />
            )}

            {step === 2 && (
              <Step3Media
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
              <Step5Permissions
                permissions={permissions}
                setPermissions={setPermissions}
              />
            )}

            {step === 5 && <Step6Plugins />}
          </div>

          {error && (
            <div className="mt-4 p-3 text-xs text-brand-danger bg-brand-danger/10 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Aksiyonlar */}
        <div className="relative z-10 flex items-center justify-between gap-2 px-6 py-4 bg-brand-panelAlt/90 backdrop-blur-[2px]">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded bg-brand-panelAlt text-brand-textSoft hover:text-brand-text transition"
          >
            İptal
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep((s) => (Math.max(0, s - 1) as StepIdx))}
              disabled={step === 0}
              className="px-4 py-2 text-sm rounded bg-brand-panelAlt text-brand-textSoft hover:text-brand-text disabled:opacity-30 transition"
            >
              Geri
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => canGoNext() && setStep((s) => (s + 1) as StepIdx)}
                disabled={!canGoNext()}
                className="px-5 py-2 text-sm rounded bg-brand-accent text-brand-bg font-semibold hover:bg-brand-accentDim disabled:opacity-40 transition"
              >
                İleri
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
                    ? 'Değişiklikleri Kaydet'
                    : 'Ajanı Oluştur'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const SHORT_STEPS = [
  'Temel',
  'LLM',
  'Medya',
  'Davranış',
  'Yetkiler',
  'Eklentiler'
] as const;

function Stepper({
  current,
  onJump,
  canJumpTo
}: {
  current: number;
  onJump: (i: number) => void;
  canJumpTo: (i: number) => boolean;
}) {
  return (
    <div className="mt-3.5 space-y-2">
      {/* İnce Segmentli İlerleme Çubuğu */}
      <div className="flex gap-1.5 w-full">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < current
                ? 'bg-brand-accent/80'
                : i === current
                  ? 'bg-brand-accent shadow-sm shadow-brand-accent/50'
                  : 'bg-brand-panelAlt/60'
            }`}
          />
        ))}
      </div>

      {/* Simetrik Adım Sekmeleri */}
      <div className="grid grid-cols-6 gap-1 bg-brand-bg/50 p-1 rounded-xl">
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
              title={label}
              className={`py-1.5 px-1 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                active
                  ? 'bg-brand-accent/15 text-brand-accent font-bold shadow-sm'
                  : done
                    ? 'text-brand-textSoft hover:text-brand-text hover:bg-brand-panelAlt/60'
                    : 'text-brand-mutedSoft/50 cursor-not-allowed'
              }`}
            >
              {done ? (
                <Icon name="check_circle" size={13} className="text-brand-accent flex-shrink-0" filled />
              ) : (
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono flex-shrink-0 transition-colors ${
                    active
                      ? 'bg-brand-accent text-brand-bg font-bold'
                      : 'bg-brand-panelAlt text-brand-muted'
                  }`}
                >
                  {i + 1}
                </span>
              )}
              <span className="truncate text-[11px] tracking-tight">{SHORT_STEPS[i]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}