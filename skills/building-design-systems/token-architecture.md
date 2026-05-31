# Token Architecture

## Contents
- Two-tier model
- Naming
- Web-only default: Tailwind `@theme`
- Upgrade path: DTCG + Style Dictionary
- The propagation guarantee

## Two-tier model

**Primitive (global)** — raw values, no meaning attached:

```
gray.50 … gray.900, brand.500, space.1 … space.12, radius.sm/md/lg, text.sm/base/lg/xl
```

**Semantic (alias)** — intent, referencing primitives:

```
color.text.primary      → gray.900
color.text.muted        → gray.600
color.surface.base      → white
color.surface.raised    → gray.50
color.border.default    → gray.200
color.accent            → brand.500
space.inset.md          → space.4
```

Stop here. A **component tier** (`button.padding.x`) is real but premature for a
startup — it adds indirection to maintain with no current payoff. Leave it
spec'd, not built.

## Naming

- Semantic names describe *role*, not appearance (`surface.raised`, not
  `light-gray-bg`). This is what makes dark mode a token-set swap instead of a
  find-and-replace.
- One term per concept throughout. Pick `surface`/`text`/`border`/`accent` and
  never drift to `bg`/`fg`/`outline`.

## Web-only default: Tailwind `@theme`

For a single web target with designer == engineer, Tailwind v4's `@theme` block
**is** the token layer. It compiles tokens to CSS custom properties — you get
single-source-of-truth discipline with no separate build step.

```css
@theme {
  /* primitive */
  --color-gray-900: #18181b;
  --color-gray-600: #52525b;
  --color-gray-200: #e4e4e7;
  --color-brand-500: #4f46e5;
  --spacing-4: 1rem;
  --radius-md: 0.5rem;

  /* semantic (alias to primitive) */
  --color-text-primary: var(--color-gray-900);
  --color-surface-raised: var(--color-gray-50);
  --color-border-default: var(--color-gray-200);
  --color-accent: var(--color-brand-500);
}
```

## Upgrade path: DTCG + Style Dictionary

Adopt this the day a second platform (iOS, Android, email) appears, or a
separate designer needs a tool-agnostic source. Author tokens in DTCG/W3C JSON;
Style Dictionary transforms one source into every platform output.

`tokens.json` (DTCG):

```json
{
  "color": {
    "brand": { "500": { "$type": "color", "$value": "#4f46e5" } },
    "text":  { "primary": { "$type": "color", "$value": "{color.gray.900}" } }
  }
}
```

`style-dictionary.config.js` (minimal):

```js
export default {
  source: ["tokens/**/*.json"],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "build/css/",
      files: [{ destination: "tokens.css", format: "css/variables" }]
    }
    // add ios/android/etc. platforms here later — same source
  }
};
```

Run in CI: change a value once, regenerate every output, zero manual syncing.

## The propagation guarantee

Because components reference semantic tokens and never literal values, changing
`--color-accent` (or its DTCG source) updates every button, focus ring, link,
and active state everywhere. That single guarantee is the entire reason tokens
exist — protect it by never allowing a literal value into a component file.
