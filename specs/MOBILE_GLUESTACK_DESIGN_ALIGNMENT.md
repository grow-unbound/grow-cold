# Mobile (GlueStack) ↔ design system alignment

This checklist maps the documented GrowCold design system ([DESIGN_SYSTEM_V1.md](./DESIGN_SYSTEM_V1.md), [COMPONENT_SPECS.md](./COMPONENT_SPECS.md)) to future work on **`apps/mobile`** using **GlueStack UI** tokens and components. No implementation commitment here — use this when extending `gluestack-ui` theme config or design tokens.

## Color tokens (hex → GlueStack)

| Role | Hex | Notes for GlueStack |
|------|-----|---------------------|
| Primary (CTA, focus) | `#EA580C` | Map to primary action color / `$primary500` (or your token naming). |
| Secondary (links, secondary actions) | `#0891B2` | Secondary / info-stable accent. |
| Accent (notifications, premium) | `#7C3AED` | Tertiary accent slot if available. |
| Danger | `#FB6B3C` | Error / destructive (warm red, not cold). |
| Success | `#34D399` | Positive / cleared / active lot states. |
| Warning / stale | `#FBBF24` | Aging / caution. |
| Neutral text primary | `#374151` | `neutral-700` equivalent. |
| Neutral text secondary | `#6B7280` | `neutral-500` equivalent. |
| Borders / dividers | `#E5E7EB` | `neutral-200` equivalent. |
| Page background | `#F9FAFB` | `neutral-50` equivalent. |

**Status chips (lot):** See `status.*` in [apps/web/tailwind.config.ts](../apps/web/tailwind.config.ts) (`active`, `stale`, `delivered`, `cleared`, `writtenOff`, `disputed`) — align badge / text colors in GlueStack to the same hex values for cross-platform consistency.

## Typography

| Usage | Spec | GlueStack direction |
|-------|------|---------------------|
| Body | 16px / 1.5 / 400 | Prefer `$md` or custom token ≥ 16px body; avoid &lt; 16px for critical content on mobile. |
| Body small (hints, meta) | 14px / ~1.43 / 400 | Secondary text token. |
| Labels / badges | 12px / semibold | Form labels and tags. |
| H1 / screen titles | 32px (28px small) | Large heading token. |
| H2 / sections | 24px | Section headings. |
| H3 / cards | 20px | Card titles. |

Design system rationale: system/native fonts, no custom webfonts required on mobile — GlueStack defaults are fine once sizes/weights match.

## Spacing, touch, motion

- **Touch targets:** web uses **~40×40px** minimum (`min-h-touch` / `min-w-touch`); GlueStack controls should keep **≥40px** effective tap area on mobile.
- **Between tap targets:** ≥ **8px** gap between adjacent targets (WCAG 2.2 spacing); prefer **12–16px** for dense toolbars.
- **Transitions:** ~**200ms** for buttons; skeleton shimmer **1.5s** loop per [COMPONENT_SPECS.md](./COMPONENT_SPECS.md) — mirror perceived timing, not necessarily CSS `animation-*`.
- **Skeletons:** Prefer GlueStack `Skeleton` (or equivalent) with dimensions close to final layout to avoid layout shift.

## Behaviors (parity with specs)

- **Offline / queue:** Top bar + queue badge patterns in [DESIGN_SYSTEM_SUMMARY.md](./DESIGN_SYSTEM_SUMMARY.md) — implement in mobile navigation shell when sync UI exists.
- **Forms:** Label + input + help + `error` copy; never use placeholder-only labels; required field `*` with semantic props.
- **Destructive actions:** Confirm before delete/write-off; primary destructive styling uses danger palette.

## References

- [DESIGN_SYSTEM_V1.md](./DESIGN_SYSTEM_V1.md) — full palette, type scale, spacing, patterns.
- [COMPONENT_SPECS.md](./COMPONENT_SPECS.md) — button/input/card/modal/skeleton/toast behavior.
- Web implementation reference: [apps/web/tailwind.config.ts](../apps/web/tailwind.config.ts) (token source of truth for hex/radius/shadow names).
