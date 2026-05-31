# Build Workflow

The sequence is load-bearing: each layer constrains the one above it. Define
tokens before components, build components before composing screens. Out of
order guarantees rework.

## Progress checklist

Copy this and check off as you go:

```
Design System Build:
- [ ] Phase 0: Audit / extract existing values
- [ ] Phase 1: Define token layer (primitive + semantic)
- [ ] Phase 2: Init primitive layer (Base UI via shadcn), wire to tokens
- [ ] Phase 3: Add + restyle components as screens demand them
- [ ] Phase 4: Compose screens from existing components
- [ ] Phase 5: Refine by editing tokens, not instances
- [ ] Governance: decisions doc + contribution notes recorded
```

## Phase 0 — Audit / extract

For an existing site, mechanically pull every color, spacing value, font size,
radius, and shadow in use. Two outputs: the values that form a coherent scale,
and the accidental drift (e.g. eleven grays that should be four) to rationalize.
Also catalog the de facto components. This fixes scope by evidence, not ambition.

Don't do this by hand — use the toolkit's audit half (the
`auditing-design-systems` skill): run `extract-tokens.mjs` to pull existing
custom properties into a token catalog, and `design-audit drift`
(`@design-system-toolkit/cli`) to surface where current sources already
disagree. Build the new token layer (Phase 1) from that evidence.

## Phase 1 — Tokens

Primitive palette + semantic aliases only. Web-only → Tailwind `@theme`.
Multiplatform or external authoring → DTCG + Style Dictionary in CI.
(See token-architecture.md.)

## Phase 2 — Primitive layer

Init shadcn on Base UI; confirm components inherit project token variables, not
their own defaults.

## Phase 3 — Components on demand

Pull a component the moment a screen needs it; restyle appearance only; never
touch behavior/accessibility internals. Hand-code anything below the complexity
threshold. (See component-patterns.md.)

## Phase 4 — Compose

Build screens from existing components and the spacing scale. If a needed token
or component doesn't exist, surface it explicitly rather than inlining a one-off.

## Phase 5 — Refine

Tune the *system* (tokens), not instances. A tempting one-off value becomes a
new semantic token instead. Changes then propagate everywhere.

## Governance handoff

Deliverables that matter when the author leaves: token source files, the build
config/CI step, the audit + decisions doc (why the grays collapsed to four), and
a one-page contribution guide (how to add a token, add a component, cut a
version). Semantic-version the token package.

---

## Prompt patterns (code-first operator prompts)

Once a project `CLAUDE.md` carries the constraints, prompts stay vague about
*implementation* and strict only where the rules file doesn't already enforce.

**Tokens:**
> Scaffold Vite + React + TS + Tailwind v4. In `@theme`, define a two-tier token
> set: a small primitive palette plus semantic aliases (text.primary, surface,
> border, accent), an 8px spacing scale, 3–4 type sizes, 2 radii. No component
> code yet.

**Primitive layer:**
> Init shadcn on the Base UI primitive layer. Wire its theme to my `@theme`
> tokens — confirm components inherit my CSS variables, not their own defaults.

**Add + restyle a component:**
> Add the shadcn dialog and select via CLI. Restyle to my tokens only (surface,
> border, radius, spacing). Don't touch behavior or accessibility internals.
> Show me the styling diff.

**Compose a screen:**
> Build the settings screen from existing components, using only spacing/type
> from the scale. If you need a component or token that doesn't exist, list it
> and ask before inventing anything inline.

**Refine:**
> The accent is too saturated and cards too tight. Fix by changing the relevant
> tokens, not individual component styles. If a fix only makes sense as a
> one-off, propose it as a new semantic token instead.
