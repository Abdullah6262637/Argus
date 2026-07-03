import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/api/client';
import { Icon } from './Icon';
import { getModelLogo, getMcpLogo } from '../utils/modelHelper';
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
    { id: 'gemma2', label: 'Gemma 2' },
    { id: 'mistral', label: 'Mistral Small' }
  ]
};

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

  const STEP_GLOWS = [
    'from-brand-accent/15 via-purple-500/5 to-transparent',       // Step 0: Purple/Indigo
    'from-blue-500/10 via-brand-accent/5 to-transparent',         // Step 1: Blue LLM
    'from-emerald-500/10 via-teal-500/5 to-transparent',          // Step 2: Teal Media
    'from-rose-500/10 via-pink-500/5 to-transparent',             // Step 3: Rose Behavior
    'from-amber-500/10 via-orange-500/5 to-transparent',          // Step 4: Amber Permissions
    'from-violet-500/10 via-indigo-500/5 to-transparent',         // Step 5: Violet Plugins
  ];

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
    >
      <div className={`w-full max-w-3xl max-h-[92vh] flex flex-col rounded-lg border border-brand-borderStrong bg-brand-panel shadow-2xl relative overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}>
        {/* Ambient Glow Background Effect */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div 
            className={`absolute -top-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br ${STEP_GLOWS[step]} blur-[80px] transition-all duration-700 ease-out`} 
          />
          <div 
            className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br ${STEP_GLOWS[step]} blur-[80px] transition-all duration-700 ease-out`} 
          />
        </div>

        {/* Baslik + Adim gostergesi */}
        <div className="relative z-10 px-6 py-4 border-b border-brand-border bg-brand-panelAlt/90 backdrop-blur-[2px]">
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
        <div className="relative z-10 h-[480px] overflow-y-auto p-6 border-b border-brand-border/60">
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
        <div className="relative z-10 flex items-center justify-between gap-2 px-6 py-4 bg-brand-panelAlt/90 backdrop-blur-[2px]">
          <button
            onClick={handleClose}
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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                onChange(opt.value);
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

interface SearchableCustomSelectProps<T> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; searchString: string }[];
  placeholder?: string;
  disabled?: boolean;
  onCustomAdd?: (val: string) => void;
}

function SearchableCustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Seçiniz...',
  disabled = false,
  onCustomAdd
}: SearchableCustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  useEffect(() => {
    if (isOpen) setSearch('');
  }, [isOpen]);

  const selectedOpt = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.searchString.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
        className="w-full bg-brand-bg border border-brand-border rounded px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-accent transition flex items-center justify-between text-left disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : (value || placeholder)}</span>
        <Icon
          name="expand_more"
          size={16}
          className={`text-brand-mutedSoft transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand-accent' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-[80] bg-brand-panel border border-brand-borderStrong rounded-md shadow-xl max-h-64 overflow-y-auto py-1 flex flex-col animate-command-palette-in">
          <div className="px-2 py-1.5 border-b border-brand-border flex items-center gap-1.5 sticky top-0 bg-brand-panel z-10">
            <Icon name="search" size={14} className="text-brand-mutedSoft flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Model ara veya özel yaz..."
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-full bg-transparent border-none text-xs text-brand-text placeholder:text-brand-mutedSoft focus:outline-none"
            />
          </div>

          <div className="overflow-y-auto flex-1 max-h-48 py-1">
            {filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                  onChange(opt.value);
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

            {filtered.length === 0 && search.trim() && onCustomAdd && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCustomAdd(search.trim());
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs text-brand-accent hover:bg-brand-panelAlt transition flex items-center gap-2 font-medium"
              >
                <Icon name="add" size={12} />
                <span className="truncate">"{search.trim()}" modelini kullan</span>
              </button>
            )}

            {filtered.length === 0 && !search.trim() && (
              <div className="px-3 py-2 text-xs text-brand-mutedSoft text-center">
                Sonuç bulunamadı.
              </div>
            )}
          </div>
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
    <div className="block space-y-1">
      <span className="text-xs text-brand-textSoft">{label}</span>
      {children}
      {hint && (
        <span className="block text-[11px] text-brand-mutedSoft leading-snug">
          {hint}
        </span>
      )}
    </div>
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
            className={`text-left rounded border p-2.5 transition-all duration-200 active:scale-[0.98] flex items-start gap-2 ${
              selectedPresetId === p.id
                ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/30 font-semibold'
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
          className={`text-left rounded border p-2.5 transition-all duration-200 active:scale-[0.98] flex items-start gap-2 ${
            selectedPresetId === 'custom'
              ? 'border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/30 font-semibold'
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
      className={`rounded border p-3 transition-all duration-300 ${
        enabled
          ? 'border-brand-accent/40 bg-brand-panelAlt shadow-md shadow-brand-accent/5'
          : 'border-brand-border bg-brand-bg/30'
      } hover:border-brand-borderStrong`}
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
        <div className="relative flex items-center mt-1 flex-shrink-0">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
            id={`toggle-perm-${title}`}
          />
          <div
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 ${
              enabled ? 'bg-brand-accent' : 'bg-brand-borderStrong'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-brand-bg shadow-md transform transition-transform duration-300 ${
                enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </div>
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
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [plugins, setPlugins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listMcpServers(), api.listPlugins()])
      .then(([serversResp, plugs]) => {
        const mcpList = Array.isArray(serversResp)
          ? serversResp
          : (serversResp && Array.isArray(serversResp.servers) ? serversResp.servers : []);
        setMcpServers(mcpList.filter((s: any) => s.enabled));
        setPlugins(plugs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-brand-muted">
        <Icon name="progress_activity" size={20} className="animate-spin mr-2" />
        <span>Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <StepHeading
        title="Plugins ve MCP Yetenekleri"
        desc="Bu ajanin kullanabilecegi eklenti (plugin) ve MCP sunucu listesi."
      />

      <div className="rounded border border-brand-accent/20 bg-brand-accent/5 p-3 text-xs flex items-start gap-2">
        <Icon name="info" size={16} className="text-brand-accent flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-brand-accent">Bilgi:</strong> Eklentiler ve MCP sunucuları globaldir. Bunları etkinleştirmek veya devre dışı bırakmak için üst menüdeki <strong>Ayarlar &gt; Eklentiler &amp; MCP</strong> sekmesini kullanabilirsiniz.
        </div>
      </div>

      <div className="space-y-3">
        {/* MCP Ozet */}
        <div className="rounded border border-brand-border bg-brand-bg/30 p-3 space-y-2">
          <div className="text-[11px] font-bold text-brand-text uppercase tracking-wider">Aktif MCP Sunuculari</div>
          {mcpServers.length === 0 ? (
            <div className="text-[11px] text-brand-mutedSoft italic">Aktif MCP sunucusu bulunmamaktadir.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {mcpServers.map((s) => {
                const logo = getMcpLogo(s.name);
                return (
                  <span key={s.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border border-brand-border bg-brand-panel text-brand-text shadow-sm transition-all hover:border-brand-accent/20">
                    {logo ? (
                      <img src={logo} alt={s.name} className="w-3.5 h-3.5 object-contain" />
                    ) : (
                      <Icon name="dns" size={11} className="text-brand-accent" />
                    )}
                    {s.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Plugins Ozet */}
        <div className="rounded border border-brand-border bg-brand-bg/30 p-3 space-y-2">
          <div className="text-[11px] font-bold text-brand-text uppercase tracking-wider">Sistem Eklentileri (Python Plugins)</div>
          {plugins.length === 0 ? (
            <div className="text-[11px] text-brand-mutedSoft italic">Eklenti bulunmamaktadir.</div>
          ) : (
            <div className="space-y-1.5">
              {plugins.map((p) => (
                <div key={p.name} className="text-[11px] flex items-center justify-between text-brand-textSoft font-mono">
                  <span>{p.name}</span>
                  <span className="text-[10px] text-brand-mutedSoft font-sans">({p.loaded_tools.length} tool)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}