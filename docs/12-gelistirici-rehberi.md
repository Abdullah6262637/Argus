# 12 — Geliştirici Rehberi

## Geliştirme Ortamı Kurulumu

```bash
git clone https://github.com/Abdullah6262637/Argus.git
cd Argus

# Backend
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt
pip install -r requirements-dev.txt  # Test bağımlılıkları

# Frontend
cd ../frontend
npm install
```

### Geliştirme Modunda Çalıştırma

```bash
# Backend (hot-reload ile)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (HMR ile)
npm run dev
```

---

## Kod Stili

### Python

- **Formatter:** Black
- **Linter:** Ruff
- **Type checker:** mypy (opsiyonel)
- **Import sırası:** isort

```bash
# Tüm Python kodunu formatla
black backend/
ruff check backend/ --fix

# Pre-commit hooks kurulumu
pre-commit install
```

### TypeScript/React

- **Formatter:** Prettier
- **Linter:** ESLint
- **Type checker:** tsc

```bash
# Frontend
npm run lint
npm run format
npx tsc --noEmit  # Tip kontrolü
```

---

## Test

### Backend Testleri

```bash
cd backend
pytest tests/ -v

# Belirli test dosyası
pytest tests/test_agents.py -v

# Coverage raporu
pytest tests/ --cov=app --cov-report=html
open htmlcov/index.html
```

### Frontend Testleri

```bash
cd frontend
npm test

# Watch modunda
npm test -- --watch

# Belirli dosya
npm test -- --testPathPattern=Icon
```

---

## Yeni Araç Yazma

### 1. Dosya Oluşturma

```bash
# backend/app/services/tools/my_tools.py
```

### 2. BaseTool'u Extend Edin

```python
from __future__ import annotations
from typing import Any
from app.services.tools.base import BaseTool, PermissionKey, ToolContext, ToolResult


class MyCalculatorTool(BaseTool):
    """Matematiksel hesaplama aracı."""

    name = "my_calculator"
    description = (
        "İki sayıyı toplar ve sonucu döner. "
        "Örnek: my_calculator(a=5, b=3) → {'result': 8}"
    )
    permission_key = PermissionKey.CODE_EXECUTION  # Hangi izin gerekli

    async def run(
        self,
        ctx: ToolContext,
        a: float,
        b: float,
        operation: str = "add",
    ) -> ToolResult:
        """
        Args:
            ctx: Araç bağlamı (ajan ID, trace ID, vb.)
            a: Birinci sayı
            b: İkinci sayı
            operation: İşlem türü (add, subtract, multiply, divide)
        """
        operations = {
            "add":      a + b,
            "subtract": a - b,
            "multiply": a * b,
            "divide":   a / b if b != 0 else None,
        }

        result = operations.get(operation)
        if result is None:
            return ToolResult(
                output="Sıfıra bölme hatası",
                error=True,
            )

        return ToolResult(
            output={"result": result, "operation": operation},
        )
```

### 3. Registry'e Ekleyin

```python
# backend/app/services/tools/registry.py

from app.services.tools.my_tools import MyCalculatorTool

# _all_tools listesine ekle:
_all_tools: list[BaseTool] = [
    # ... mevcut araçlar ...
    MyCalculatorTool(),
]
```

### 4. İzin Anahtarı Seçimi

```python
class PermissionKey(str, Enum):
    WEB_SEARCH      = "web_search"
    FILE_READ       = "file_read"
    FILE_WRITE      = "file_write"
    CODE_EXECUTION  = "code_execution"
    SYSTEM_COMMANDS = "system_commands"
    UI_AUTOMATION   = "ui_automation"
    NETWORK_ACCESS  = "network_access"
    MEMORY_READ     = "memory_read"
    MEMORY_WRITE    = "memory_write"
    BROWSER_CONTROL = "browser_control"
    NONE            = "none"  # İzin gerektirmeyen araçlar
```

### 5. ToolResult Formatları

