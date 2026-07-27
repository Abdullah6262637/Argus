## 2026-07-27T16:55:29Z

You are Worker 2 (teamwork_preview_worker).
Your working directory is: C:\Users\HP\.gemini\antigravity\worktrees\argus\refactor-argus-core-security\.agents\worker_2

Objective: Implement Milestone 2 (Frontend Model Helper & UI Wizard Presets) and Milestone 3 (README Marquee Badges).

Target Files & Detailed Tasks:

1. `frontend/src/components/AgentForm/Step2LLM.tsx`:
   - Manual Provider Select dropdown (lines ~242-333): Add selection options for `sambanova`, `cerebras`, `fireworks`, `together` so users can manually select these providers if desired.
   - Provider image renderer in `CustomSelect` (lines ~214-223): Ensure provider icons for `sambanova`, `cerebras`, `fireworks`, `together` render properly.
   - Environment Key helper function `envKey` (lines ~183-192): Add mappings for:
     - `'sambanova'`: `'SAMBANOVA_API_KEY'`
     - `'cerebras'`: `'CEREBRAS_API_KEY'`
     - `'fireworks'`: `'FIREWORKS_API_KEY'`
     - `'together'`: `'TOGETHER_API_KEY'`

2. `frontend/src/components/AgentForm.tsx`:
   - Add default model entries to `FALLBACK_MODELS` for:
     - `sambanova`: `[{ id: 'Meta-Llama-3.3-70B-Instruct', name: 'Meta Llama 3.3 70B Instruct (1000+ tok/s)' }]`
     - `cerebras`: `[{ id: 'llama3.3-70b', name: 'Llama 3.3 70B (2000+ tok/s)' }, { id: 'llama3.1-8b', name: 'Llama 3.1 8B' }]`
     - `fireworks`: `[{ id: 'accounts/fireworks/models/llama-v3p3-70b-instruct', name: 'Llama 3.3 70B Instruct' }]`
     - `together`: `[{ id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B Turbo' }]`

3. `frontend/src/utils/modelHelper.ts`:
   - Verify `getModelLogo` handles `sambanova`, `cerebras`, `fireworks`, and `together` cleanly.

4. `README.md`:
   - Update the two animated `<marquee>` strips (lines ~108-136) to include badges for the new ultra-speed providers (`SambaNova`, `Cerebras`, `Fireworks AI`, `Together AI`, `xAI Grok`, `Mistral AI`).
   - Format: Shields.io `for-the-badge` SVG badges matching existing style (e.g. `https://img.shields.io/badge/SambaNova-1000%2B%20tok%2Fs-FF6B00?style=for-the-badge&logo=sambanova&logoColor=white`, `https://img.shields.io/badge/Cerebras-2000%2B%20tok%2Fs-FF3B00?style=for-the-badge&logo=cerebras&logoColor=white`, etc.).

Mandatory Integrity Rule:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Verification:
- Inspect modified files to ensure syntax and structure are valid.
- Write summary of changes to `C:\Users\HP\.gemini\antigravity\worktrees\argus\refactor-argus-core-security\.agents\worker_2\handoff.md`.
- Send a message back to orchestrator upon completion.
