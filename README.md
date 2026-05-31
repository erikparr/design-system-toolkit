# design-system-toolkit

A toolkit for **design engineers** — skills and libraries that help you *build* a
design system and keep it *true* as it grows. Two halves that share one token model:

- **Build** — create a minimal-but-complete system (tokens → primitives → components → screens).
- **Audit** — verify the rendered system stays internally healthy and in sync across its sources of truth (code, Style Dictionary/DTCG, Figma, Storybook).

## Skills

Claude Agent Skills — the reusable *methods*. Load whichever fits the task.

| Skill | What it does |
|---|---|
| [`building-design-systems`](skills/building-design-systems) | Build/extend a design system from scratch or a minimal site: token architecture, component strategy (behavior/appearance split, primitive selection), and the sequenced build workflow. Ships a `CLAUDE.md` enforcement template. |
| [`auditing-design-systems`](skills/auditing-design-systems) | Install a live `/style-guide` audit page into a React+Tailwind app that reads token values from rendered CSS, computes WCAG contrast, and flags issues. Bundles `extract-tokens.mjs`. |

The two compose: the build skill's **Phase 0 (audit/extract)** runs the audit skill's extractor + the drift CLI to fix scope by evidence.

## Libraries

The audit engine + surfaces, framework-pure where it counts.

| Package | What it is | Deps |
|---|---|---|
| [`@design-system-toolkit/core`](packages/core) | The engine: normalized `Token`/`TokenSet`/`Component`/`Finding` model, color/WCAG-contrast math, drift `diff`, and source **adapters** (code · cssStatic · DTCG · Figma variables). Zero runtime deps. | none |
| [`@design-system-toolkit/react`](packages/react) | Config-driven `<DesignAudit>` + `useTokens` hook for React/Tailwind apps. | react, core |
| [`@design-system-toolkit/cli`](packages/cli) | `design-audit drift` — diff code (CSS) tokens against DTCG/Style Dictionary files. CI-friendly (non-zero exit on drift). | core |

Everything flows through the normalized model: each input is an **adapter** that maps into it; the diff engine and renderers only read the model, never a raw source. Adding a new source = adding an adapter, no engine change.

## Drift CLI

```bash
design-audit drift --css src/app/globals.css \
  --tokens dark=tokens/dark.json --tokens light=tokens/light.json \
  --primitives tokens/primitives.json
```

Exits non-zero on a `value-mismatch` (genuine disagreement); `--strict` also gates on `missing`/`extra` (coverage/naming). `--json` for pipelines, `--authority code|tokens` to choose the source of truth.

Suppress representation noise so only real drift surfaces: `--normalize-separators` matches hyphen vs dot (`bg.card-hover` ≡ `bg.card.hover`), and `--alias <from>=<to>` (repeatable) declares cross-source equivalents (e.g. `--alias color.accent.default=color.accent`).

## Audit scope & roadmap

**v1 targets React + Tailwind** for the audit *page*; `core` stays framework-pure so the engine widens additively. Each adapter is one source into the same diff engine:

- **v1 — code adapter** ✅: live token values via `getComputedStyle` (browser) + `cssStatic` (headless), contrast, legacy flags.
- **v2 — Style Dictionary / DTCG adapter** ✅: `dtcgToTokenSet` ($type inheritance, aliases, alpha hex) → `diffTokenSets`. Exposed via the CLI.
- **v3 — Figma adapter** ✅ (variables): `figmaVariablesToTokenSet` consumes the Figma MCP `get_variable_defs` map. Live-verified. Next: Code Connect; file-level variables for coverage.
- **v4 — Storybook adapter**: which components/variants are actually exercised.

"Drift" requires an **authority policy** (which source is truth) — set per project; the tool reports divergence, it doesn't assume it.
