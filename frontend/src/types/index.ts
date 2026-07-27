// UmtalAgent frontend - ortak TypeScript tipleri

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type ProviderName =
  | 'openai'
  | 'anthropic'
  | 'local'
  | 'gemini'
  | 'googleaistudio'
  | 'ollama'
  | 'groq'
  | 'mistral'
  | 'deepseek'
  | 'xai'
  | 'openrouter'
  | 'sambanova'
  | 'cerebras'
  | 'fireworks'
  | 'together';

// Sprint A.11: Soul (system_prompt) dosyalari
export interface SoulInfo {
  name: string;
  filename: string;
  preview: string;
  size: number;
  is_system: boolean;
}

export interface SoulDetail extends SoulInfo {
  content: string;
}

// Sprint A.11: Bulk provider update
export interface BulkProviderUpdateRequest {
  provider: ProviderName;
  base_url?: string | null;
  model?: string | null;
  agent_ids?: string[] | null;
  skip_ids?: string[];
}

export interface BulkProviderUpdateResponse {
  updated: number;
  skipped: number;
  agent_ids: string[];
}

export interface MediaCapabilityInput {
  enabled: boolean;
  provider?: string | null;
  model?: string | null;
  base_url?: string | null;
  api_key?: string | null;
}

export interface MediaCapabilityOut {
  enabled: boolean;
  provider?: string | null;
  model?: string | null;
  base_url?: string | null;
  api_key_masked?: string | null;
  has_api_key: boolean;
}

export interface AgentPermissions {
  file_system: boolean;
  terminal_cmd: boolean;
  web_search: boolean;
  system_admin: boolean;
}

export interface AgentInfo {
  id: string;
  name: string;
  role: string;
  provider: string;
  model: string;
  description?: string | null;
  is_active: boolean;
  tags: string[];
  has_api_key: boolean;
  has_base_url: boolean;
  media_image?: boolean;
  media_video?: boolean;
  media_audio?: boolean;
  permissions?: AgentPermissions;
}

export interface AgentDetail extends AgentInfo {
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  base_url?: string | null;
  api_key_masked?: string | null;
  image: MediaCapabilityOut;
  video: MediaCapabilityOut;
  audio: MediaCapabilityOut;
  permissions: AgentPermissions;
}

export interface AgentCreate {
  name: string;
  role?: string;
  description?: string;
  provider: ProviderName;
  model: string;
  system_prompt?: string;
  base_url: string | null;
  api_key: string | null;
  clear_api_key?: boolean;
  temperature: number;
  max_tokens?: number;
  tags?: string[];
  is_active?: boolean;
  image?: MediaCapabilityInput | null;
  video?: MediaCapabilityInput | null;
  audio?: MediaCapabilityInput | null;
  permissions?: AgentPermissions | null;
}

export type AgentUpdate = Partial<AgentCreate>;

export interface ConnectionTestRequest {
  provider: ProviderName;
  model: string;
  api_key?: string | null;
  base_url?: string | null;
  agent_id?: string | null;
  verify_ssl?: boolean | null;
}

export interface ConnectionTestResponse {
  ok: boolean;
  provider: string;
  model: string;
  latency_ms: number;
  message: string;
  sample_response?: string | null;
}

export interface ModelInfoOut {
  id: string;
  label: string;
  description?: string | null;
}

export interface ModelsCatalog {
  openai: ModelInfoOut[];
  anthropic: ModelInfoOut[];
  local: ModelInfoOut[];
}

export interface ToolCallInfo {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  ok: boolean;
  output: string;
  error?: string | null;
  data?: Record<string, unknown>;
  duration_ms: number;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: MessageRole | string;
  content: string;
  tokens?: number | null;
  provider?: string | null;
  model?: string | null;
  created_at: string;
  // Frontend-only: agent loop sirasinda yapilan tool cagrilari (assistant mesajlarina iliskilendirilir)
  tool_calls?: ToolCallInfo[];
}

export interface ConversationSummary {
  id: number;
  agent_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count?: number | null;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ChatMessage[];
}

export interface ChatResponse {
  conversation_id: number;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
  tool_calls: ToolCallInfo[];
  steps: number;
}

export interface ScheduledTask {
  id: number;
  agent_id: string;
  name: string;
  cron_expr: string;
  prompt: string;
  enabled: boolean;
  last_run_at?: string | null;
  last_result?: string | null;
  created_at: string;
}

export interface ScheduledTaskCreate {
  agent_id: string;
  name: string;
  cron_expr: string;
  prompt: string;
  enabled?: boolean;
}

