## 2026-07-27T13:37:16Z
You are Worker 1 (teamwork_preview_worker).
Your working directory is: C:\Users\HP\.gemini\antigravity\worktrees\argus\refactor-argus-core-security\.agents\worker_1

Objective: Implement complete backend support for SambaNova Cloud, Cerebras Systems, Fireworks AI, and Together AI.

Target Files:
1. `backend/app/services/llm/tester.py`:
   - Add `"sambanova"`, `"cerebras"`, `"fireworks"`, `"together"` to `env_keys` dictionary mapping to `"SAMBANOVA_API_KEY"`, `"CEREBRAS_API_KEY"`, `"FIREWORKS_API_KEY"`, `"TOGETHER_API_KEY"`.
   - Add `"sambanova"`, `"cerebras"`, `"fireworks"`, `"together"` to `openai_compatibles` dictionary mapping to:
     - `"sambanova"`: `("https://api.sambanova.ai/v1", "Meta-Llama-3.3-70B-Instruct")`
     - `"cerebras"`: `("https://api.cerebras.ai/v1", "llama3.3-70b")`
     - `"fireworks"`: `("https://api.fireworks.ai/inference/v1", "accounts/fireworks/models/llama-v3p3-70b-instruct")`
     - `"together"`: `("https://api.together.xyz/v1", "meta-llama/Llama-3.3-70B-Instruct-Turbo")`

2. `backend/app/services/llm/openai_provider.py` & `backend/app/services/llm/factory.py`:
   - Support passing an optional `provider_name: str` to `OpenAIProvider.__init__()` (defaulting to `"openai"`).
   - In `OpenAIProvider`, set `self.provider_name = provider_name` so `LLMResponse(provider=self.provider_name)` returns the actual provider name (`"sambanova"`, `"cerebras"`, `"fireworks"`, `"together"`) rather than always `"openai"`.
   - Update `factory.py` to pass `provider_name` when creating `OpenAIProvider` for custom OpenAI-compatible providers.

3. `backend/app/schemas/agent.py` & `backend/app/routers/agents.py`:
   - In `ModelsCatalogOut` (`backend/app/schemas/agent.py`), add optional fields for `sambanova`, `cerebras`, `fireworks`, `together` (List[ModelInfo] = []).
   - In `get_models_catalog()` (`backend/app/routers/agents.py`), populate `sambanova`, `cerebras`, `fireworks`, `together` from `MODELS_BY_PROVIDER`.

4. `backend/app/config.py`:
   - Add settings fields: `SAMBANOVA_API_KEY: Optional[str] = None`, `CEREBRAS_API_KEY: Optional[str] = None`, `FIREWORKS_API_KEY: Optional[str] = None`, `TOGETHER_API_KEY: Optional[str] = None`.

Mandatory Integrity Rule:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Verification:
- Run `uv run pytest backend/tests` using `run_command` in `backend` directory.
- Confirm all existing and modified backend code compiles and tests pass.
- Write summary of changes and verification output to `C:\Users\HP\.gemini\antigravity\worktrees\argus\refactor-argus-core-security\.agents\worker_1\handoff.md`.
- Send a message back to orchestrator upon completion.
