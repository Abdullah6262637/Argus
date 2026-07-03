// Basit fetch wrapper + tum backend endpoint'leri

import type {
  AgentCreate,
  AgentDetail,
  AgentInfo,
  AgentUpdate,
  BulkProviderUpdateRequest,
  BulkProviderUpdateResponse,
  ChatResponse,
  ConnectionTestRequest,
  ConnectionTestResponse,
  ConversationDetail,
  ConversationSummary,
  LogEntry,
  ModelsCatalog,
  PendingApproval,
  ScheduledTask,
  ScheduledTaskCreate,
  SoulDetail,
  SoulInfo} from '@/types';

/**
 * API base URL belirleme onceligi:
 *   1) localStorage['umtalagent_api_base'] (kullanici override)
 *   2) import.meta.env.VITE_API_BASE (build-time env)
 *   3) Default: http://127.0.0.1:8000/api
 *
 * Electron hem dev (http://localhost:5173) hem prod (file://) ortamda calisir;
 * her ikisinde de fetch dogrudan backend'e gider.
 */
function _resolveApiBase(): string {
  try {
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem('argus_api_base')
      : null;
    if (stored && stored.trim()) return stored.trim().replace(/\/$/, '');
  } catch {
    /* ignore - SSR / sandbox */
  }
  const envBase = import.meta.env?.VITE_API_BASE;
  if (envBase && typeof envBase === 'string' && envBase.trim()) {
    return envBase.trim().replace(/\/$/, '');
  }
  return 'http://127.0.0.1:8000/api';
}

export const API_BASE = _resolveApiBase();

/**
 * WebSocket base URL: API_BASE'ten turetilir veya VITE_WS_BASE ile override edilir.
 * `ws://host:port` formatinda doner (path olmadan).
 */
function _resolveWsBase(): string {
  try {
    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem('umtalagent_ws_base')
      : null;
    if (stored && stored.trim()) return stored.trim().replace(/\/$/, '');
  } catch {
    /* ignore */
  }
  const envWs = import.meta.env?.VITE_WS_BASE;
  if (envWs && typeof envWs === 'string' && envWs.trim()) {
    return envWs.trim().replace(/\/$/, '');
  }
  // API_BASE'ten turet: http(s)://host:port/api -> ws(s)://host:port
  return API_BASE.replace(/^http/, 'ws').replace(/\/api$/, '');
}

