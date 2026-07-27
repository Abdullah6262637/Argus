# Explorer 2 Handoff Report: Frontend Model Helpers and Agent Creation Wizard

## 1. Observation
- **`frontend/src/utils/modelHelper.ts`**:
  - Contains function `getModelLogo(model: string, provider: string)` (lines 5–58):
    - Matches model keywords (`gpt`, `o1`, `o3`, `claude`, `gemini`, `gemma`, `llama`, `qwen`, `deepseek`, `mistral`, `grok`, `command`, `phi`).
    - Falls back to provider names: `if (p === 'sambanova') return '/providers/sambanova.png?v=3'`, `if (p === 'cerebras') return '/providers/cerebras.png?v=3'`, `if (p === 'fireworks') return '/providers/fireworks.png?v=3'`, `if (p === 'together') return '/providers/together.png?v=3'`.
  - Contains function `getMcpLogo(serverName: string)` (lines 63–79).
  - Presets, base URLs, default models, and env key names are NOT defined in `modelHelper.ts`.
- **`frontend/src/components/AgentForm/Step2LLM.tsx`**:
  - `PROXY_PRESETS` array (lines 17–115) defines preset entries for SambaNova, Cerebras, Fireworks, and Together AI:
    - `sambanova`: `provider: 'sambanova'`, `base_url: 'https://api.sambanova.ai/v1'`, `model: 'Meta-Llama-3.3-70B-Instruct'`, `placeholder_api_key: 'sn_...'`
    - `cerebras`: `provider: 'cerebras'`, `base_url: 'https://api.cerebras.ai/v1'`, `model: 'llama3.3-70b'`, `placeholder_api_key: 'csk-...'`
    - `fireworks`: `provider: 'fireworks'`, `base_url: 'https://api.fireworks.ai/inference/v1'`, `model: 'accounts/fireworks/models/llama-v3p3-70b-instruct'`, `placeholder_api_key: 'fw_...'`
    - `together`: `provider: 'together'`, `base_url: 'https://api.together.xyz/v1'`, `model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo'`, `placeholder_api_key: '••••'`
  - Provider image mapping in `CustomSelect` (lines 214–223) missing cases for `sambanova`, `cerebras`, `fireworks`.
  - Provider manual selection dropdown (lines 242–333) omits options for `sambanova`, `cerebras`, `fireworks`, `together`.
  - `envKey` assignment (lines 183–192) omits environment key mappings for `sambanova`, `cerebras`, `fireworks`, `together`.
- **`frontend/src/components/AgentForm.tsx`**:
  - `applyPreset(id: string)` (lines 373–382) looks up preset by ID in `PROXY_PRESETS` and sets `provider`, `baseUrl`, and `model`.
  - `FALLBACK_MODELS` (lines 45–204) contains fallback lists for `openai`, `anthropic`, `gemini`, `googleaistudio`, `deepseek`, `mistral`, `xai`, `groq`, `openrouter`, `local`, but NOT for `sambanova`, `cerebras`, `fireworks`, or `together`.
- **`frontend/src/types/index.ts`**:
  - `ProviderName` union type (lines 5–20) explicitly includes `'sambanova' | 'cerebras' | 'fireworks' | 'together'`.
- **`frontend/src/api/client.ts`**:
  - Endpoint functions `createAgent` (line 101) and `testAgentConnection` (line 111) pass `provider`, `model`, `base_url`, and `api_key` directly in HTTP POST request JSON bodies.

## 2. Logic Chain
1. *Observation*: `modelHelper.ts` only exports `getModelLogo` and `getMcpLogo`.
   *Logic*: Model presets, base URLs, default models, and env keys are currently located outside `modelHelper.ts` inside `Step2LLM.tsx` and `AgentForm.tsx`.
2. *Observation*: Selecting a preset in `Step2LLM.tsx` invokes `applyPreset(id)` in `AgentForm.tsx`.
   *Logic*: `applyPreset` maps preset properties (`provider`, `base_url`, `model`) directly into the agent creation form state.
3. *Observation*: `PROXY_PRESETS` includes SambaNova, Cerebras, Fireworks, and Together AI with their v1 `base_url` values and flagship Llama 3.3 models.
   *Logic*: The preset objects supply the requisite fields for one-click setup, but manual provider selection and fallback model dropdowns lack explicit provider entries and env key lookups for these 4 providers.
4. *Observation*: API requests transmit `provider` as `ProviderName` along with `model` and `base_url` to backend endpoints `/api/agents` and `/api/agents/test`.
   *Logic*: Frontend and backend communicate using matching provider names and base URLs for custom OpenAI-compatible endpoints.

## 3. Caveats
- No caveats. All frontend model helper utilities, creation wizard step components, types, and API client methods were examined directly.

## 4. Conclusion
- `modelHelper.ts` serves solely as a brand logo path resolver for models and MCP servers. Presets, base URLs, and environment variable names reside in `Step2LLM.tsx`, while fallback model lists reside in `AgentForm.tsx`.
- SambaNova, Cerebras, Fireworks, and Together AI have complete `PROXY_PRESETS` defined with valid v1 base URLs and model names.
- To fully integrate SambaNova, Cerebras, Fireworks, and Together AI across the frontend wizard, the following minor gaps should be addressed in `Step2LLM.tsx` and `AgentForm.tsx`:
  1. Add provider dropdown entries in `Step2LLM.tsx`.
  2. Add logo mapping cases in `Step2LLM.tsx` preset option renderer.
  3. Add environment key mappings (`SAMBANOVA_API_KEY`, `CEREBRAS_API_KEY`, `FIREWORKS_API_KEY`, `TOGETHER_API_KEY`) to `envKey` in `Step2LLM.tsx`.
  4. Add model entries to `FALLBACK_MODELS` in `AgentForm.tsx`.

## 5. Verification Method
1. Inspect `frontend/src/utils/modelHelper.ts` lines 5–58 to confirm logo helper logic and fallback mappings.
2. Inspect `frontend/src/components/AgentForm/Step2LLM.tsx` lines 17–115 to verify `PROXY_PRESETS` definitions.
3. Inspect `frontend/src/components/AgentForm.tsx` lines 373–382 to verify `applyPreset` behavior.
4. Inspect `frontend/src/types/index.ts` lines 5–20 to verify `ProviderName` enum values.
