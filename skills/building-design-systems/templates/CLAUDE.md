# Project Conventions

> Thin, project-specific enforcement. The reusable *method* lives in the
> `building-design-systems` Skill — this file holds only what is true for THIS
> repo plus the always-on rules.

## Design system rules (always apply, every change)

- All color / spacing / type / radius values MUST reference theme tokens. Never
  hardcode hex, px, or rem in a component.
- Complex interactive components (dialog, select, combobox, popover, tabs,
  tooltip, slider) MUST be built on the project's primitive layer. Never
  hand-roll interaction, focus, or ARIA logic.
- Simple elements (button, card, badge, layout) are styled with theme utility
  classes only.
- If a needed value isn't in the tokens, STOP and propose a new semantic token
  rather than inlining a one-off.
- When composing screens, reuse existing components and the spacing scale. If a
  component or token doesn't exist yet, list it and ask before inventing inline.

## This project's specifics  <!-- fill in per repo -->

- **Stack:** <!-- e.g. Vite + React + TS + Tailwind v4 -->
- **Token source:** <!-- e.g. src/styles/theme.css @theme block -->
- **Primitive layer:** <!-- e.g. Base UI via shadcn -->
- **Components live in:** <!-- e.g. src/components/ui/ -->
- **Token naming in use:** <!-- e.g. color.text.primary, color.surface.*, color.border.*, color.accent -->

## Notes

- Token changes propagate globally — tune the system, not instances.
- Do NOT introduce component-level tokens, multi-theme infrastructure, or a
  connected-docs platform without an explicit, present need.