export const WS_BASE = _resolveWsBase();

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})},
    ...init});
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export const api = {
  // Ajanlar
  listAgents: (): Promise<AgentInfo[]> => http('/agents'),
  getAgent: (id: string): Promise<AgentDetail> => http(`/agents/${id}`),
  reloadAgents: (): Promise<AgentInfo[]> =>
    http('/agents/reload', { method: 'POST' }),
  listAgentConversations: (id: string): Promise<ConversationSummary[]> =>
    http(`/agents/${id}/conversations`),
  createAgent: (payload: AgentCreate): Promise<AgentDetail> =>
    http('/agents', { method: 'POST', body: JSON.stringify(payload) }),
  updateAgent: (id: string, payload: AgentUpdate): Promise<AgentDetail> =>
    http(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteAgent: (id: string): Promise<void> =>
    http(`/agents/${id}`, { method: 'DELETE' }),
  duplicateAgent: (id: string): Promise<AgentDetail> =>
    http(`/agents/${id}/duplicate`, { method: 'POST' }),
  exportAgent: (id: string, includeSecrets = false): Promise<unknown> =>
    http(`/agents/${id}/export?include_secrets=${includeSecrets}`),
  testAgentConnection: (payload: ConnectionTestRequest): Promise<ConnectionTestResponse> =>
    http('/agents/test', { method: 'POST', body: JSON.stringify(payload) }),
  getModelsCatalog: (): Promise<ModelsCatalog> =>
    http('/agents/models'),

  // Sprint A.11: Souls CRUD
  listSouls: (): Promise<SoulInfo[]> => http('/agents/souls'),
  getSoul: (name: string): Promise<SoulDetail> => http(`/agents/souls/${encodeURIComponent(name)}`),
  createSoul: (name: string, content: string, overwrite = false): Promise<SoulInfo> =>
    http('/agents/souls', {
      method: 'POST',
      body: JSON.stringify({ name, content, overwrite })}),
  deleteSoul: (name: string): Promise<void> =>
    http(`/agents/souls/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  // Sprint A.11: Bulk provider update
  bulkUpdateProvider: (payload: BulkProviderUpdateRequest): Promise<BulkProviderUpdateResponse> =>
    http('/agents/bulk-update-provider', { method: 'POST', body: JSON.stringify(payload) }),

  // Sprint F.1: Coordinator route — kullanici mesajini hangi ajana yonlendirmeli?
  coordinatorRoute: (message: string, coordinatorAgentId?: string): Promise<{
    primary: string;
    chain: string[];
    reason: string;
    self_handled: boolean;
  }> =>
    http('/coordinator/route', {
      method: 'POST',
      body: JSON.stringify({ message, coordinator_agent_id: coordinatorAgentId ?? null })}),

  // Sohbet
  sendMessage: (payload: {
    agent_id: string;
    conversation_id?: number | null;
    content: string;
  }): Promise<ChatResponse> =>
    http('/chat', { method: 'POST', body: JSON.stringify(payload) }),
  getConversation: (id: number): Promise<ConversationDetail> =>
    http(`/chat/${id}`),
  deleteConversation: (id: number): Promise<void> =>
    http(`/chat/${id}`, { method: 'DELETE' }),

  // Sprint E.5: Konusma export (Markdown / JSON)
  exportConversationUrl: (id: number, format: 'md' | 'json' = 'md'): string =>
    `${API_BASE}/chat/${id}/export?format=${format}`,
  // Sprint E.5: Mesaj reaksiyonu (👍 / 👎)
  rateMessage: (messageId: number, rating: 'up' | 'down', comment?: string): Promise<unknown> =>
    http(`/chat/messages/${messageId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment: comment ?? null })}),

  // Zamanlanmis gorevler
  listTasks: (): Promise<ScheduledTask[]> => http('/tasks'),
  createTask: (payload: ScheduledTaskCreate): Promise<ScheduledTask> =>
    http('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
  updateTask: (
    id: number,
    payload: Partial<ScheduledTaskCreate>,
  ): Promise<ScheduledTask> =>
    http(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteTask: (id: number): Promise<void> =>
    http(`/tasks/${id}`, { method: 'DELETE' }),
  runTaskNow: (id: number): Promise<ScheduledTask> =>
    http(`/tasks/${id}/run`, { method: 'POST' }),

  // Loglar
  listLogs: (agentId?: string, limit = 100): Promise<LogEntry[]> => {
    const params = new URLSearchParams();
    if (agentId) params.set('agent_id', agentId);
    params.set('limit', String(limit));
    return http(`/logs?${params.toString()}`);
  },

  // Saglik
  health: (): Promise<{ status: string; version: string; agents_loaded: number }> =>
    http('/health'),

  // Sistem
  resetSystem: (): Promise<{ ok: boolean; removed_agents: number; message: string }> =>
    http('/system/reset', { method: 'POST' }),

  // Sistem - .env yonetimi (Sprint A.7 / A.8)
  getEnv: (): Promise<{
    values: Record<string, string | null>;
    masked: Record<string, string | null>;
    has: Record<string, boolean>;
    path: string;
  }> => http('/system/env'),
  updateEnv: (values: Record<string, string | null>): Promise<{
    ok: boolean;
    masked: Record<string, string | null>;
    has: Record<string, boolean>;
  }> => http('/system/env', { method: 'POST', body: JSON.stringify({ values }) }),

  // ============================================================
  // v2: Approvals (FAZ 1.5)
  // ============================================================
  listApprovals: (status?: string): Promise<PendingApproval[]> => {
    const q = status ? `?status=${status}` : '';
    return http(`/approvals${q}`);
  },
  listPendingApprovals: (): Promise<PendingApproval[]> =>
    http('/approvals/pending'),
  approveApproval: (id: number, reason?: string, args?: Record<string, any> | null): Promise<PendingApproval> =>
    http(`/approvals/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || null, decided_by: 'user', arguments: args || null })}),
  rejectApproval: (id: number, reason?: string): Promise<PendingApproval> =>
    http(`/approvals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || null, decided_by: 'user' })}),

  // v2: Workflows (FAZ 4.3 + Sprint A.9 CRUD)
  listWorkflows: (): Promise<string[]> => http('/workflows'),
  getWorkflow: (name: string): Promise<unknown> => http(`/workflows/${name}`),
  getWorkflowRaw: (name: string): Promise<{ name: string; content: string }> =>
    http(`/workflows/${name}/raw`),
  saveWorkflow: (name: string, content: string, overwrite = true): Promise<{
    name: string;
    path: string;
    bytes: number;
  }> =>
    http(`/workflows/${name}`, {
      method: 'PUT',
      body: JSON.stringify({ content, overwrite })}),
  deleteWorkflow: (name: string): Promise<void> =>
    http(`/workflows/${name}`, { method: 'DELETE' }),
  runWorkflow: (name: string, inputs: Record<string, unknown>): Promise<unknown> =>
    http(`/workflows/${name}/run`, {
      method: 'POST',
      body: JSON.stringify({ inputs })}),

  // v2: Voice (FAZ 8.2)
  voiceStatus: (): Promise<{ stt_available: boolean; tts_available: boolean }> =>
    http('/voice/status'),
  voiceTranscribe: async (audio: Blob, language?: string): Promise<{ text: string; language?: string | null }> => {
    const fd = new FormData();
    fd.append('file', audio, 'audio.webm');
    const url = language
      ? `${API_BASE}/voice/transcribe?language=${encodeURIComponent(language)}`
      : `${API_BASE}/voice/transcribe`;
    const res = await fetch(url, { method: 'POST', body: fd });
    if (!res.ok) {
      let detail = `${res.status} ${res.statusText}`;
      try {
        const j = await res.json();
        if (j?.detail) detail = j.detail;
      } catch { /* ignore */ }
      throw new Error(detail);
    }
    return res.json();
  },
  voiceSpeakUrl: (): string => `${API_BASE}/voice/speak`,

  // v3: Memory (Sprint 2.5/2.6)
  memoryStatus: (): Promise<{
    vector_store_available: boolean;
    embedding_provider: string;
    embedding_dim: number;
    knowledge_graph_nodes: number;
    knowledge_graph_edges: number;
  }> => http('/memory/status'),
  memoryStats: (agentId?: string): Promise<{ collection?: string; count?: number; available?: boolean }> => {
    const q = agentId ? `?agent_id=${encodeURIComponent(agentId)}` : '';
    return http(`/memory/stats${q}`);
  },
  memorySearch: (payload: {
    query: string;
    k?: number;
    agent_id?: string | null;
    collection?: string | null;
  }): Promise<{ results: Array<{ id: string; text: string; metadata: Record<string, unknown>; distance: number }>; count: number }> =>
    http('/memory/search', { method: 'POST', body: JSON.stringify(payload) }),
  memoryIngestText: (payload: {
    text: string;
    source?: string;
    agent_id?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<{ ok: boolean; chunks: number; ids: string[]; source: string }> =>
    http('/memory/ingest/text', { method: 'POST', body: JSON.stringify(payload) }),
  memoryIngestFile: async (file: File, agentId?: string): Promise<{
    ok: boolean;
    chunks: number;
    ids: string[];
    filename: string;
    path?: string;
  }> => {
    const fd = new FormData();
    fd.append('file', file);
    if (agentId) fd.append('agent_id', agentId);
    const res = await fetch(`${API_BASE}/memory/ingest/file`, {
      method: 'POST',
      body: fd});
    if (!res.ok) {
      let detail = `${res.status} ${res.statusText}`;
      try {
        const j = await res.json();
        if (j?.detail) detail = j.detail;
      } catch { /* ignore */ }
      throw new Error(detail);
    }
    return res.json();
  },
  memoryGraph: (agentId?: string, limit = 200): Promise<{
    nodes: Array<{ data: Record<string, unknown> }>;
    edges: Array<{ data: Record<string, unknown> }>;
    stats: { node_count: number; edge_count: number };
  }> => {
    const params = new URLSearchParams();
    if (agentId) params.set('agent_id', agentId);
    params.set('limit', String(limit));
    return http(`/memory/graph?${params.toString()}`);
  },

  // Sprint F.2: Skills (learned macros)
  listSkills: async (): Promise<Array<{
    id: number;
    name: string;
    description: string;
    tool_chain: string[];
    success_count: number;
    is_macro: boolean;
    is_active: boolean;
    created_at: string;
  }>> => {
    const response = await http<{ skills: Array<{
      id: number;
      name: string;
      description: string;
      tool_chain: string[];
      success_count: number;
      is_macro: boolean;
      is_active: boolean;
      created_at: string;
    }>; total: number }>('/skills');
    return response.skills;
  },
  getSkill: (id: number): Promise<{
    id: number;
    name: string;
    description: string;
    tool_chain: string[];
    success_count: number;
    is_macro: boolean;
    is_active: boolean;
    created_at: string;
  }> => http(`/skills/${id}`),
  updateSkill: (id: number, payload: { is_active?: boolean }): Promise<{
    id: number;
    name: string;
    description: string;
    tool_chain: string[];
    success_count: number;
    is_macro: boolean;
    is_active: boolean;
    created_at: string;
  }> => http(`/skills/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteSkill: (id: number): Promise<void> =>
    http(`/skills/${id}`, { method: 'DELETE' }),

  // Sprint F.3: MCP Servers
  listMcpServers: (): Promise<{
    servers: Array<{
      name: string;
      enabled: boolean;
      command: string[];
      args?: string[];
      env?: Record<string, string>;
    }>;
  }> => http('/mcp/servers'),
  toggleMcpServer: (name: string, enabled: boolean): Promise<{
    name: string;
    enabled: boolean;
    message: string;
  }> => http(`/mcp/servers/${encodeURIComponent(name)}/toggle`, {
    method: 'POST',
    body: JSON.stringify({ enabled })}),

  listPlugins: (): Promise<Array<{
    name: string;
    loaded_tools: string[];
    ok: boolean;
  }>> => http('/system/plugins'),

  // v2: SSE Stream URL (FAZ 1.4)
  chatStreamUrl: (): string => `${API_BASE}/chat/stream`};