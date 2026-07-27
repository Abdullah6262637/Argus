## 2026-07-27T13:49:43Z
You are Worker 2 (teamwork_preview_worker).
Your working directory is: C:\Users\HP\.gemini\antigravity\worktrees\argus\refactor-argus-core-security\.agents\worker_2

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

OBJECTIVE:
Remediate the 4 frontend UI omissions and update README marquee badges for SambaNova, Cerebras, Fireworks AI, and Together AI integrations in Argus.

TASKS TO COMPLETE:

1. Provider Select Menu (`frontend/src/components/AgentForm/Step2LLM.tsx`, lines 242–334):
   Add provider options for `sambanova`, `cerebras`, `fireworks`, `together` to `<CustomSelect>` options in Step2LLM for provider selection.

2. Preset Dropdown Logo Resolution (`frontend/src/components/AgentForm/Step2LLM.tsx`, lines 214–223):
   Update `providerImg` mapping so `sambanova`, `cerebras`, `fireworks`, `together` map to their respective logo names (e.g. `sambanova`, `cerebras`, `fireworks`, `together`).

3. Environment Key Detection Indicator (`frontend/src/components/AgentForm/Step2LLM.tsx`, lines 183–192):
   Update `envKey` logic to map `sambanova` -> `SAMBANOVA_API_KEY`, `cerebras` -> `CEREBRAS_API_KEY`, `fireworks` -> `FIREWORKS_API_KEY`, `together` -> `TOGETHER_API_KEY`.

4. Fallback Models Catalog (`frontend/src/components/AgentForm.tsx`, lines 45–140):
   Add fallback model definitions for `sambanova`, `cerebras`, `fireworks`, and `together` in `FALLBACK_MODELS`:
   - sambanova: `[{ id: 'Meta-Llama-3.3-70B-Instruct', name: 'Meta Llama 3.3 70B Instruct (1000+ t/s)' }]`
   - cerebras: `[{ id: 'llama3.3-70b', name: 'Llama 3.3 70B (2000+ t/s)' }, { id: 'llama3.1-8b', name: 'Llama 3.1 8B' }]`
   - fireworks: `[{ id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Llama 3.3 70B Instruct' }]`
   - together: `[{ id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Instruct Turbo' }]`

5. README Marquee Badges (`README.md`):
   Ensure Shields.io badges for SambaNova, Cerebras, Fireworks AI, Together AI (and xAI / Mistral) are present in both marquee strips in `README.md`.

6. Verification:
   Run backend pytest tests via `uv run pytest backend/tests/test_llm_providers.py` to ensure backend tests still pass 100%.

Write your handoff report in `C:\Users\HP\.gemini\antigravity\worktrees\argus\refactor-argus-core-security\.agents\worker_2\handoff.md` and send a summary message back to the orchestrator.
