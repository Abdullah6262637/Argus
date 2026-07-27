# Detailed Frontend Model Helpers and Agent Creation Wizard Analysis

## Overview
This report presents an investigation into the frontend model helper utilities (`frontend/src/utils/modelHelper.ts`), the Agent Creation Wizard components (`frontend/src/components/AgentForm.tsx`, `frontend/src/components/AgentForm/Step2LLM.tsx`), and the TypeScript type definitions (`frontend/src/types/index.ts`).

---

## 1. Registration of Model Presets, Base URLs, Logos, Default Models, and API Keys

### Analysis of `frontend/src/utils/modelHelper.ts`
- **Actual Content & Responsibility**:
  `modelHelper.ts` currently contains **only** logo lookup logic:
  - `getModelLogo(model: string, provider: string): string` (lines 5–58):
    - Matches model name keywords (`gpt`, `o1`, `o3`, `claude`, `gemini`, `gemma`, `llama`, `qwen`, `deepseek`, `mistral`, `grok`, `command`, `phi`).
    - Falls back to provider-specific logos (`openai`, `anthropic`, `gemini`, `googleaistudio`, `openrouter`, `groq`, `deepseek`, `mistral`, `xai`, `sambanova`, `cerebras`, `fireworks`, `together`, `local`).
    - Default fallback logo: `/providers/local.png?v=3`.
  - `getMcpLogo(serverName: string): string` (lines 63–79):
    - Matches MCP server keywords (`github`, `fetch`, `sqlite`, `filesystem`, `docker`, `postgres`, `slack`, `sentry`, `aws`, `brave`, `puppeteer`, `memory`).

- **Key Finding**:
  Model presets, Base URLs, default models, and API key environment names are **NOT registered in `modelHelper.ts`**. Instead, they are currently split across multiple components:
  1. **Presets & Base URLs**: Defined in `frontend/src/components/AgentForm/Step2LLM.tsx` under `export const PROXY_PRESETS: ProxyPreset[]`.
  2. **Default / Fallback Models**: Defined in `frontend/src/components/AgentForm.tsx` under `const FALLBACK_MODELS: Record<string, ModelInfoOut[]>`.
  3. **API Key Environment Names**: Hardcoded in `frontend/src/components/AgentForm/Step2LLM.tsx` in the `envKey` evaluation logic (lines 183–192).

---

## 2. Preset Options Rendering & Selection Mechanism

### Workflow in `Step2LLM.tsx` and `AgentForm.tsx`:
1. **Preset Data Structure**:
   `Step2LLM.tsx` defines the `ProxyPreset` interface (lines 7–15):
   ```typescript
   export interface ProxyPreset {
     id: string;
     label: string;
     provider: ProviderName;
     base_url: string;
     model: string;
     placeholder_api_key?: string;
     description?: string;
   }
   ```
2. **Rendering UI (`Step2LLM.tsx` lines 208–235)**:
   The preset dropdown is rendered using `<CustomSelect>` under the field "Proxy / Preset (opsiyonel)":
   ```tsx
   <CustomSelect
     value={presetId}
     onChange={applyPreset}
     placeholder="— Manuel yapılandırma —"
     options={PROXY_PRESETS.map((p) => {
       const providerImg = ...;
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
   ```
3. **Application Handler (`AgentForm.tsx` lines 373–382)**:
   When selected, `applyPreset(id)` executes:
   ```typescript
   const applyPreset = (id: string) => {
     setPresetId(id);
     if (!id) return;
     const p = PROXY_PRESETS.find((x) => x.id === id);
     if (p) {
       setProvider(p.provider);
       setBaseUrl(p.base_url);
       setModel(p.model);
     }
   };
   ```
   This populates the `provider`, `baseUrl`, and `model` form state variables simultaneously.

---

## 3. Required Preset Fields for SambaNova, Cerebras, Fireworks, and Together AI