export interface LogEntry {
  id: number;
  agent_id?: string | null;
  level: string;
  event: string;
  payload_json?: string | null;
  created_at: string;
}

// ============================================================
// v2: Plan / Step / Approval (FAZ 1)
// ============================================================

export type StepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'awaiting_approval';

export type PlanStatus = 'draft' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface PlanStep {
  id: number;
  title: string;
  description: string;
  expected_output?: string;
  tool_hints?: string[];
  status: StepStatus;
  result?: string;
  tool_calls?: ToolCallInfo[];
  attempts?: number;
  error?: string | null;
  reflection?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface Plan {
  id: string;
  goal: string;
  agent_id: string;
  conversation_id?: number | null;
  status: PlanStatus;
  steps: PlanStep[];
  created_at?: string | null;
  completed_at?: string | null;
  final_summary?: string;
  error?: string | null;
  metadata?: Record<string, unknown>;
}

export interface PendingApproval {
  id: number;
  agent_id: string;
  conversation_id?: number | null;
  plan_id?: string | null;
  step_id?: number | null;
  tool_name: string;
  arguments: Record<string, unknown>;
  risk_level: string;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  reason?: string | null;
  decided_by?: string | null;
  created_at: string;
  decided_at?: string | null;
}

// WebSocket mesaj tipleri
export type WSMessage =
  | { type: 'hello'; message: string }
  | { type: 'pong' }
  | { type: 'ack'; echo: string }
  | {
      type: 'message';
      conversation_id: number;
      agent_id: string;
      user: ChatMessage;
      assistant: ChatMessage;
      tool_calls?: ToolCallInfo[];
      steps?: number;
    }
  | {
      type: 'tool_call_started';
      conversation_id: number;
      agent_id: string;
      id: string;
      name: string;
      arguments: Record<string, unknown>;
      step: number;
      plan_id?: string;
      step_id?: number;
    }
  | {
      type: 'tool_call_completed';
      conversation_id: number;
      agent_id: string;
      id: string;
      name: string;
      arguments: Record<string, unknown>;
      ok: boolean;
      output: string;
      error?: string | null;
      data?: Record<string, unknown>;
      duration_ms: number;
      step: number;
      plan_id?: string;
      step_id?: number;
    }
  | {
      type: 'task_executed';
      task_id: number;
      agent_id: string;
      name: string;
      at: string;
    }
  | { type: 'plan_created'; conversation_id: number; agent_id: string; plan: Plan }
  | { type: 'plan_started'; conversation_id: number; agent_id: string; plan: Plan }
  | { type: 'plan_completed'; conversation_id: number; agent_id: string; plan: Plan; final_summary: string }
  | { type: 'plan_failed'; conversation_id: number; agent_id: string; plan: Plan }
  | { type: 'plan_replanned'; conversation_id: number; plan_id: string; new_steps: PlanStep[] }
  | { type: 'step_started'; conversation_id: number; plan_id: string; step: PlanStep }
  | { type: 'step_completed'; conversation_id: number; plan_id: string; step: PlanStep }
  | { type: 'step_failed'; conversation_id: number; plan_id: string; step: PlanStep; error?: string }
  | { type: 'step_retry'; conversation_id: number; plan_id: string; step_id: number; attempt: number }
  | {
      type: 'reflection';
      conversation_id: number;
      plan_id: string;
      step_id: number;
      verdict: string;
      reason: string;
      suggested_fix?: string;
    }
  | {
      type: 'approval_required';
      approval_id: number;
      agent_id: string;
      conversation_id?: number | null;
      tool_name: string;
      arguments: Record<string, unknown>;
      risk_level: string;
      plan_id?: string | null;
      step_id?: number | null;
    }
  | {
      type: 'approval_decided';
      approval_id: number;
      status: 'approved' | 'rejected' | 'timeout';
      reason?: string | null;
    }
  | {
      type: 'workflow_step_status';
      workflow_name: string;
      step_id: string;
      status: 'skipped' | 'running' | 'success' | 'failed';
      agent_id: string;
      prompt?: string;
      result?: string;
      error?: string | null;
    }
  | {
      type: 'agent_delegation';
      source_agent: string;
      target_agent: string;
      prompt?: string;
      status: 'started' | 'success' | 'failed';
      result?: string;
      error?: string;
    }
  | {
      type: 'agent_validation';
      target_agent: string;
      attempt: number;
      passed: boolean;
      feedback?: string;
    }
  | {
      type: 'blackboard_update';
      key: string;
      value: string;
      keys: string[];
    };