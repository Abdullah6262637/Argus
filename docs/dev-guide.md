# 🛠️ UmtalAgent — Geliştirici Kılavuzu

> **Sürüm:** v3.0
> **Hedef:** Yeni tool, provider, soul, plugin ekleyen geliştiriciler

---

## 1. Mimari Genel Bakış

```
┌──────────────┐    HTTP/WS/SSE    ┌────────────────┐
│   Frontend   │ ◄────────────────► │    Backend     │
│ React+Vite   │                    │   FastAPI      │
│  +Electron   │                    │   +SQLAlchemy  │
└──────────────┘                    └────────────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              ▼                             ▼                             ▼
        ┌──────────┐                 ┌──────────┐                  ┌──────────┐
        │ Planning │                 │  Tools   │                  │  Memory  │
        │ Executor │                 │ (70+)    │                  │ Vector + │
        │ Reflector│                 │ Registry │                  │ KG       │
        └──────────┘                 └──────────┘                  └──────────┘
              │                             │                             │
              └─────────────────────────────┼─────────────────────────────┘
                                            ▼
                                ┌────────────────────────┐
                                │   LLM Providers        │
                                │  OpenAI, Anthropic,    │
                                │  Gemini, Ollama, Groq, │
                                │  Mistral, xAI, ...     │
                                └────────────────────────┘
```

### Klasör Yapısı

```
backend/
  app/
    main.py              # FastAPI giriş + lifespan
    config.py            # Pydantic settings
    models/              # SQLAlchemy modelleri
    schemas/             # Pydantic API schema'ları
    routers/             # /api/* endpoint'leri
    services/
      agent_loop.py      # ReAct döngü
      chat_service.py    # Plan-aware orkestratör
      planning/          # Planner + Executor + Reflector
      tools/             # 70+ tool implementasyonu
      llm/               # Provider'lar + factory
      memory/            # Vector + KG + auto_summarize
      security/          # Sandbox + RateLimit + Secrets
      observability/     # Trace + JSON logs
  agents/
    agents.yaml          # Tüm ajan tanımları
    souls/               # Markdown soul (system_prompt) dosyaları
    workflows/           # YAML çoklu-ajan akışları

frontend/
  src/
    App.tsx              # Ana shell
    api/client.ts        # Tüm endpoint çağrıları
    hooks/               # useChat, useApprovals, useWebSocket, ...
    components/          # ChatWindow, TaskTimeline, ApprovalDialog, ...
    types/               # Ortak TS tipleri
  electron/
    main.cjs             # Electron main process
```

---

## 2. Yeni Tool Eklemek

### 2.1 Adımlar

**Dosya:** `backend/app/services/tools/your_tool.py`

```python
from app.services.tools.base import BaseTool, ToolContext, ToolResult


class WeatherTool(BaseTool):
    name = "weather"
    description = "Bir şehrin hava durumunu döner."
    permission = "web_search"  # 'none' / 'file_system' / 'terminal_cmd' / 'web_search' / 'system_admin'
    requires_confirmation = False  # True ise HITL onayı istenir
    parameters = {
        "type": "object",
        "properties": {
            "city": {"type": "string", "description": "Şehir adı"},
            "units": {"type": "string", "description": "metric | imperial"}},
        "required": ["city"]}

    async def execute(self, args, context: ToolContext) -> ToolResult:
        city = str(args.get("city") or "")
        if not city:
            return ToolResult(ok=False, error="city zorunlu")
        # ... gerçek hava durumu çağrısı
        return ToolResult(
            ok=True,
            output=f"{city}: 22°C, parçalı bulutlu",
            data={"city": city, "temp": 22}
        )
```

**Kayıt:** [`backend/app/services/tools/registry.py`](../backend/app/services/tools/registry.py:1) içine ekle:

```python
from app.services.tools.your_tool import WeatherTool

# _register_defaults() içinde:
defaults = [
    # ... mevcut
    WeatherTool()]
```

Uygulamayı yeniden başlat, ajanın izinleri uyuyorsa LLM tool'u görür.

### 2.2 İzin Sistemi

| Permission | Kapsam |
|---|---|
| `none` | Herkese açık (örn: `python_exec`) |
| `file_system` | Dosya okuma/yazma |
| `terminal_cmd` | Komut çalıştırma, git |
| `web_search` | İnternet, API, mail |
| `system_admin` | OS yönetimi, DB, tehlikeli |

### 2.3 Plugin Olarak Tool

`plugins/` klasörüne `.py` dosyası bırakırsan **otomatik yüklenir**:

