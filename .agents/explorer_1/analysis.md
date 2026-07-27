# Deep-Dive Analysis of Backend LLM Provider Architecture

## Executive Summary
This report analyzes the backend LLM provider architecture in `backend/app/services/llm/` for the Argus core security refactor project. It evaluates how LLM providers are structured, registered, dynamically instantiated, and tested, and identifies exact required changes to complete support for four high-throughput ultra-fast LLM providers: **SambaNova**, **Cerebras**, **Fireworks AI**, and **Together AI**.

---

## 1. Structure and Registration in `models_catalog.py`

### File Location
`backend/app/services/llm/models_catalog.py`

### Mechanism
- Provider models are registered as lists of `ModelInfo` (`TypedDict` with fields `id: str`, `label: str`, `description: Optional[str]`).
- Catalog mappings:
  - `SAMBANOVA_MODELS` (lines 129-134): Meta Llama 3.3 70B, Meta Llama 3.1 405B, 70B, 8B, DeepSeek R1.
  - `CEREBRAS_MODELS` (lines 136-138): Llama 3.3 70B (2000+ t/s), Llama 3.1 8B (2200+ t/s).
  - `FIREWORKS_MODELS` (lines 140-143): Llama 3.3 70B Instruct, DeepSeek R1, DeepSeek V3.
  - `TOGETHER_MODELS` (lines 145-148): Llama 3.3 70B Turbo, DeepSeek R1, DeepSeek V3.
- `MODELS_BY_PROVIDER` dictionary (lines 151-165) maps string provider keys (`"sambanova"`, `"cerebras"`, `"fireworks"`, `"together"`, `"openai"`, `"anthropic"`, `"gemini"`, `"googleaistudio"`, `"ollama"`, `"groq"`, `"mistral"`, `"deepseek"`, `"xai"`, `"openrouter"`) to their respective model lists.

### Discrepancy Found in API Schema (`backend/app/schemas/agent.py` & `backend/app/routers/agents.py`)
- While `models_catalog.py` has entries for SambaNova, Cerebras, Fireworks, and Together:
  - `ModelsCatalogOut` in `backend/app/schemas/agent.py` (lines 166-179) omits explicit response fields for `sambanova`, `cerebras`, `fireworks`, `together`.
  - `get_models_catalog()` in `backend/app/routers/agents.py` (lines 260-272) currently only constructs responses for `openai` and `anthropic`, leaving all other provider lists unpopulated in the GET `/api/v1/agents/models` REST endpoint output.

---

## 2. Dynamic Provider Routing in `factory.py` and Provider Interface

### Base Class & Interface (`backend/app/services/llm/base.py`)
- All LLM providers subclass `BaseLLMProvider(ABC)`.
- Core attributes: `name: str = "base"`, `api_key: Optional[str]`, `model: str`.
- Primary abstract method:
  ```python
  @abstractmethod
  async def chat(
      self,
      messages: List[ChatMessage],
      *,
      temperature: float = 0.7,
      max_tokens: int = 1024,
      tools: Optional[List[Dict[str, Any]]] = None,
      **kwargs,
  ) -> LLMResponse:
  ```
- Normalization Structures:
  - `ChatMessage(role: Role, content: str, tool_calls: List[ToolCall], tool_call_id: Optional[str], tool_name: Optional[str])`
  - `ToolCall(id: str, name: str, arguments: Dict[str, Any])`
  - `LLMResponse(content: str, provider: str, model: str, prompt_tokens, completion_tokens, total_tokens, raw: dict, tool_calls, stop_reason)`
  - `LLMError(Exception)` exception type.

