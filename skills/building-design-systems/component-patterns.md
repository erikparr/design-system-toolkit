# Component Patterns

## Contents
- The behavior / appearance split
- The complexity threshold
- Choosing the primitive layer
- The shadcn ownership model
- Library per component

## The behavior / appearance split

Every component is two stacked things:

- **Behavior** — focus management, keyboard nav, ARIA wiring, open/close state,
  positioning, collision detection. Tedious, high-stakes, easy to get wrong.
- **Appearance** — your brand. The reason the design system exists.

Inherit behavior from a headless primitive. Author appearance with tokens.
Never hand-author behavior; never inherit appearance (that's what pre-styled
libraries like MUI/Ant get wrong for design-system work — you fight their
visual opinions).

## The complexity threshold

**Below it — hand-code (a dependency is overkill):**
button, card, badge, input, label, layout/stack, typography.

**Above it — never hand-code (use a primitive):**
dialog, select, combobox/autocomplete, dropdown menu, popover, tooltip, tabs,
slider, date picker, command palette, data table.

The dividing line is interaction-state complexity. Anything with focus traps,
keyboard navigation, or floating positioning is above the line.

## Choosing the primitive layer

- **Base UI** — default for new systems. MUI-backed, actively maintained,
  clean TypeScript APIs.
- **Radix** — fine if already in the codebase; broad coverage, but slower
  update velocity post-acquisition. Don't migrate an existing Radix system
  without a reason.
- **React Aria** — pick when AAA accessibility is a hard requirement.
- **Ark UI** — pick when spanning React + Vue + Svelte from one API.

Choose **one** as the foundation. Don't mix primitive layers.

## The shadcn ownership model

shadcn is a *distribution pattern*, not a library: pre-composed components built
on the chosen primitive, copied into your repo as source you own and restyle.
It now sits on either Radix or Base UI, so it's an on-ramp, not a primitive
choice. Trade-off: you own the code, so you own the bugs — the right trade for a
team that must maintain the system without the original author.

Rule: shadcn components must be rewired to reference project tokens, never their
shipped defaults.

## Library per component

| Need | Reach for |
| --- | --- |
| Dialog, select, popover, tabs, tooltip, slider | Base UI (via shadcn) |
| Anchoring / collision for custom floating UI | Floating UI |
| Data grid (sort/filter/paginate logic) | TanStack Table (headless) |
| Long list performance | TanStack Virtual |
| Form state + validation | React Hook Form |
| Command menu | cmdk |
| Button, card, badge, layout | none — hand-code with tokens |

The connecting pattern is *headless*: logic without markup or styling. "Headless
by default" is the correct stance for a design-system builder — maximal
reduction in hand-coding while keeping full visual ownership.
