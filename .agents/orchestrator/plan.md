# Orchestrator Execution Plan: Argus Ultra-High Speed Provider Integrations

## Overview
Integrate native OpenAI-compatible support for SambaNova Cloud, Cerebras Systems, Fireworks AI, and Together AI into the Argus platform backend, frontend catalog/UI, documentation, and test suite.

## Milestones & Decomposition

### Milestone 1: Backend Integration & Factory Routing
- Target files:
  - `backend/app/services/llm/provider_sambanova.py` (or generic OpenAI compatible integration)
  - `backend/app/services/llm/provider_cerebras.py`
  - `backend/app/services/llm/provider_fireworks.py`
  - `backend/app/services/llm/provider_together.py`
  - `backend/app/services/llm/models_catalog.py`
  - `backend/app/services/llm/factory.py`
  - `backend/app/services/llm/tester.py`
- Objective: Add provider classes/adapters, update catalog definitions with default base URLs, environment variable key names (`SAMBANOVA_API_KEY`, `CEREBRAS_API_KEY`, `FIREWORKS_API_KEY`, `TOGETHER_API_KEY`), route in `factory.py`, and support latency/key testing in `tester.py`.

### Milestone 2: Frontend Catalog & UI Wizard Integration
- Target files:
  - `frontend/src/utils/modelHelper.ts`
  - `frontend/src/components/agent/Step2LLM.tsx` (or `AgentForm.tsx`)
- Objective: Register presets for SambaNova, Cerebras, Fireworks, and Together with default Base URLs, logos/icons, model suggestions, and render preset buttons in Step 2 of the Agent Creation Wizard.

### Milestone 3: Documentation & Marquee Badges
- Target file: `README.md`
- Objective: Update animated Proxy & Provider marquee strips with new ultra-speed provider badges (SambaNova, Cerebras, Fireworks, Together).

### Milestone 4: Comprehensive Test Suite & Integrity Audit
- Target file: `backend/tests/test_llm_providers.py`
- Objective: Add pytest unit and mock integration tests for all 4 providers, verifying factory instantiation, catalog metadata, connection tester, and stream/completion calls. Run full test suite and forensic integrity audit.

## Execution Strategy
1. Dispatch Explorer subagent to inspect existing provider patterns in backend and frontend.
2. Dispatch Worker subagents to implement Milestone 1, 2, 3, 4 sequentially or in coupled logical increments.
3. Dispatch Reviewer and Challenger subagents to verify functionality and test execution.
4. Dispatch Forensic Auditor subagent to perform integrity verification.
5. Final synthesis and reporting.
