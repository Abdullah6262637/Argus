// Basit fetch wrapper + tum backend endpoint'leri
/**
 * API base URL belirleme onceligi:
 *   1) localStorage['umtalagent_api_base'] (kullanici override)
 *   2) import.meta.env.VITE_API_BASE (build-time env)
 *   3) Default: http://127.0.0.1:8000/api
 *
 * Electron hem dev (http://localhost:5173) hem prod (file://) ortamda calisir;
 * her ikisinde de fetch dogrudan backend'e gider.
 */
function _resolveApiBase() {
    try {
        const stored = typeof localStorage !== 'undefined'
            ? localStorage.getItem('argus_api_base')
            : null;
        if (stored && stored.trim())
            return stored.trim().replace(/\/$/, '');
    }
    catch {
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
function _resolveWsBase() {
    try {
        const stored = typeof localStorage !== 'undefined'
            ? (localStorage.getItem('argus_ws_base') || localStorage.getItem('umtalagent_ws_base'))
            : null;
        if (stored && stored.trim())
            return stored.trim().replace(/\/$/, '');
    }
    catch {
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
async function http(path, init) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {})
        },
        ...init
    });
    if (!res.ok) {
        let detail = `${res.status} ${res.statusText}`;
        try {
            const data = await res.json();
            if (data?.detail)
                detail = data.detail;
        }
        catch {
            /* ignore */
        }
        throw new Error(detail);
    }
    if (res.status === 204)
        return undefined;
    return (await res.json());
}
export const api = {
    // Ajanlar
    listAgents: (includeInactive = false) => http('/agents' + (includeInactive ? '?include_inactive=true' : '')),
    getAgent: (id) => http(`/agents/${id}`),
    reloadAgents: () => http('/agents/reload', { method: 'POST' }),
    listAgentConversations: (id) => http(`/agents/${id}/conversations`),
    createAgent: (payload) => http('/agents', { method: 'POST', body: JSON.stringify(payload) }),
    updateAgent: (id, payload) => http(`/agents/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    deleteAgent: (id) => http(`/agents/${id}`, { method: 'DELETE' }),
    duplicateAgent: (id) => http(`/agents/${id}/duplicate`, { method: 'POST' }),
    exportAgent: (id, includeSecrets = false) => http(`/agents/${id}/export?include_secrets=${includeSecrets}`),
    testAgentConnection: (payload) => http('/agents/test', { method: 'POST', body: JSON.stringify(payload) }),
    getModelsCatalog: () => http('/agents/models'),
    // Sprint A.11: Souls CRUD
    listSouls: () => http('/agents/souls'),
    getSoul: (name) => http(`/agents/souls/${encodeURIComponent(name)}`),
    createSoul: (name, content, overwrite = false) => http('/agents/souls', {
        method: 'POST',
        body: JSON.stringify({ name, content, overwrite })
    }),
    deleteSoul: (name) => http(`/agents/souls/${encodeURIComponent(name)}`, { method: 'DELETE' }),
    // Sprint A.11: Bulk provider update
    bulkUpdateProvider: (payload) => http('/agents/bulk-update-provider', { method: 'POST', body: JSON.stringify(payload) }),
    // Sprint F.1: Coordinator route — kullanici mesajini hangi ajana yonlendirmeli?
    coordinatorRoute: (message, coordinatorAgentId) => http('/coordinator/route', {
        method: 'POST',
        body: JSON.stringify({ message, coordinator_agent_id: coordinatorAgentId ?? null })
    }),
    // Sohbet
    sendMessage: (payload) => http('/chat', { method: 'POST', body: JSON.stringify(payload) }),
    getConversation: (id) => http(`/chat/${id}`),
    deleteConversation: (id) => http(`/chat/${id}`, { method: 'DELETE' }),
    // Sprint E.5: Konusma export (Markdown / JSON)
    exportConversationUrl: (id, format = 'md') => `${API_BASE}/chat/${id}/export?format=${format}`,
    // Sprint E.5: Mesaj reaksiyonu (👍 / 👎)
    rateMessage: (messageId, rating, comment) => http(`/chat/messages/${messageId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment: comment ?? null })
    }),
    // Zamanlanmis gorevler
    listTasks: () => http('/tasks'),
    createTask: (payload) => http('/tasks', { method: 'POST', body: JSON.stringify(payload) }),
    updateTask: (id, payload) => http(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    deleteTask: (id) => http(`/tasks/${id}`, { method: 'DELETE' }),
    runTaskNow: (id) => http(`/tasks/${id}/run`, { method: 'POST' }),
    // Loglar
    listLogs: (agentId, limit = 100) => {
        const params = new URLSearchParams();
        if (agentId)
            params.set('agent_id', agentId);
        params.set('limit', String(limit));
        return http(`/logs?${params.toString()}`);
    },
    // Saglik
    health: () => http('/health'),
    // Sistem
    resetSystem: () => http('/system/reset', { method: 'POST' }),
    // Sistem - .env yonetimi (Sprint A.7 / A.8)
    getEnv: () => http('/system/env'),
    updateEnv: (values) => http('/system/env', { method: 'POST', body: JSON.stringify({ values }) }),
    // Setup Wizard
    getSetupStatus: () => http('/system/setup-status'),
    saveSetupSettings: (payload) => http('/system/setup-save', { method: 'POST', body: JSON.stringify(payload) }),
    getDoctorCheck: () => http('/system/doctor'),
    // ============================================================
    // v2: Approvals (FAZ 1.5)
    // ============================================================
    listApprovals: (status) => {
        const q = status ? `?status=${status}` : '';
        return http(`/approvals${q}`);
    },
    listPendingApprovals: () => http('/approvals/pending'),
    approveApproval: (id, reason, args) => http(`/approvals/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || null, decided_by: 'user', arguments: args || null })
    }),
    rejectApproval: (id, reason) => http(`/approvals/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || null, decided_by: 'user' })
    }),
    // v2: Workflows (FAZ 4.3 + Sprint A.9 CRUD)
    listWorkflows: () => http('/workflows'),
    getWorkflow: (name) => http(`/workflows/${name}`),
    getWorkflowRaw: (name) => http(`/workflows/${name}/raw`),
    saveWorkflow: (name, content, overwrite = true) => http(`/workflows/${name}`, {
        method: 'PUT',
        body: JSON.stringify({ content, overwrite })
    }),
    deleteWorkflow: (name) => http(`/workflows/${name}`, { method: 'DELETE' }),
    runWorkflow: (name, inputs) => http(`/workflows/${name}/run`, {
        method: 'POST',
        body: JSON.stringify({ inputs })
    }),
    // v2: Voice (FAZ 8.2)
    voiceStatus: () => http('/voice/status'),
    voiceTranscribe: async (audio, language) => {
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
                if (j?.detail)
                    detail = j.detail;
            }
            catch { /* ignore */ }
            throw new Error(detail);
        }
        return res.json();
    },
    voiceSpeakUrl: () => `${API_BASE}/voice/speak`,
    // v3: Memory (Sprint 2.5/2.6)
    memoryStatus: () => http('/memory/status'),
    memoryStats: (agentId) => {
        const q = agentId ? `?agent_id=${encodeURIComponent(agentId)}` : '';
        return http(`/memory/stats${q}`);
    },
    memorySearch: (payload) => http('/memory/search', { method: 'POST', body: JSON.stringify(payload) }),
    memoryIngestText: (payload) => http('/memory/ingest/text', { method: 'POST', body: JSON.stringify(payload) }),
    memoryIngestFile: async (file, agentId) => {
        const fd = new FormData();
        fd.append('file', file);
        if (agentId)
            fd.append('agent_id', agentId);
        const res = await fetch(`${API_BASE}/memory/ingest/file`, {
            method: 'POST',
            body: fd
        });
        if (!res.ok) {
            let detail = `${res.status} ${res.statusText}`;
            try {
                const j = await res.json();
                if (j?.detail)
                    detail = j.detail;
            }
            catch { /* ignore */ }
            throw new Error(detail);
        }
        return res.json();
    },
    memoryGraph: (agentId, limit = 200) => {
        const params = new URLSearchParams();
        if (agentId)
            params.set('agent_id', agentId);
        params.set('limit', String(limit));
        return http(`/memory/graph?${params.toString()}`);
    },
    // Sprint F.2: Skills (learned macros)
    listSkills: async () => {
        const response = await http('/skills');
        return response.skills;
    },
    getSkill: (id) => http(`/skills/${id}`),
    updateSkill: (id, payload) => http(`/skills/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    deleteSkill: (id) => http(`/skills/${id}`, { method: 'DELETE' }),
    // Sprint F.3: MCP Servers
    listMcpServers: () => http('/mcp/servers'),
    toggleMcpServer: (name, enabled) => http(`/mcp/servers/${encodeURIComponent(name)}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled })
    }),
    listPlugins: () => http('/system/plugins'),
    // v2: SSE Stream URL (FAZ 1.4)
    chatStreamUrl: () => `${API_BASE}/chat/stream`
};
