# design-system-toolkit

A toolkit for **design engineers** — Claude skills and npm libraries that help you
*build* a design system and keep it *true* as it grows. Two halves that share one
token model:

- **Build** — create a minimal-but-complete system (tokens → primitives → components → screens).
- **Audit** — verify the rendered system stays internally healthy (WCAG contrast) and in sync across its sources of truth (code, Style Dictionary/DTCG, Figma, Storybook).

> Status: published on npm at **0.1.0** (`@design-system-toolkit/*`). v1 audit surface targets React + Tailwind; the engine is framework-pure.

## Install

```bash
# Audit page for a React app (pulls core automatically)
npm i @design-system-toolkit/react

# Drift CLI for CI (provides the `design-audit` command)
npm i -D @design-system-toolkit/cli
# …or run it one-off:
npx @design-system-toolkit/cli drift --css globals.css --tokens dark=tokens/dark.json

# Just the engine (build your own adapter / diff)
npm i @design-system-toolkit/core
```

Requirements: React ≥ 18 for the `react` package; Node ≥ 18 for the CLI/engine.

## Quick start

**Audit page** — a live `/style-guide` that reads your token values from rendered
CSS in both themes, computes WCAG contrast, and flags legacy colors:

```jsx
import { DesignAudit } from '@design-system-toolkit/react'
import config from './design-audit.config.json'   // generated, see below

export default function StyleGuide() {
  return <DesignAudit config={config} title="Style Guide" />
}
```

Generate `design-audit.config.json` from your CSS custom properties (no hand-writing):

```bash
node skills/auditing-design-systems/scripts/extract-tokens.mjs src/app/globals.css > design-audit.config.json
```

The `auditing-design-systems` skill automates the whole flow (detect framework →
extract → mount the route → verify). See [skills/auditing-design-systems](skills/auditing-design-systems).

**Drift check** — diff your code tokens against design-source tokens, and fail CI on real drift:

```bash
design-audit drift --css src/app/globals.css \
  --tokens dark=tokens/dark.json --tokens light=tokens/light.json \
  --primitives tokens/primitives.json
```

## Skills

Claude Agent Skills — the reusable *methods*. Load whichever fits the task.

| Skill | What it does |
|---|---|
| [`building-design-systems`](skills/building-design-systems) | Build/extend a design system from scratch or a minimal site: token architecture, component strategy (behavior/appearance split, primitive selection), and the sequenced build workflow. Ships a `CLAUDE.md` enforcement template. |
| [`auditing-design-systems`](skills/auditing-design-systems) | Install the live `/style-guide` audit page, generate its config from your CSS, and verify it. Bundles `extract-tokens.mjs`. |

The two compose: the build skill's **Phase 0 (audit/extract)** runs the audit skill's extractor + the drift CLI to fix scope by evidence. Both share one canonical token naming (`surface`/`text`/`border`/`accent`).

## Libraries

| Package | What it is | Deps |
|---|---|---|
| [`@design-system-toolkit/core`](packages/core) | The engine: normalized `Token`/`TokenSet`/`Component`/`Finding` model, color/WCAG-contrast math, drift `diff`, and source **adapters** (code · cssStatic · DTCG · Figma variables). Zero runtime deps. | none |
| [`@design-system-toolkit/react`](packages/react) | Config-driven `<DesignAudit>` + `useTokens` hook for React apps. | react, core |
| [`@design-system-toolkit/cli`](packages/cli) | `design-audit drift` — diff code (CSS) tokens against DTCG/Style Dictionary files. CI-friendly (non-zero exit on drift). | core |

**The normalized model is the seam.** Each input is an *adapter* that maps into
`Token`/`TokenSet`; the diff engine and renderers only read the model, never a raw
source. Adding a new source (Figma, Storybook, …) = adding an adapter, with no
engine change.

## CLI reference

```
design-audit drift --css <file> --tokens <theme>=<file> [options]
```

| Option | Purpose |
|---|---|
| `--css <file>` | Code source: CSS file declaring token custom properties (required) |
| `--tokens <theme>=<file>` | DTCG token file per theme (repeatable, required) |
| `--primitives <file>` | DTCG primitives, for resolving `{aliases}` |
| `--authority code\|tokens` | Which source is the truth (default: `code`) |
| `--alias <from>=<to>` | Declare a cross-source equivalent, e.g. `color.accent.default=color.accent` (repeatable) |
| `--normalize-separators` | Match hyphen vs dot (`bg.card-hover` ≡ `bg.card.hover`) |
| `--strict` | Also fail on `missing`/`extra` (coverage), not just `value-mismatch` |
| `--json` | Emit findings as JSON |

Exits non-zero on a `value-mismatch` by default. `--alias` + `--normalize-separators`
suppress representation noise so only genuine drift surfaces.

## Roadmap

Each adapter is one source into the same diff engine:

- **v1 — code adapter** ✅: live values via `getComputedStyle` (browser) + `cssStatic` (headless), contrast, legacy flags.
- **v2 — Style Dictionary / DTCG adapter** ✅: `dtcgToTokenSet` ($type inheritance, aliases, alpha hex). Exposed via the CLI.
- **v3 — Figma adapter** ✅ (variables): `figmaVariablesToTokenSet` consumes the Figma MCP `get_variable_defs` map. Live-verified. Next: Code Connect; file-level variables for coverage.
- **v4 — Storybook adapter**: which components/variants are actually exercised.

"Drift" requires an **authority policy** (which source is truth) — set per project; the tool reports divergence, it doesn't assume it.

## Develop

```bash
npm install     # workspaces: packages/* + examples/*
npm test        # builds core, runs core + cli tests
npm run build   # bundle core + react to dist via esbuild
```

`examples/vite-react` is a runnable harness that mounts `<DesignAudit>`.

## License

MIT — see [LICENSE](LICENSE).
