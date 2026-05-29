# design-audit

A design-system **integrity auditor**. It answers two questions:

1. **Is the rendered system internally healthy?** — WCAG contrast, theme consistency, legacy leftovers.
2. **Are the multiple sources of truth in sync?** — drift between code, Style Dictionary / DTCG tokens, Figma variables, and Storybook.

Everything flows through one normalized model (`Token` / `TokenSet` / `Component` / `Finding`). Each input is an **adapter** that maps into that model; the diff engine and renderers only read the model, never a raw source. Adding a new source = adding an adapter, with no engine change.

## Packages

| Package | What it is | Deps |
|---|---|---|
| [`@design-audit/core`](packages/core) | The engine: model, color/contrast math, diff, code adapter. Framework-pure, zero runtime deps. | none |
| [`@design-audit/react`](packages/react) | Config-driven `<DesignAudit>` + `useTokens` hook for React/Tailwind apps. | react, core |
| [`skill/`](skill) | A Claude Skill that detects a repo's framework, extracts its tokens to config, mounts the audit route, and verifies. | — |

## Scope

**v1 targets React + Tailwind.** The framework-agnostic renderer (Web Component, for Vue/Svelte/Astro/plain) is deliberately deferred — but `core` is kept framework-pure so that widening later is additive, not a rewrite.

## Roadmap

Each phase is one adapter into the same engine:

- **v1 — code adapter** (now): live token values via `getComputedStyle`, contrast, legacy flags.
- **v2 — Style Dictionary / DTCG adapter**: file-based `.tokens.json` ↔ code drift.
- **v3 — Figma adapter**: variables via MCP/REST + Code Connect for component↔code mapping.
- **v4 — Storybook adapter**: which components/variants are actually exercised.

"Drift" requires an **authority policy** (which source is treated as truth) — set per project; the tool reports divergence, it does not assume it.
