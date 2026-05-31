---
name: building-design-systems
description: Guides building a design system from scratch or from a minimal existing site — token architecture, component strategy, and the sequenced build workflow. Use when creating or extending a design system, defining design tokens, setting up Tailwind theme tokens or Style Dictionary, choosing component primitives (Base UI, Radix, React Aria, Ark UI), adopting shadcn, or establishing design-system governance for a web app.
---

# Building Design Systems

Build a minimal-but-complete design system that grows with the product. The
system is **extracted, not invented**: it codifies decisions already present in
the design, then makes them enforceable in code. Keep every layer proportional
to what has actually shipped.

## When to use

A new web app or a minimal existing site with good structure but no formal
system. Designer and engineer are often the same person, working code-first.

## Core principles (the whole method in five lines)

1. Tokens are the single source of truth. Every color, space, type, and radius
   value references a token. No hardcoded hex/px/rem, ever.
2. Two token tiers only — primitive (raw) → semantic (intent). No component
   tier until scale demands it.
3. Split every component into **behavior** and **appearance**. Inherit behavior
   from headless primitives; author appearance yourself.
4. Below the complexity threshold (button, card, badge, layout), hand-code.
   Above it (dialog, select, combobox, popover, tabs, tooltip, slider), never
   hand-code — use primitives.
5. The system **emerges** from building screens. Don't build it as a separate
   upfront project.

The binding, always-on version of these rules lives in the project's
`CLAUDE.md`. This Skill is the reusable *method*; `CLAUDE.md` is the
project-specific *enforcement*. (Template: [templates/CLAUDE.md](templates/CLAUDE.md).)

**Part of the design-system-toolkit.** Its companion Skill,
`auditing-design-systems`, verifies a built system (WCAG contrast, cross-source
drift) — Phase 0 of the workflow uses its extractor + drift CLI. **Canonical
token naming across both halves: `surface` / `text` / `border` / `accent`**
(role, not appearance — see [token-architecture.md](token-architecture.md)).

## Default stack

- **Styling + tokens:** Tailwind v4 (`@theme` block is the token layer for
  web-only projects)
- **Primitives:** Base UI (actively maintained default). Radix if already in
  tree; React Aria for AAA accessibility needs; Ark UI for multi-framework.
- **Distribution:** shadcn copy-paste model (you own the component source)
- **Utilities, only when a hard problem appears:** Floating UI (positioning),
  TanStack Table (data grids), React Hook Form (forms), cmdk (command menus)
- **Upgrade path:** Style Dictionary + DTCG JSON when a second platform or a
  separate design authoring tool enters the picture

## Reference files

- **Token architecture, naming, DTCG, Tailwind vs Style Dictionary:** see
  [token-architecture.md](token-architecture.md)
- **Component strategy — behavior/appearance split, primitive selection,
  complexity threshold, library-per-component:** see
  [component-patterns.md](component-patterns.md)
- **The sequenced build workflow + ready-to-use prompt patterns:** see
  [workflow.md](workflow.md)

## What NOT to build in v1

Component-level tokens, multi-theme/multi-brand infrastructure, and
connected-docs platforms (Supernova, zeroheight). The architecture should
*accommodate* these; building them before there is a second brand, platform, or
team is the standard way a startup design system dies of maintenance burden.
Storybook plus a short decisions doc is the right documentation weight.