```python
# plugins/my_tool.py
from app.services.tools.base import BaseTool, ToolContext, ToolResult

class HelloTool(BaseTool):
    name = "hello"
    description = "Merhaba der."
    parameters = {"type": "object", "properties": {}, "required": []}

    async def execute(self, args, ctx):
        return ToolResult(ok=True, output=f"Merhaba {ctx.agent_name}!")

TOOLS = [HelloTool]  # plugin loader bunu arar
```

---

## 3. Yeni Provider Eklemek

### 3.1 OpenAI-Compatible Endpoint (En Kolay)

[`backend/app/services/llm/factory.py`](../backend/app/services/llm/factory.py:1) içindeki
`_OPENAI_COMPATIBLE_PROVIDERS` dict'ine ekle:

```python
_OPENAI_COMPATIBLE_PROVIDERS = {
    # ...
    "myprovider": {
        "base_url": "https://api.example.com/v1",
        "env_key": "MYPROVIDER_API_KEY"}}
```

[`backend/app/schemas/agent.py`](../backend/app/schemas/agent.py:1) `ProviderName` Literal'ine ekle.

### 3.2 Tamamen Yeni API (Gemini gibi)

`backend/app/services/llm/myprovider.py` oluştur:

```python
from app.services.llm.base import BaseLLMProvider, ChatMessage, LLMError, LLMResponse, ToolCall


class MyProvider(BaseLLMProvider):
    name = "myprovider"

    def __init__(self, api_key, model="default-model", base_url=None):
        super().__init__(api_key=api_key, model=model)
        if not api_key:
            raise LLMError("MYPROVIDER_API_KEY gerekli")
        # SDK init ...

    async def chat(self, messages, *, temperature, max_tokens, tools=None, **kwargs):
        # 1) ChatMessage[] → provider format
        # 2) HTTP / SDK çağrısı
        # 3) Yanıtı parse et → LLMResponse(content, tool_calls=[...])
        ...
```

`factory.py` içinde `if provider_name == "myprovider":` dalı ekle.

### 3.3 Model Kataloğu

[`backend/app/services/llm/models_catalog.py`](../backend/app/services/llm/models_catalog.py:1) içine
`MYPROVIDER_MODELS: List[ModelInfo]` ekle ve `MODELS_BY_PROVIDER` dict'ine kayıt et.

---

## 4. Yeni Soul (Ajan Şablonu)

`backend/agents/souls/your_role.md` dosyası oluştur:

```markdown
# Your Role — SOUL

Sen [rol açıklaması].

## Yaklaşım
1. ...

## Araçlar
- `tool_a` — ...
- `tool_b` — ...

## Kurallar
- ...
```

`agents.yaml` içine ajanı ekle:

```yaml
agents:
  - id: my_agent
    name: "My Agent"
    role: "Your Role"
    provider: anthropic
    model: claude-sonnet-4-5
    soul_file: souls/your_role.md
    permissions:
      file_system: true
      terminal_cmd: false
      web_search: true
      system_admin: false
```

---

## 5. Yeni Workflow

`backend/agents/workflows/my_flow.yaml`:

```yaml
name: my_flow
description: Açıklama
inputs:
  - input1
  - input2
steps:
  - id: step1
    agent_id: researcher
    prompt: |
      "{{ input1 }}" hakkında bilgi topla.
  - id: step2
    agent_id: writer
    prompt: |
      Şu bilgileri özetle:
      {{ steps.step1.result }}
```

UI'dan ⚡ butonu ile çalıştırılabilir.

---

## 6. Frontend'e Yeni Bileşen

```tsx
// frontend/src/components/MyComponent.tsx
import { useState } from 'react';
import { api } from '@/api/client';

export function MyComponent() {
  const [data, setData] = useState<unknown>(null);
  // ...
  return <div>...</div>;
}
```

[`frontend/src/api/client.ts`](../frontend/src/api/client.ts:1) içinden API çağrılarını ekle:

```ts
export const api = {
  // ...
  myEndpoint: (): Promise<MyType> => http('/my/endpoint')};
```

---

## 7. Test ve CI

```bash
# Backend
cd backend
pytest                  # birim + entegrasyon
ruff check .            # lint
mypy app                # type-check

# Frontend
cd frontend
npm run lint
npm run test            # vitest
npm run build           # tsc + bundle
```

GitHub Actions ile otomatize edilebilir (`.github/workflows/ci.yml`).

---

## 8. Mimari Kararlar (ADR)