```python
# Başarılı string çıktı
return ToolResult(output="Dosya okundu: içerik burada")

# Başarılı dict çıktı
return ToolResult(output={"status": "ok", "files": ["a.txt", "b.txt"]})

# Hata
return ToolResult(output="Dosya bulunamadı", error=True)

# Metadata ile
return ToolResult(
    output="Sonuç",
    metadata={"execution_time_ms": 42, "source": "filesystem"}
)
```

---

## Yeni LLM Sağlayıcı Ekleme

### 1. Provider Dosyası

```python
# backend/app/services/llm/myprovider_provider.py

from app.services.llm.base import BaseLLMProvider, LLMResponse


class MyProviderProvider(BaseLLMProvider):
    """MyProvider LLM sağlayıcısı."""

    provider_name = "myprovider"

    def __init__(self, api_key: str, base_url: str | None = None, **kwargs):
        super().__init__(api_key=api_key, base_url=base_url, **kwargs)
        # İstemci başlatma (httpx, openai kütüphanesi vb.)
        self.client = MyProviderSDK(api_key=api_key)

    async def chat(
        self,
        messages: list[dict],
        model: str,
        tools: list[dict] | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        stream: bool = False,
    ) -> LLMResponse:
        response = await self.client.complete(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return LLMResponse(
            content=response.text,
            model=response.model,
            usage={"prompt_tokens": 100, "completion_tokens": 50},
        )

    async def close(self) -> None:
        await self.client.close()
```

### 2. Factory'e Ekle

```python
# backend/app/services/llm/factory.py

from app.services.llm.myprovider_provider import MyProviderProvider

def get_provider(provider: str, api_key: str, **kwargs) -> BaseLLMProvider:
    providers = {
        "openai":      lambda: OpenAIProvider(api_key=api_key, **kwargs),
        "anthropic":   lambda: AnthropicProvider(api_key=api_key, **kwargs),
        # ...
        "myprovider":  lambda: MyProviderProvider(api_key=api_key, **kwargs),
    }
    factory = providers.get(provider)
    if not factory:
        raise ValueError(f"Bilinmeyen sağlayıcı: {provider}")
    return factory()
```

### 3. Model Kataloğuna Ekle

```python
# backend/app/services/llm/models_catalog.py

MODELS = {
    # ...
    "myprovider": [
        {"id": "mymodel-large", "name": "MyModel Large", "context": 32000},
        {"id": "mymodel-fast",  "name": "MyModel Fast",  "context": 8000},
    ],
}
```

### 4. Frontend'e Ekle

```typescript
// frontend/src/components/AgentForm/Step2LLM.tsx

const PROVIDERS = [
  // ...
  { id: 'myprovider', name: 'MyProvider', logo: '/providers/myprovider.png' },
];
```

---

## Frontend Bileşeni Ekleme

### 1. Bileşen Dosyası

```tsx
// frontend/src/components/MyComponent.tsx

import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onAction: (value: string) => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [value, setValue] = useState('');

  return (
    <div className="bg-brand-panel border border-brand-border rounded-xl p-4">
      <h2 className="text-brand-text font-semibold">{title}</h2>
      <input
        className="w-full bg-brand-input border border-brand-border rounded-lg
                   px-3 py-2 text-brand-text focus:outline-none
                   focus:border-brand-accent transition-colors"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Bir değer girin..."
      />
      <button
        onClick={() => onAction(value)}
        className="bg-brand-accent text-brand-bg rounded-lg px-4 py-2
                   hover:opacity-90 transition-opacity"
      >
        Gönder
      </button>
    </div>
  );
}
```

### 2. CSS Değişkenleri

Tüm renkler CSS custom property olarak tanımlıdır (`variables.css`):

```css
/* Temel renkler */
--brand-bg          /* Ana arka plan */
--brand-panel       /* Panel arka planı */
--brand-panelAlt    /* Alternatif panel */
--brand-border      /* Kenar rengi */
--brand-text        /* Ana metin */
--brand-mutedSoft   /* Soluk metin */
--brand-accent      /* Vurgu rengi */
--brand-success     /* Başarı (yeşil) */
--brand-danger      /* Tehlike (kırmızı) */
--brand-warning     /* Uyarı (sarı) */
--brand-input       /* Input arka planı */
```