### Dynamic Instantiation Routing (`backend/app/services/llm/factory.py`)
- Function `get_provider(provider_name: str, model: str, *, api_key: Optional[str] = None, base_url: Optional[str] = None) -> BaseLLMProvider` uses a module-level `_cache` dict to reuse provider instances.
- Provider classification:
  - `"openai"` -> Instantiates `OpenAIProvider` using `settings.openai_api_key`.
  - `"anthropic"` -> Instantiates `AnthropicProvider` using `settings.anthropic_api_key`.
  - `"local"` / `"ollama"` -> Instantiates `OpenAIProvider` pointing to local base URLs (`127.0.0.1:1234/v1` or `127.0.0.1:11434/v1`).
  - `"gemini"` / `"googleaistudio"` -> Instantiates `GeminiProvider`.
  - `provider_name in _OPENAI_COMPATIBLE_PROVIDERS` -> Instantiates `OpenAIProvider(api_key=effective_key, model=model, base_url=effective_base_url)`.
- **Factory Registration Status:**
  `_OPENAI_COMPATIBLE_PROVIDERS` (lines 14-41) **already includes** mappings for SambaNova, Cerebras, Fireworks, and Together:
  - `sambanova`: `base_url`: `https://api.sambanova.ai/v1`, `env_key`: `SAMBANOVA_API_KEY`
  - `cerebras`: `base_url`: `https://api.cerebras.ai/v1`, `env_key`: `CEREBRAS_API_KEY`
  - `fireworks`: `base_url`: `https://api.fireworks.ai/inference/v1`, `env_key`: `FIREWORKS_API_KEY`
  - `together`: `base_url`: `https://api.together.xyz/v1`, `env_key`: `TOGETHER_API_KEY`

---

## 3. Connection and Latency Testing in `tester.py`

### File Location
`backend/app/services/llm/tester.py`

### Mechanism
- `test_connection(provider, model, *, api_key=None, base_url=None, timeout_ms=20000, verify_ssl=True) -> ConnectionTestResult`.
- Executes lightweight independent HTTP requests using `httpx.AsyncClient` (bypassing cached SDK objects).
- Steps:
  1. Measures round-trip time (`time.perf_counter()`).
  2. Resolves API key from input parameter or environment variables map (`env_keys`). Filters placeholder keys (`"xxxxxxxxxx"`).
  3. Validates prefix requirements (`sk-` for OpenAI, `sk-ant-` for Anthropic).
  4. Routes test request:
     - OpenAI-compatible providers -> `_test_openai()` (POST `{base_url}/chat/completions` with payload `{"model": model, "messages": [{"role": "user", "content": "Cevap olarak sadece: merhaba"}], "max_tokens": 32, "temperature": 0.0}`).
     - Anthropic -> `_test_anthropic()` (POST `{base_url}/v1/messages`).
     - Gemini -> `_test_gemini()`.
  5. Inspects response for HTML error pages (`_is_html()`, `_extract_html_message()`) and parses error codes (`_extract_error_from_json()`, `_status_hint()`).

### Critical Defect Found in `tester.py`
Currently, `test_connection()` in `tester.py` **fails** for SambaNova, Cerebras, Fireworks, and Together due to two missing dictionary entries:
1. `env_keys` map (lines 105-115) does **not** contain `"sambanova"`, `"cerebras"`, `"fireworks"`, or `"together"`.
2. `openai_compatibles` map (lines 152-161) does **not** contain `"sambanova"`, `"cerebras"`, `"fireworks"`, or `"together"`.

Because they are absent from `openai_compatibles`, any connection test request for these 4 providers hits line 183 (`else: return ConnectionTestResult(ok=False, message="Desteklenmeyen saglayici: sambanova")`).

---

## 4. Exact Required Changes to Support SambaNova, Cerebras, Fireworks AI, and Together AI

To complete full support across the backend, the following exact modifications are required:

### Change 1: Update `backend/app/services/llm/tester.py`
Add environment key lookup and endpoint resolution for the four providers in `test_connection()`:

