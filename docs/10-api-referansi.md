# 10 — API Referansı

## Genel Bilgiler

| Özellik | Değer |
|---|---|
| Base URL | `http://localhost:8000` |
| Protokol | HTTP/1.1 + WebSocket |
| Format | JSON |
| Streaming | Server-Sent Events (SSE) |
| İnteraktif Docs | `http://localhost:8000/docs` |
| OpenAPI Schema | `http://localhost:8000/openapi.json` |

### Sağlık Kontrolü

```bash
GET /api/health

# Yanıt:
{
  "status": "ok",
  "version": "0.2.0",
  "agents_loaded": 5
}
```

---

## Ajanlar (`/api/agents`)

### Tüm Ajanları Listele

```bash
GET /api/agents

# Yanıt:
[
  {
    "id": "agent-abc123",
    "name": "Geliştirici",
    "role": "Python Developer",
    "description": "...",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

### Ajan Oluştur

```bash
POST /api/agents
Content-Type: application/json

{
  "name": "Araştırmacı",
  "role": "Research Analyst",
  "description": "Web'de derin araştırma yapar",
  "system_prompt": "Sen deneyimli bir araştırmacısın...",
  "provider": "openai",
  "model": "gpt-4o",
  "api_key": "sk-...",       # Opsiyonel, .env kullanılabilir
  "temperature": 0.5,
  "max_tokens": 2048,
  "permissions": {
    "web_search": true,
    "file_read": true,
    "file_write": false,
    "code_execution": false,
    "system_commands": false,
    "ui_automation": false,
    "network_access": true,
    "memory_read": true,
    "memory_write": true,
    "browser_control": true
  }
}
```

### Ajan Detayı

```bash
GET /api/agents/{agent_id}
```

### Ajan Güncelle

```bash
PATCH /api/agents/{agent_id}
Content-Type: application/json

{
  "name": "Yeni İsim",
  "temperature": 0.7
}
```

### Ajan Sil

```bash
DELETE /api/agents/{agent_id}
```

### Ajan Kopyala

```bash
POST /api/agents/{agent_id}/duplicate
```

### LLM Bağlantısını Test Et

```bash
POST /api/agents/test-connection
Content-Type: application/json

{
  "provider": "openai",
  "model": "gpt-4o",
  "api_key": "sk-...",
  "base_url": null,
  "verify_ssl": true
}

# Yanıt:
{
  "success": true,
  "latency_ms": 342,
  "model": "gpt-4o-2024-11-20",
  "sample_response": "Merhaba!"
}
```

### Sağlayıcı Model Listesi

```bash
GET /api/agents/{agent_id}/models

# Yanıt:
{
  "models": [
    {"id": "gpt-4o", "name": "GPT-4o", "context": 128000},
    {"id": "gpt-4o-mini", "name": "GPT-4o mini", "context": 128000}
  ]
}
```

### Toplu Sağlayıcı Güncelleme

```bash
POST /api/agents/bulk-update-provider
Content-Type: application/json

{
  "provider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "api_key": null,
  "agent_ids": [],   # Boş bırakırsa tüm ajanlar
  "skip_ids": ["agent-abc"]  # Güncellenmeyecekler
}
```

---

## Sohbet (`/api/chat`)

### Mesaj Gönder (SSE Streaming)

```bash
POST /api/chat/{agent_id}
Content-Type: application/json

{
  "message": "Python'da async generator nasıl yazılır?",
  "stream": true,
  "files": []
}
```

**SSE Akışı:**
```
data: {"type": "token", "content": "Python"}
data: {"type": "token", "content": "'da"}
data: {"type": "tool_call", "tool": "web_search", "params": {"query": "..."}}
data: {"type": "tool_result", "tool": "web_search", "output": "..."}
data: {"type": "token", "content": "..."}
data: {"type": "done", "message_id": "msg-123"}
```

### Sohbet Geçmişi

```bash
GET /api/chat/{agent_id}/history?limit=50&offset=0

# Yanıt:
{
  "messages": [
    {
      "id": "msg-abc",
      "role": "user",
      "content": "...",
      "created_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "msg-def",
      "role": "assistant",
      "content": "...",
      "tool_calls": [...],
      "created_at": "2025-01-01T00:00:01Z"
    }
  ],
  "total": 150
}
```

### Geçmişi Temizle

```bash
DELETE /api/chat/{agent_id}/history
```

---

## Sistem (`/api/system`)

### Sistem Durumu

```bash
GET /api/system/status

# Yanıt:
{
  "status": "healthy",
  "version": "0.2.0",
  "uptime_seconds": 3600,
  "agents": {
    "total": 5,
    "active": 4,
    "running": 2
  },
  "memory": {
    "total_memories": 150,
    "chroma_collections": 5
  }
}
```

### Kurulum Durumu

```bash
GET /api/system/setup-status

# Yanıt:
{
  "initialized": true,
  "has_agents": true,
  "has_api_keys": true
}
```

### Kurulum Kaydet

```bash
POST /api/system/setup-save
Content-Type: application/json

{
  "api_keys": {
    "OPENAI_API_KEY": "sk-...",
    "ANTHROPIC_API_KEY": "sk-ant-..."
  },
  "theme": "midnight",
  "selected_agents": ["developer", "researcher"]
}
```

### Sistemi Sıfırla

```bash
POST /api/system/reset