---

## API İstemcisi Kullanımı

```typescript
// frontend/src/api/client.ts

import { api } from '../api/client';

// Ajan listesi
const agents = await api.getAgents();

// Mesaj gönder (SSE)
const stream = api.sendMessage(agentId, "Merhaba!");
for await (const chunk of stream) {
  console.log(chunk.content);
}

// Ajan oluştur
const newAgent = await api.createAgent({
  name: "Benim Ajanım",
  provider: "openai",
  model: "gpt-4o-mini",
  // ...
});
```

---

## Pre-commit Hooks

`.pre-commit-config.yaml` dosyası şu kontrolleri çalıştırır:

```yaml
repos:
  - repo: https://github.com/psf/black
    hooks: [black]
  - repo: https://github.com/astral-sh/ruff-pre-commit
    hooks: [ruff]
  - repo: local
    hooks:
      - id: frontend-typecheck
        name: TypeScript Check
        entry: bash -c "cd frontend && npx tsc --noEmit"
```

```bash
# Tüm dosyalara elle çalıştır
pre-commit run --all-files

# Belirli hook
pre-commit run black --all-files
```

---

## Veritabanı Şeması

```sql
-- Ajanlar
CREATE TABLE agents (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    role        TEXT,
    description TEXT,
    system_prompt TEXT,
    provider    TEXT,
    model       TEXT,
    api_key     TEXT,
    temperature REAL DEFAULT 0.5,
    max_tokens  INTEGER DEFAULT 2048,
    permissions JSON,
    is_active   BOOLEAN DEFAULT 1,
    created_at  DATETIME,
    updated_at  DATETIME
);

-- Mesajlar
CREATE TABLE messages (
    id          TEXT PRIMARY KEY,
    agent_id    TEXT REFERENCES agents(id),
    role        TEXT,           -- user | assistant | tool
    content     TEXT,
    tool_calls  JSON,
    created_at  DATETIME
);

-- Görevler (Zamanlanmış)
CREATE TABLE tasks (
    id          TEXT PRIMARY KEY,
    name        TEXT,
    agent_id    TEXT,
    schedule    TEXT,           -- Cron expression
    message     TEXT,
    is_active   BOOLEAN,
    last_run    DATETIME,
    next_run    DATETIME
);

-- İş Akışları
CREATE TABLE workflows (
    id          TEXT PRIMARY KEY,
    name        TEXT,
    nodes       JSON,
    edges       JSON,
    created_at  DATETIME
);

-- Onaylar
CREATE TABLE approvals (
    id          TEXT PRIMARY KEY,
    agent_id    TEXT,
    tool_name   TEXT,
    params      JSON,
    status      TEXT,  -- pending | approved | rejected
    created_at  DATETIME,
    resolved_at DATETIME
);
```

---

## Katkı Süreci

1. **Fork** edin
2. **Branch** oluşturun: `git checkout -b feature/amazing-feature`
3. Değişikliklerinizi yapın
4. Testleri çalıştırın: `pytest tests/ && npm test`
5. **Commit:** `git commit -m "feat: amazing feature"`
6. **Push:** `git push origin feature/amazing-feature`
7. **Pull Request** açın

### Commit Mesajı Formatı

```
feat: yeni özellik ekle
fix: hata düzelt
docs: dokümantasyon güncelle
style: kod formatı düzelt (anlam değişikliği yok)
refactor: kod yeniden yapılandır
test: test ekle/güncelle
chore: bakım işlemi
```

---

## Sürüm Geçmişi

| Sürüm | Değişiklikler |
|---|---|
| 0.2.0 | MCP entegrasyonu, Workflow editörü, Voice desteği, Knowledge Graph |
| 0.1.5 | Vektör belleği (ChromaDB), Planlama motoru, Onay mekanizması |
| 0.1.0 | Temel çoklu ajan sistemi, SSE streaming, Tool registry |
