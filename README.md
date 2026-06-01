# design-system-toolkit

Build a design system, then keep it honest — Claude skills for the build and npm libraries that audit the result.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm: core](https://img.shields.io/npm/v/@design-system-toolkit/core?label=core)](https://www.npmjs.com/package/@design-system-toolkit/core)
[![npm: react](https://img.shields.io/npm/v/@design-system-toolkit/react?label=react)](https://www.npmjs.com/package/@design-system-toolkit/react)
[![npm: cli](https://img.shields.io/npm/v/@design-system-toolkit/cli?label=cli)](https://www.npmjs.com/package/@design-system-toolkit/cli)

## About

A toolkit for **design engineers**, in two halves that share one token model:

- **Build** — Claude Agent Skills that take you from tokens → primitives → components → screens, so you end up with a minimal-but-complete system.
- **Audit** — npm libraries that verify the *rendered* system stays internally healthy (WCAG contrast) and in sync across its sources of truth (code, Style Dictionary/DTCG, Figma, Storybook).

The seam between them is a **normalized token model**. Each input — your CSS, a DTCG file, Figma variables — is mapped by an *adapter* into the same `Token`/`TokenSet` shape. The diff engine and renderers only ever read the model, never a raw source, so adding a new source means adding an adapter with no engine change.

> Status: published on npm as `@design-system-toolkit/*` (0.1.x). The v1 audit surface targets React + Tailwind; the engine itself is framework-pure.

## Features

- **Live contrast auditing** — a `/style-guide` page that reads real token values from rendered CSS in both themes and flags WCAG failures and legacy colors.
- **Cross-source drift detection** — diff code tokens against design-source tokens and fail CI on genuine mismatches.
- **Pluggable adapters** — `code`, `cssStatic`, DTCG/Style Dictionary, and Figma variables, all into one model.
- **Framework-pure core** — zero runtime dependencies; bring your own renderer.
- **Build skills** — opinionated, sequenced workflows that ship a `CLAUDE.md` enforcement template.

## Installation

```bash
# Audit page for a React app (pulls core automatically)
npm i @design-system-toolkit/react

# Drift CLI for CI (provides the `design-audit` command)
npm i -D @design-system-toolkit/cli

# Just the engine (build your own adapter / diff)
npm i @design-system-toolkit/core
```

### Requirements

- React ≥ 18 for `@design-system-toolkit/react`
- Node ≥ 18 for the CLI and engine

## Usage

**Audit page** — a live `/style-guide` that reads your token values from rendered CSS in both themes, computes WCAG contrast, and flags legacy colors:

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

The `auditing-design-systems` skill automates the whole flow — detect framework → extract → mount the route → verify. See [skills/auditing-design-systems](skills/auditing-design-systems).

**Drift check** — diff your code tokens against design-source tokens, and fail CI on real drift:

```bash
design-audit drift --css src/app/globals.css \
  --tokens dark=tokens/dark.json --tokens light=tokens/light.json \
  --primitives tokens/primitives.json
```

### More examples

`examples/vite-react` is a runnable harness that mounts `<DesignAudit>`.

## Skills

Claude Agent Skills are the reusable *methods*. Load whichever fits the task.

| Skill | What it does |
|---|---|
| [`building-design-systems`](skills/building-design-systems) | Build or extend a design system from scratch or a minimal site: token architecture, component strategy (behavior/appearance split, primitive selection), and the sequenced build workflow. Ships a `CLAUDE.md` enforcement template. |
| [`auditing-design-systems`](skills/auditing-design-systems) | Install the live `/style-guide` audit page, generate its config from your CSS, and verify it. Bundles `extract-tokens.mjs`. |

The two compose: the build skill's **Phase 0 (audit/extract)** runs the audit skill's extractor plus the drift CLI to scope work by evidence. Both share one canonical token naming (`surface`/`text`/`border`/`accent`).

## Libraries

| Package | What it is | Deps |
|---|---|---|
| [`@design-system-toolkit/core`](packages/core) | The engine: normalized `Token`/`TokenSet`/`Component`/`Finding` model, color/WCAG-contrast math, drift `diff`, and source **adapters** (code · cssStatic · DTCG · Figma variables). Zero runtime deps. | none |
| [`@design-system-toolkit/react`](packages/react) | Config-driven `<DesignAudit>` and `useTokens` hook for React apps. | react, core |
| [`@design-system-toolkit/cli`](packages/cli) | `design-audit drift` — diff code (CSS) tokens against DTCG/Style Dictionary files. CI-friendly (non-zero exit on drift). | core |

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

Exits non-zero on a `value-mismatch` by default. `--alias` and `--normalize-separators` suppress representation noise so only genuine drift surfaces.

"Drift" requires an **authority policy** (which source is truth), set per project. The tool reports divergence; it doesn't assume which side is wrong.

## Contributing

Contributions are welcome. This is an npm workspace monorepo (`packages/*` + `examples/*`).

```bash
npm install     # install all workspaces
npm test        # builds core, runs core + cli tests
npm run build   # bundle core + react to dist via esbuild
```

Adding a new source is the common contribution: write an adapter that maps into `Token`/`TokenSet` — the diff engine and renderers need no changes.

## License

design-system-toolkit is licensed under the MIT license. See the [`LICENSE`](LICENSE) file for more information.
