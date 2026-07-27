# Project: Argus Ultra-High Speed Provider Integrations

## Architecture
- Backend: Python / FastAPI service in `backend/app/services/llm/`
  - `models_catalog.py`: Defines provider catalogs, metadata, base URLs, icons, default models, and env key names.
  - `factory.py`: Instantiates provider classes dynamically based on requested provider string.
  - `tester.py`: Performs live or mock connection and key latency tests for each provider.
  - Provider adapters/implementations: `provider_*.py`
- Frontend: React / TypeScript UI in `frontend/src/`
  - `frontend/src/utils/modelHelper.ts`: Preset options, default base URLs, model suggestions, API key env labels.
  - `frontend/src/components/agent/Step2LLM.tsx` or `AgentForm.tsx`: Agent creation wizard step 2 rendering preset cards/buttons.
- Documentation: `README.md`
  - Animated marquee strips featuring badges for supported LLM inference providers.
- Testing: `backend/tests/test_llm_providers.py`
  - Pytest test cases validating factory routing, catalog configuration, connection tester, and completion methods.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Backend Integrations & Factory Routing | `backend/app/services/llm/` | none | IN_PROGRESS |
| 2 | Frontend Catalog & UI Integration | `frontend/src/utils/modelHelper.ts`, `AgentForm.tsx` | M1 | PLANNED |
| 3 | Documentation & Marquee Badges | `README.md` | M1, M2 | PLANNED |
| 4 | Comprehensive Test Suite & Integrity Audit | `backend/tests/test_llm_providers.py` | M1, M2, M3 | PLANNED |

## Interface Contracts
### Provider Registration Contract
- SambaNova: `sambanova`, Base URL: `https://api.sambanova.ai/v1`, Model: `Meta-Llama-3.3-70B-Instruct`, Env: `SAMBANOVA_API_KEY`
- Cerebras: `cerebras`, Base URL: `https://api.cerebras.ai/v1`, Model: `llama3.3-70b`, Env: `CEREBRAS_API_KEY`
- Fireworks: `fireworks`, Base URL: `https://api.fireworks.ai/inference/v1`, Model: `accounts/fireworks/models/llama-v3p3-70b-instruct`, Env: `FIREWORKS_API_KEY`
- Together: `together`, Base URL: `https://api.together.xyz/v1`, Model: `meta-llama/Llama-3.3-70B-Instruct-Turbo`, Env: `TOGETHER_API_KEY`

## Code Layout
- Backend LLM services: `backend/app/services/llm/`
- Frontend Utils: `frontend/src/utils/modelHelper.ts`
- Frontend Wizard: `frontend/src/components/agent/`
- Tests: `backend/tests/test_llm_providers.py`
- Readme: `README.md`
