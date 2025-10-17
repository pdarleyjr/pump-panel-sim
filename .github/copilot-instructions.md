<!-- .github/copilot-instructions.md for pump-panel-sim -->
# Quick guide for AI contributors

This repository is a React + TypeScript front-end simulator (PixiJS + Tone.js) with a small Cloudflare Durable Object worker for instructor-mode. Keep guidance concise and actionable — reference the files below for examples.

- Project roots:
  - Frontend app: `pump-panel-sim/` (Vite + React + TypeScript)
  - Worker (Durable Objects): `do-worker/` (Wrangler)

- Common tasks (use these exact scripts):
  - Local dev UI: `cd pump-panel-sim && npm install && npm run dev` (starts Vite)
  - Build UI: `cd pump-panel-sim && npm run build` (runs `tsc` then `vite build`)
  - Preview production build: `cd pump-panel-sim && npm run preview`
  - Run UI tests: `cd pump-panel-sim && npm test` (Vitest)
  - Worker dev/deploy: `cd do-worker && npm install && npm run dev` / `npm run deploy` (wrangler)

- Big-picture architecture to keep in mind:
  - The UI is authoritative for simulation state and runs in the browser (`src/sim/*`, `src/ui/*`). See `src/sim/model.ts` and `src/sim/state.ts` for the core simulation model and state transitions.
  - Instructor Mode is a separate WebSocket-backed interface implemented via Cloudflare Durable Objects in `do-worker/` and connects to the UI via a wss: Durable Object endpoint (`src/net/ws.ts`, `do-worker/index.ts`).
  - Rendering uses PixiJS (`src/ui/*`, `src/ui/pixi/*`) and is performance-sensitive: cap DPR to 2x and prefer texture caching (`src/ui/graphics/TextureCache.ts`).
  - Audio uses Tone.js and is gesture-gated; initialization happens on user gesture (`src/audio/AudioProvider.tsx`). Avoid importing Tone at module top-level in patches that may run during SSR/evaluation.

- Project-specific conventions and patterns:
  - Gesture-gated resources: Audio and other user-media resources must be initialized on first user gesture. See `src/audio/AudioProvider.tsx` for the pattern (listen `pointerdown`/`keydown`, then import Tone dynamically).
  - WebGL safety: handle `webglcontextlost`/`webglcontextrestored` (see `src/ui/pixi/context.ts`) and cap DPR to reduce VRAM.
  - Touch/accessibility: hit areas are expanded (`src/ui/controls/touchHelpers.ts`) for 44×44 minimum touch targets. Use ARIA live regions for warnings (`src/ui/StatusHUD.tsx`).
  - Simulation code is pure/functional where possible: prefer small, testable functions (examples: `src/hydraulics/*`, `src/sim/pump-curves.ts`). Unit tests live adjacent to modules (e.g., `*.test.ts`).

- Useful files to reference when editing or adding features:
  - `pump-panel-sim/src/sim/*` — simulation logic and domain rules (interlocks, pump curves, gauges)
  - `pump-panel-sim/src/ui/*` — PixiJS rendering, controls, keyboard handling, overlays
  - `pump-panel-sim/src/audio/AudioProvider.tsx` — gesture-gated Tone.js initialization
  - `pump-panel-sim/src/ui/graphics/TextureCache.ts` — texture lifecycle and memory considerations
  - `pump-panel-sim/src/ui/keyboard/KeyboardManager.ts` — keyboard shortcut conventions
  - `do-worker/` — Cloudflare Durable Object worker; uses Wrangler for dev/deploy

- Testing & CI notes:
  - Unit tests use Vitest. Tests are expected near implementation files (e.g., `src/sim/*.test.ts`). Run `npm test` in `pump-panel-sim/`.
  - The repo's CI (GitHub Actions) runs tests and builds on push to `main`. If adding heavy integration tests, ensure they are opt-in to avoid slowing CI.

- Quick troubleshooting tips for AI edits:
  - Avoid dynamic imports that create AudioContext at module-eval time. Use the same pattern as `src/audio/AudioProvider.tsx`.
  - When touching rendering code, respect DPR cap and texture cache to prevent memory spikes on hiDPI monitors.
  - Follow existing TypeScript types and exports; run `npm run build` to catch `tsc` errors (the build script runs `tsc` first).

If anything above is unclear or you want additional detail (examples, more file references, or CI workflow notes), tell me which area to expand and I'll iterate.

---

Agent operational notes (extracted from internal agent guidance):

- Memory file: AI agents should check for (and create if missing) a repository-scoped memory file at `.agents/memory.instruction.md`. If created, include minimal front-matter and placeholders for "Coding Preferences", "Project Architecture", and "Solutions Repository" so future runs can persist discovered patterns.

- Tool-call protocol: When making multiple tool calls in a batch prefacing them with a one-line why/what/outcome statement is required (e.g., "Why: searching for relevant files to extract build/test commands; What: run file search and read files; Outcome: collect scripts and architecture notes").

- Progress cadence: After roughly every 3–5 tool calls or after editing >3 files, report a concise progress update describing what was run/changed and next steps.

- Cleanup & validation: After edits that touch runnable code, run the project's build/test scripts (`npm run build`, `npm test`) and report PASS/FAIL. If tests fail, include failing output and next steps for fixing.

- Workspace hygiene: Remove temporary files and avoid creating persistent artifacts unless checked into the repo. Prefer minimal, reversible changes and follow the repo's package manager and build patterns.

These operational items are suggestions to make AI edits safer and more auditable in this repository; follow them when performing multi-step edits or running tools.