```python
# In env_keys dictionary (lines 105-115):
"sambanova": os.environ.get("SAMBANOVA_API_KEY"),
"cerebras": os.environ.get("CEREBRAS_API_KEY"),
"fireworks": os.environ.get("FIREWORKS_API_KEY"),
"together": os.environ.get("TOGETHER_API_KEY"),

# In openai_compatibles dictionary (lines 152-161):
"sambanova": base_url or "https://api.sambanova.ai/v1",
"cerebras": base_url or "https://api.cerebras.ai/v1",
"fireworks": base_url or "https://api.fireworks.ai/inference/v1",
"together": base_url or "https://api.together.xyz/v1",
```

### Change 2: Enhance `backend/app/services/llm/openai_provider.py` & `factory.py`
- Modify `OpenAIProvider.__init__` to accept optional `provider_name: Optional[str] = None` and set `self.name = provider_name or "openai"`.
- Update `factory.py` when instantiating `OpenAIProvider` for `_OPENAI_COMPATIBLE_PROVIDERS` to pass `provider_name=provider_name`.
- *Benefit*: Ensures `LLMResponse.provider` accurately reports `"sambanova"`, `"cerebras"`, `"fireworks"`, or `"together"` instead of generic `"openai"`.

### Change 3: Update `backend/app/schemas/agent.py`
Extend `ModelsCatalogOut` model to include explicit fields:
```python
sambanova: List[ModelInfoOut] = Field(default_factory=list)
cerebras: List[ModelInfoOut] = Field(default_factory=list)
fireworks: List[ModelInfoOut] = Field(default_factory=list)
together: List[ModelInfoOut] = Field(default_factory=list)
```

### Change 4: Update `backend/app/routers/agents.py`
Update `get_models_catalog()` to include all providers from `MODELS_BY_PROVIDER` in the returned JSON object:
```python
return ModelsCatalogOut(
    openai=to_out(MODELS_BY_PROVIDER["openai"]),
    anthropic=to_out(MODELS_BY_PROVIDER["anthropic"]),
    local=to_out(MODELS_BY_PROVIDER.get("local", [])),
    gemini=to_out(MODELS_BY_PROVIDER.get("gemini", [])),
    ollama=to_out(MODELS_BY_PROVIDER.get("ollama", [])),
    groq=to_out(MODELS_BY_PROVIDER.get("groq", [])),
    mistral=to_out(MODELS_BY_PROVIDER.get("mistral", [])),
    deepseek=to_out(MODELS_BY_PROVIDER.get("deepseek", [])),
    xai=to_out(MODELS_BY_PROVIDER.get("xai", [])),
    openrouter=to_out(MODELS_BY_PROVIDER.get("openrouter", [])),
    sambanova=to_out(MODELS_BY_PROVIDER.get("sambanova", [])),
    cerebras=to_out(MODELS_BY_PROVIDER.get("cerebras", [])),
    fireworks=to_out(MODELS_BY_PROVIDER.get("fireworks", [])),
    together=to_out(MODELS_BY_PROVIDER.get("together", [])),
)
```

### Change 5: Update `backend/app/config.py`
Add optional environment variable settings to `Settings` class:
```python
sambanova_api_key: str | None = None
cerebras_api_key: str | None = None
fireworks_api_key: str | None = None
together_api_key: str | None = None
```

---

## 5. Verification Matrix

| Component | File Path | Invalidation Condition | Verification Check |
|-----------|-----------|------------------------|-------------------|
| Catalog | `backend/app/services/llm/models_catalog.py` | Key missing in `MODELS_BY_PROVIDER` | Check dictionary keys |
| Factory | `backend/app/services/llm/factory.py` | Key missing in `_OPENAI_COMPATIBLE_PROVIDERS` | Check `_OPENAI_COMPATIBLE_PROVIDERS.keys()` |
| Connection Tester | `backend/app/services/llm/tester.py` | `openai_compatibles` missing keys | Call `test_connection("sambanova", ...)` |
| REST Catalog Endpoint | `backend/app/routers/agents.py` | `ModelsCatalogOut` missing provider fields | Invoke GET `/api/v1/agents/models` |
| Unit Tests | `backend/tests/test_llm_providers.py` | Assertion failures | Run pytest `tests/test_llm_providers.py` |
