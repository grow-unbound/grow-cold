# Mobile (GlueStack) ↔ design system alignment

This checklist maps the documented GrowCold design system ([DESIGN_SYSTEM_V1.md](./DESIGN_SYSTEM_V1.md), [COMPONENT_SPECS.md](./COMPONENT_SPECS.md)) to **`apps/mobile`** using **GlueStack UI** tokens and components. Theme overrides live in [`apps/mobile/src/theme/gluestack.config.ts`](../apps/mobile/src/theme/gluestack.config.ts) (extends `@gluestack-ui/config`).

## Color tokens (hex → GlueStack)

| Role | Hex | Notes for GlueStack |
|------|-----|---------------------|
| Primary (CTA, brand) | `#00B14F` | `primary500` … `primary700` in custom config; tab bar active tint |
| Primary tint | `#C4ECD4` | `primary50` / `primary100` |
| Text (Tuna) | `#363A45` | `textLight900` override in custom config |
| Page / muted bg | `#F7F7F8` | `backgroundLight50` override |
| Secondary (neutral) | `#6B7280` | Default secondary scale in base config still available for grays |
| Accent (mint) | `#7BDCB5` | Use for receipt / alternate rows when matching web `accent-*` |
| Danger | `#EF4444` | Error / destructive |
| Success | `#1FA85A` | Positive / cleared / active lot states |
| Warning / stale | `#F59E0B` | Aging / caution |
| Borders / dividers | `#E2E4E8` | Align with web `neutral-200` |

**Status chips (lot):** See `status.*` in [apps/web/tailwind.config.ts](../apps/web/tailwind.config.ts) — align badge / text colors in GlueStack to the same hex values for cross-platform consistency.

## Typography

| Usage | Spec | GlueStack direction |
|-------|------|---------------------|
| Body | 16px / 1.5 / 400 | Prefer `$md` or custom token ≥ 16px body; avoid &lt; 16px for critical content on mobile. |
| Body small (hints, meta) | 14px / ~1.43 / 400 | Secondary text token. |
| Labels / badges | 12px / semibold | Form labels and tags. |
| H1 / screen titles | 24px | Large heading token (matches `text-h1` on web). |
| H2 / sections | 20px | Section headings. |
| H3 / cards | 18px | Card titles. |

Design system rationale: system/native fonts — GlueStack defaults are fine once sizes/weights match.

## Spacing, touch, motion

- **Touch targets:** web standard is **44px** min height for primary controls (`min-h-touch`). On GlueStack, match that for main CTAs and list rows; compact chips may use **~40px** height.
- **Between tap targets:** ≥ **8px** gap (standard / WCAG 2.2); prefer **12–16px** in dense toolbars.
- **Transitions:** ~**200ms** for buttons; skeleton shimmer **1.5s** loop per [COMPONENT_SPECS.md](./COMPONENT_SPECS.md) — mirror perceived timing, not necessarily CSS `animation-*`.
- **Skeletons:** Prefer GlueStack `Skeleton` (or equivalent) with dimensions close to final layout to avoid layout shift.

## Behaviors (parity with specs)

- **Offline / queue:** Top bar + queue badge patterns in [DESIGN_SYSTEM_SUMMARY.md](./DESIGN_SYSTEM_SUMMARY.md) — implement in mobile navigation shell when sync UI exists.
- **Forms:** Label + input + help + `error` copy; never use placeholder-only labels; required field `*` with semantic props.
- **Destructive actions:** Confirm before delete/write-off; primary destructive styling uses danger palette.

## React Navigation (tabs)

- **Active tint:** `#00B14F` (see `RootTabs.tsx` `tabBarActiveTintColor`).
- **Inactive tint:** `#9CA0AD`.
- **Tab bar border:** `#E2E4E8`.

## References

- [DESIGN_SYSTEM_V1.md](./DESIGN_SYSTEM_V1.md) — full palette, type scale, spacing, patterns.
- [COMPONENT_SPECS.md](./COMPONENT_SPECS.md) — button/input/card/modal/skeleton/toast behavior.
- Web implementation reference: [apps/web/tailwind.config.ts](../apps/web/tailwind.config.ts) (token source of truth for hex/radius/shadow names).
