import { config as baseConfig } from '@gluestack-ui/config';
import { colors as t } from '@growcold/tokens';

/** GrowCold Brand v3 — amber brand, warm surfaces, teal/rust/amber semantics. */
const brandTokens = {
  // Surfaces
  bgPage:    t.bgPage,
  bgSurface: t.bgSurface,
  bgSubtle:  t.bgSubtle,
  bgInset:   t.bgInset,

  // Text
  textPrimary:     t.textPrimary,
  textSecondary:   t.textSecondary,
  textTertiary:    t.textTertiary,
  textPlaceholder: t.textPlaceholder,
  textOnBrand:     t.textOnBrand,

  // Brand — two-token system
  brandUi:      t.brandUi,
  brandUiHover: t.brandUiHover,
  brandUiPress: t.brandUiPress,
  brandText:    t.brandText,
  brandSubtle:  t.brandSubtle,
  brandBorder:  t.brandBorder,

  // Semantic states (teal = inward, rust = outward, amber-dark = pending)
  inward:       t.inward,
  inwardBg:     t.inwardBg,
  inwardBorder: t.inwardBorder,

  outward:       t.outward,
  outwardBg:     t.outwardBg,
  outwardBorder: t.outwardBorder,

  pending:       t.pending,
  pendingBg:     t.pendingBg,
  pendingBorder: t.pendingBorder,

  // Borders
  borderDefault: t.borderDefault,
  borderStrong:  t.borderStrong,
} as const;

export const config = {
  ...baseConfig,
  tokens: {
    ...baseConfig.tokens,
    colors: {
      ...baseConfig.tokens.colors,
      ...brandTokens,
    },
  },
};

// Typed token helpers for use in StyleSheet / inline styles
export const gc = brandTokens;
