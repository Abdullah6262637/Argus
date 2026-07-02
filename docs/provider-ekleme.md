# 🔌 Yeni LLM Provider Eklemek

UmtalAgent OpenAI ve Anthropic'i native destekler; OpenAI-uyumlu proxy'ler ([OpenRouter](https://openrouter.ai/), [Groq](https://groq.com/), [LM Studio](https://lmstudio.ai/), [Ollama](https://ollama.com/), [frostai.xyz](https://frostai.xyz)) için ayrı kod yazmaya gerek **yok** — sadece `provider: openai` + `base_url` yeterli.

Tamamen farklı bir API protokolü olan provider eklemek için bu rehberi izle.

---

## 1. Mimari

[`backend/app/services/llm/`](../backend/app/services/llm/) altında her provider bir sınıf:

```
llm/
├── base.py             # BaseLLMProvider abstract class
├── factory.py          # get_provider() — ad → class mapping
├── openai_provider.py  # OpenAI + uyumlu proxy
├── anthropic_provider.py
├── gemini_provider.py
├── tester.py           # /api/agents/test endpoint
└── models_catalog.py   # UI dropdown listesi
```

Yeni provider eklemek = yeni `xxx_provider.py` + `factory.py`'a kayıt + `models_catalog.py`'a model listesi.

---

## 2. Adım Adım: Cohere Provider Örneği

### Adım 1 — Provider sınıfı

[`backend/app/services/llm/cohere_provider.py`](../backend/app/services/llm/cohere_provider.py:1):

```python
"""Cohere LLM provider."""
from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from app.services.llm.base import (
    BaseLLMProvider,
    ChatMessage,
    LLMError,
    LLMResponse,
    ToolCall,
)


class CohereProvider(BaseLLMProvider):
    """Cohere API entegrasyonu (https://cohere.com/)."""

    def __init__(
        self,
        model: str,
        *,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
    ) -> None:
        super().__init__(model=model, api_key=api_key, base_url=base_url)
        self._base_url = (base_url or "https://api.cohere.com/v1").rstrip("/")

    @property
    def name(self) -> str:
        return "cohere"

    async def chat(
        self,
        messages: List[ChatMessage],
        *,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> LLMResponse:
        try:
            import httpx  # type: ignore
        except ImportError:
            raise LLMError("httpx paketi yuklu degil")

        # Cohere mesaj formatına çevir
        chat_history = []
        user_message = ""
        for m in messages:
            if m.role == "user":
                user_message = m.content
            elif m.role == "assistant":
                chat_history.append({"role": "CHATBOT", "message": m.content})
            elif m.role == "system":
                # Cohere system prompt'u preamble field'ında
                pass

        preamble = next(
            (m.content for m in messages if m.role == "system"), ""
        )

        body = {
            "model": self.model,
            "message": user_message,
            "chat_history": chat_history,
            "preamble": preamble,
            "temperature": temperature,
            "max_tokens": max_tokens}

        if tools:
            # Cohere tool format dönüşümü (OpenAI'den)
            body["tools"] = [
                {
                    "name": t["function"]["name"],
                    "description": t["function"]["description"],
                    "parameter_definitions": _convert_to_cohere_params(
                        t["function"]["parameters"]
                    )}
                for t in tools
            ]

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"}

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{self._base_url}/chat",
                    headers=headers,
                    json=body,
                )
                if resp.status_code >= 400:
                    raise LLMError(
                        f"Cohere API {resp.status_code}: {resp.text[:300]}"
                    )
                data = resp.json()
        except httpx.TimeoutException:
            raise LLMError("Cohere API zaman asimi")
        except Exception as exc:
            raise LLMError(f"Cohere istek hatasi: {exc}")

        content = data.get("text", "")
        tool_calls: List[ToolCall] = []
        for tc in data.get("tool_calls", []) or []:
            tool_calls.append(
                ToolCall(
                    id=tc.get("name", ""),
                    name=tc.get("name", ""),
                    arguments=tc.get("parameters", {}),
                )
            )

        usage = data.get("meta", {}).get("billed_units", {})
        return LLMResponse(
            content=content,
            tool_calls=tool_calls,
            prompt_tokens=usage.get("input_tokens", 0),
            completion_tokens=usage.get("output_tokens", 0),
            total_tokens=(usage.get("input_tokens", 0) + usage.get("output_tokens", 0)),
            stop_reason=data.get("finish_reason"),
            raw=data,
        )


def _convert_to_cohere_params(json_schema: Dict[str, Any]) -> Dict[str, Any]:
    """OpenAI JSON Schema → Cohere parameter_definitions."""
    out = {}
    for name, schema in (json_schema.get("properties") or {}).items():
        out[name] = {
            "description": schema.get("description", ""),
            "type": schema.get("type", "string"),
            "required": name in (json_schema.get("required") or [])}
    return out
```

### Adım 2 — Factory'ye kaydet

[`backend/app/services/llm/factory.py`](../backend/app/services/llm/factory.py:1):

```python
def get_provider(name: str, model: str, *, api_key=None, base_url=None):
    name = name.lower()
    # ...
    if name == "cohere":
        from app.services.llm.cohere_provider import CohereProvider
        return CohereProvider(model, api_key=api_key, base_url=base_url)
    # ...
```

### Adım 3 — Schema'ya ekle

[`backend/app/schemas/agent.py`](../backend/app/schemas/agent.py:10):

```python
ProviderName = Literal[
    "openai",
    "anthropic",
    # ...
    "cohere",  # ← yeni
]
```

### Adım 4 — Models catalog

[`backend/app/services/llm/models_catalog.py`](../backend/app/services/llm/models_catalog.py:1):

```python
MODELS_BY_PROVIDER = {
    # ...
    "cohere": [
        {"id": "command-r-plus", "label": "Command R+", "description": "Yüksek kalite"},
        {"id": "command-r", "label": "Command R"},
        {"id": "command-light", "label": "Command Light"}]}
```

### Adım 5 — UI dropdown

[`frontend/src/types/index.ts`](../frontend/src/types/index.ts:1):

```typescript
export type ProviderName = 'openai' | 'anthropic' | ... | 'cohere';
```

[`frontend/src/components/AgentForm.tsx`](../frontend/src/components/AgentForm.tsx:1) — `<select>`:

```jsx
<option value="cohere">Cohere</option>
```

### Adım 6 — Test

[`backend/tests/test_cohere_provider.py`](../backend/tests/test_cohere_provider.py:1):

```python
import pytest
from unittest.mock import AsyncMock, patch
from app.services.llm.cohere_provider import CohereProvider
from app.services.llm.base import ChatMessage


@pytest.mark.asyncio
async def test_cohere_chat():
    provider = CohereProvider("command-r", api_key="test-key")
    fake_response = {
        "text": "Merhaba",
        "tool_calls": [],
        "meta": {"billed_units": {"input_tokens": 10, "output_tokens": 5}}}

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value.status_code = 200
        mock_post.return_value.json = lambda: fake_response

        result = await provider.chat([ChatMessage(role="user", content="selam")])

    assert result.content == "Merhaba"
    assert result.total_tokens == 15
```

---

## 3. OpenAI-Uyumlu Provider'lar (Hızlı Yol)

Cohere gibi farklı API yerine, OpenAI-uyumlu provider'lar **kod değişikliği gerektirmez**:

| Provider | base_url | Model örneği |
|---|---|---|
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-3.5-sonnet` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.1-70b-versatile` |
| Together.ai | `https://api.together.xyz/v1` | `meta-llama/Llama-3-70b-chat-hf` |
| LM Studio | `http://localhost:1234/v1` | `local-model` |
| Ollama | `http://localhost:11434/v1` | `llama3.2` |
| frostai.xyz | `https://frostai.xyz/v1` | `claude-opus-4-7` |

UI'da:
- **Saglayici:** OpenAI (ve uyumlu)
- **Base URL:** yukarıdaki tablodan
- **Model:** sağlayıcının desteklediği

veya AgentForm'daki **Proxy Preset** dropdown'undan seç (Sprint A.11.1).

---

## 4. Test Etmek

Yeni provider eklendikten sonra:

1. UI'da: **Yeni Ajan → LLM adımı** → provider'ı seç → **Test Et** butonu
2. Veya endpoint:
```bash
curl -X POST http://127.0.0.1:8000/api/agents/test \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "cohere",
    "model": "command-r",
    "api_key": "co-xxx",
    "base_url": null
  }'
```

Beklenen: `{"ok": true, "latency_ms": 450, "message": "..."}`

---

## 5. İpuçları

- **Tool calling protokolü** her provider'da farklı; `convert_to_*_params()` helper'ı yaz
- **System prompt** position farklı (Cohere `preamble`, Anthropic ayrı parametre)
- **Streaming** support eklemek için `chat_stream()` async generator implementasyonu (next sprint)
- **Token counting** özel hesaplama gerektirebilir (tiktoken vs sentencepiece)

---

## 6. Topluluk Provider'ları

UmtalAgent topluluğa açık. Eklediğin provider'ı PR ile paylaş! [PR şablonu](../.github/PULL_REQUEST_TEMPLATE.md:1)