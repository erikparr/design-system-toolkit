# design-audit

A design-system **integrity auditor**. It answers two questions:

1. **Is the rendered system internally healthy?** — WCAG contrast, theme consistency, legacy leftovers.
2. **Are the multiple sources of truth in sync?** — drift between code, Style Dictionary / DTCG tokens, Figma variables, and Storybook.

Everything flows through one normalized model (`Token` / `TokenSet` / `Component` / `Finding`). Each input is an **adapter** that maps into that model; the diff engine and renderers only read the model, never a raw source. Adding a new source = adding an adapter, with no engine change.

## Packages

| Package | What it is | Deps |
|---|---|---|
| [`@agentic-design-audit/core`](packages/core) | The engine: model, color/contrast math, diff, code adapter. Framework-pure, zero runtime deps. | none |
| [`@agentic-design-audit/react`](packages/react) | Config-driven `<DesignAudit>` + `useTokens` hook for React/Tailwind apps. | react, core |
| [`@agentic-design-audit/cli`](packages/cli) | `design-audit drift` — diff code (CSS) tokens against DTCG/Style Dictionary files. CI-friendly (non-zero exit on drift). | core |
| [`skill/`](skill) | A Claude Skill that detects a repo's framework, extracts its tokens to config, mounts the audit route, and verifies. | — |

## Drift CLI

```bash
design-audit drift --css src/app/globals.css \
  --tokens dark=tokens/dark.json --tokens light=tokens/light.json \
  --primitives tokens/primitives.json
```

Exits non-zero on a `value-mismatch` (genuine disagreement); `--strict` also gates on `missing`/`extra` (coverage/naming). `--json` for pipelines, `--authority code|tokens` to choose the source of truth.

## Scope

**v1 targets React + Tailwind.** The framework-agnostic renderer (Web Component, for Vue/Svelte/Astro/plain) is deliberately deferred — but `core` is kept framework-pure so that widening later is additive, not a rewrite.

## Roadmap

Each phase is one adapter into the same engine:

- **v1 — code adapter** ✅: live token values via `getComputedStyle` (browser) + `cssStatic` (headless), contrast, legacy flags.
- **v2 — Style Dictionary / DTCG adapter** ✅ (engine): `dtcgToTokenSet` parses `.tokens.json` ($type inheritance, aliases, alpha hex) → `diffTokenSets` reports cross-source drift. Next: a drift report surface/skill workflow.
- **v3 — Figma adapter** ✅ (variables): `figmaVariablesToTokenSet` consumes the Figma MCP `get_variable_defs` map → `diffTokenSets`. Live-verified (0 value drift, caught a mis-grouped focus-ring variable). Next: Code Connect for component↔code mapping; file-level variables for coverage.
- **v4 — Storybook adapter**: which components/variants are actually exercised.

"Drift" requires an **authority policy** (which source is treated as truth) — set per project; the tool reports divergence, it does not assume it.