### Definitions in `PROXY_PRESETS` (`Step2LLM.tsx` lines 64–97):
```typescript
// SambaNova
{
  id: 'sambanova',
  label: 'SambaNova Cloud (1000+ t/s)',
  provider: 'sambanova',
  base_url: 'https://api.sambanova.ai/v1',
  model: 'Meta-Llama-3.3-70B-Instruct',
  placeholder_api_key: 'sn_...',
  description: 'Rekor hızında SambaNova LPU çıkarım motoru.'
}

// Cerebras
{
  id: 'cerebras',
  label: 'Cerebras Systems (2000+ t/s)',
  provider: 'cerebras',
  base_url: 'https://api.cerebras.ai/v1',
  model: 'llama3.3-70b',
  placeholder_api_key: 'csk-...',
  description: 'Wafer-Scale Engine ile dünyanın en hızlı Llama çıkarımı.'
}

// Fireworks
{
  id: 'fireworks',
  label: 'Fireworks AI (Speculative)',
  provider: 'fireworks',
  base_url: 'https://api.fireworks.ai/inference/v1',
  model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
  placeholder_api_key: 'fw_...',
  description: 'Gelişmiş speculative decoding çıkarım servisi.'
}

// Together AI
{
  id: 'together',
  label: 'Together AI (Serverless)',
  provider: 'together',
  base_url: 'https://api.together.xyz/v1',
  model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  placeholder_api_key: '••••',
  description: 'Geniş açık kaynak model kütüphanesi.'
}
```

### Identified Implementation Gaps for these Providers:
1. **Dropdown Icon Mapping**: In `Step2LLM.tsx` line 214–223, `providerImg` mapping omits `sambanova`, `cerebras`, and `fireworks`, causing them to fall back to `openai-official`.
2. **Provider Manual Selection Dropdown**: In `Step2LLM.tsx` lines 242–333, `<CustomSelect>` options for manual provider selection only include `openai`, `anthropic`, `gemini`, `googleaistudio`, `openrouter`, `groq`, `deepseek`, `mistral`, `xai`, `local`. `sambanova`, `cerebras`, `fireworks`, and `together` are omitted.
3. **Fallback Models Catalog**: In `AgentForm.tsx` lines 45–204, `FALLBACK_MODELS` has no entries for `sambanova`, `cerebras`, `fireworks`, or `together`.
4. **Environment Variable Name Lookup**: In `Step2LLM.tsx` lines 183–192, `envKey` has no mappings for `sambanova` (`SAMBANOVA_API_KEY`), `cerebras` (`CEREBRAS_API_KEY`), `fireworks` (`FIREWORKS_API_KEY`), or `together` (`TOGETHER_API_KEY`).

---

## 4. Frontend to Backend Provider & Model Name Mapping

- **Provider Type Definition**: `frontend/src/types/index.ts` lines 5–20 defines `ProviderName`:
  ```typescript
  export type ProviderName =
    | 'openai' | 'anthropic' | 'local' | 'gemini' | 'googleaistudio'
    | 'ollama' | 'groq' | 'mistral' | 'deepseek' | 'xai'
    | 'openrouter' | 'sambanova' | 'cerebras' | 'fireworks' | 'together';
  ```
- **API Request Payloads**:
  1. **Agent Creation / Update (`/api/agents`)**:
     Payload object sent via `api.createAgent` (`frontend/src/api/client.ts` line 101):
     ```typescript
     {
       name: string,
       provider: ProviderName, // e.g. "sambanova", "cerebras", "fireworks", "together"
       model: string,          // e.g. "Meta-Llama-3.3-70B-Instruct"
       base_url: string | null,// e.g. "https://api.sambanova.ai/v1"
       api_key: string | null
     }
     ```
  2. **Connection Testing (`/api/agents/test`)**:
     Payload object sent via `api.testAgentConnection` (`frontend/src/api/client.ts` line 111):
     ```typescript
     {
       provider: ProviderName,
       model: string,
       base_url: string | null,
       api_key: string | null,
       verify_ssl: boolean | null
     }
     ```
- **Mapping Mechanism**:
  Frontend model providers map 1:1 to backend provider string names (`sambanova`, `cerebras`, `fireworks`, `together`). Custom OpenAI-compatible endpoints rely on `base_url` to direct backend HTTP requests to the target provider.
