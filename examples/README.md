# examples

Eval fixtures for the skill and engine. Per the best-practices doc, build these
before expanding documentation — each is a minimal repo the skill must handle:

- `next-app-tailwind/` — Next.js App Router, class-based `.light`/`.dark` themes (the canonical case).
- `vite-cssvars/` — Vite + React, `[data-theme]` attribute theming.
- `vue-tailwind/` — out of v1 scope; reserved for when the framework-agnostic
  renderer lands.

Each fixture pairs a token-source CSS file with an `expected` config so the
extractor and mount steps can be checked against a known-good baseline.

(Fixtures are added as the skill is exercised against real projects.)