# Yanıt:
{"status": "ok", "message": "Sistem sıfırlandı"}
```

⚠️ **Bu işlem geri alınamaz!** Tüm ajanlar, sohbetler ve bellek silinir.

### API Anahtar Durumu

```bash
GET /api/system/env-status

# Yanıt:
{
  "OPENAI_API_KEY": {"set": true, "valid_format": true},
  "ANTHROPIC_API_KEY": {"set": false, "valid_format": null},
  "GEMINI_API_KEY": {"set": false, "valid_format": null}
}
```

### Sistem Tanısı (Doctor)

```bash
GET /api/system/doctor

# Yanıt:
{
  "python": {"version": "3.12.4", "ok": true},
  "database": {"connected": true, "tables": 8},
  "chroma": {"connected": true, "collections": 3},
  "playwright": {"installed": true},
  "disk": {"free_gb": 50.2}
}
```

---

## Bellek (`/api/memory`)

```bash
# Anıları listele
GET /api/memory/{agent_id}?category=python&limit=20

# Anı ekle
POST /api/memory/{agent_id}
Body: {
  "content": "Python async hakkında öğrendiklerim...",
  "category": "python",
  "tags": ["python", "async"]
}

# Anıda arama
POST /api/memory/{agent_id}/search
Body: {"query": "Python async neydi?", "top_k": 5}

# Anı sil
DELETE /api/memory/{memory_id}

# KG görüntüle
GET /api/memory/{agent_id}/knowledge-graph
```

---

## Görevler (`/api/tasks`)

```bash
# Görev listesi
GET /api/tasks

# Görev oluştur
POST /api/tasks
Body: {
  "name": "Günlük Araştırma",
  "agent_id": "agent-123",
  "schedule": "0 9 * * *",
  "message": "Bugünün AI haberlerini araştır"
}

# Görev güncelle
PATCH /api/tasks/{id}

# Görev sil
DELETE /api/tasks/{id}

# Duraklatma / Sürdürme
POST /api/tasks/{id}/pause
POST /api/tasks/{id}/resume
```

---

## İş Akışları (`/api/workflows`)

```bash
# Workflow listele
GET /api/workflows

# Workflow oluştur
POST /api/workflows
Body: {"name": "...", "nodes": [...], "edges": [...]}

# Workflow çalıştır
POST /api/workflows/{id}/run
Body: {"input": "..."}

# Çalıştırma geçmişi
GET /api/workflows/{id}/runs

# Workflow sil
DELETE /api/workflows/{id}
```

---

## Onaylar (`/api/approvals`)

```bash
# Bekleyen onaylar
GET /api/approvals/pending

# Onayla
POST /api/approvals/{id}/approve

# Reddet
POST /api/approvals/{id}/reject
Body: {"reason": "Güvenlik riski"}

# Onay geçmişi
GET /api/approvals/history
```

---

## Loglar (`/api/logs`)

```bash
# Sistem logları
GET /api/logs?level=ERROR&limit=100

# Ajan logları
GET /api/logs?agent_id=agent-123&limit=50

# Denetim logları
GET /api/logs?type=audit
```

---

## MCP (`/api/mcp`)

```bash
# Sunucu listesi
GET /api/mcp/servers

# Sunucu ekle
POST /api/mcp/servers
Body: {"name": "...", "transport": "stdio", "command": "..."}

# Sunucu sil
DELETE /api/mcp/servers/{name}

# Sunucu araçları
GET /api/mcp/servers/{name}/tools

# Yeniden bağlan
POST /api/mcp/servers/{name}/reconnect
```

---

## WebSocket (`/ws`)

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/agent-123');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.type: "status_update" | "tool_call" | "message" | "error"
  console.log(data);
};

// Mesaj gönder
ws.send(JSON.stringify({
  type: "message",
  content: "Merhaba!"
}));
```

### WebSocket Mesaj Türleri

| Tür | Yön | Açıklama |
|---|---|---|
| `status_update` | Server → Client | Ajan durumu değişti |
| `tool_call` | Server → Client | Araç çağrıldı |
| `tool_result` | Server → Client | Araç sonucu geldi |
| `message` | Server → Client | Yeni mesaj |
| `approval_required` | Server → Client | Onay bekleniyor |
| `error` | Server → Client | Hata oluştu |
| `message` | Client → Server | Kullanıcı mesajı |

---

## Ses (`/api/voice`)

```bash
# Metin sentezi
POST /api/voice/synthesize
Body: {
  "text": "Merhaba dünya",
  "voice": "tr-TR-Standard-A",
  "speed": 1.0
}

# Ses dosyası transkripsiyonu
POST /api/voice/transcribe
Content-Type: multipart/form-data
file: audio.wav
```

---

## Koordinatör (`/api/coordinator`)

```bash
# Çoklu ajan görevi oluştur
POST /api/coordinator/task
Body: {
  "description": "Web araştırması yap ve rapor oluştur",
  "agents": ["researcher-id", "writer-id"],
  "strategy": "sequential"   # sequential | parallel | hierarchical
}

# Koordinatör önerisi al
GET /api/coordinator/suggest?task=...
```