| Karar | Sebep |
|---|---|
| FastAPI + SQLAlchemy async | Modern, tip-güvenli, performanslı |
| Plan-driven mod default | Karmaşık görevlerde başarı oranı çok daha yüksek |
| Vector store: ChromaDB | Embed dahili, persistent, basit |
| Embedding: sentence-transformers | Yerel, ücretsiz, hızlı (384-dim) |
| HITL approval default tool listesi | run_command, delete_file, db_execute, kill_process, shutdown, email_send, git_push |
| Audit chain (HMAC-SHA256) | Sonradan değiştirilemez log |
| Electron + Vite | Yerel masaüstü deneyimi + modern frontend stack |

---

## 9. Secrets / API Key Şifreleme

[`backend/app/services/security/secrets.py`](../backend/app/services/security/secrets.py:1) — Fernet
tabanlı çift yönlü şifreleme. Master key OS keyring'de (`umtalagent` servisi)
veya fallback olarak `backend/data/.master_key` (0600) dosyasında saklanır.

```python
from app.services.security import secrets as secret_store

ciphertext = secret_store.encrypt("sk-...")     # "enc::..."
plaintext  = secret_store.decrypt(ciphertext)   # "sk-..."
masked     = secret_store.mask(ciphertext)      # "sk-…AB12"
```

`agent_manager.py` `agents.yaml`'i okurken `decrypt`, yazarken `encrypt`
kullanır. Plain-text key girilirse ilk yüklemede otomatik şifrelenir.

`cryptography` paketi kurulu değilse modül **pass-through** modunda çalışır
(yazılan değer aynen okunur, geriye uyumluluk için).

---

## 10. MCP (Model Context Protocol) Bridge

[`backend/app/services/mcp/bridge.py`](../backend/app/services/mcp/bridge.py:1) — MCP SDK
(`pip install mcp`) ile harici MCP server'ları stdio üzerinden bağlar ve
tool'larını `mcp_<server>_<tool>` adıyla `ToolRegistry`'ye kayıt eder.

Konfigürasyon: [`backend/agents/mcp_servers.yaml`](../backend/agents/mcp_servers.yaml:1)

```yaml
servers:
  - name: filesystem
    enabled: true
    command:
      - npx
      - "-y"
      - "@modelcontextprotocol/server-filesystem"
      - "${HOME}/Documents"
```

Lifecycle (`backend/app/main.py` lifespan'inde):

```python
await mcp_bridge.connect_all()   # startup
# ...
await mcp_bridge.shutdown()      # shutdown
```

Yeni server eklemek için sadece YAML'a entry ekle, kod değişikliği gerekmez.

---

## 11. Sprint Planları

7 sprint planı `plans/` altında. Yol haritası ve öncelikler için
[`plans/genel-analiz-ve-eksikler.md`](../plans/genel-analiz-ve-eksikler.md:1)
"kuzey yıldızı" referansıdır.

| Sprint | Plan | Durum |
|---|---|---|
| A | [`sprint-a-stabilizasyon.md`](../plans/sprint-a-stabilizasyon.md:1) | ✅ Aktif (büyük ölçüde tamamlandı) |
| B | [`sprint-b-test-ci.md`](../plans/sprint-b-test-ci.md:1) | ⏳ Sıradaki |
| C | [`sprint-c-paketleme.md`](../plans/sprint-c-paketleme.md:1) | ⏳ |
| D | [`sprint-d-tool-genisleme.md`](../plans/sprint-d-tool-genisleme.md:1) | ⏳ |
| E | [`sprint-e-ux-iyilesme.md`](../plans/sprint-e-ux-iyilesme.md:1) | ⏳ |
| F | [`sprint-f-koordinator-skill.md`](../plans/sprint-f-koordinator-skill.md:1) | ⏳ |
| G | [`sprint-g-dokuman-demo.md`](../plans/sprint-g-dokuman-demo.md:1) | ⏳ |

---

## 12. Katkı Kontrol Listesi

- [ ] Yeni tool için izin (permission) doğru mu?
- [ ] Riskli tool'ta `requires_confirmation=True` set edildi mi?
- [ ] `parameters` JSON Schema valid mi?
- [ ] Test eklendi mi?
- [ ] [`docs/user-guide.md`](user-guide.md) güncellendi mi?
- [ ] CHANGELOG'a not düşüldü mü?
- [ ] Hassas anahtar yanlışlıkla commit edilmedi mi?
- [ ] CI yeşil mi (lint + type-check + test)?