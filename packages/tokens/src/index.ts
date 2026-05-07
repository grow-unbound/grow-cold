// GrowCold Design Tokens — Brand Language v3
// Single source of truth for Tailwind (web) and GlueStack (mobile).
// DO NOT add dark mode values here — dark mode is handled per-platform via CSS vars / GlueStack colorMode.

export const colors = {
  // Surfaces — light mode
  bgPage:    '#FEFCF8',
  bgSurface: '#FFFFFF',
  bgSubtle:  '#F5F0E8',
  bgInset:   '#EDE6D9',

  // Text
  textPrimary:     '#1C1A16',
  textSecondary:   '#4A4237',
  textTertiary:    '#7A6F61',
  textPlaceholder: '#C0B8B0',
  textOnBrand:     '#FFFFFF',

  // Brand — two-token system
  // brand-ui:   fills, icons, active indicators — NEVER body text
  // brand-text: any text/label using brand colour (AA+ contrast)
  brandUi:       '#C8712A',
  brandUiHover:  '#AD5E1F',
  brandUiPress:  '#9A5418',
  brandText:     '#8C4A12',
  brandSubtle:   '#F5E8D8',
  brandBorder:   '#E0B08A',

  // Semantic states — semantics are locked, never cross these:
  //   inward  = arriving, positive, confirmed  (teal)
  //   outward = leaving, errors, destructive   (rust)
  //   pending = waiting, offline queue         (amber-dark)
  inward:        '#0B7B6E',
  inwardBg:      '#E6F5F3',
  inwardBorder:  '#A8DDD7',

  outward:       '#A83422',
  outwardBg:     '#F7EAE7',
  outwardBorder: '#E0B8B0',

  pending:       '#7B5200',
  pendingBg:     '#FAF2D9',
  pendingBorder: '#E0CC88',

  // Generic borders
  borderDefault: '#E5DED2',
  borderStrong:  '#C9BFB0',
  focusRing:     'rgba(200, 113, 42, 0.12)',
} as const;

export const spacing = {
  sp1:  4,
  sp2:  8,
  sp3:  12,
  sp4:  16,
  sp5:  20,
  sp6:  24,
  sp8:  32,
  sp10: 40,
  sp12: 48,
  sp16: 64,
} as const;

export const radius = {
  sm:   4,
  md:   8,
  lg:   12,
  xl:   16,
  pill: 9999,
} as const;

// Font sizes in px — input MUST stay at 16 to prevent iOS auto-zoom
export const fontSize = {
  display: 48,
  h1:      38,
  h2:      30,
  h3:      24,
  body:    15,
  small:   13,
  label:   11,
  number:  38,
  input:   16,
} as const;

export const fontWeight = {
  regular:   400,
  medium:    500,
  semibold:  600,
  bold:      700,
} as const;

export const fontFamily = {
  display: ['Noto Serif', 'Georgia', 'Times New Roman', 'serif'],
  body:    ['Noto Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
  mono:    ['Noto Sans Mono', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
} as const;

export const shadow = {
  sm:    '0 1px 2px rgba(28,26,22,0.05), 0 1px 1px rgba(28,26,22,0.03)',
  md:    '0 4px 12px rgba(28,26,22,0.08), 0 2px 4px rgba(28,26,22,0.04)',
  lg:    '0 8px 24px rgba(28,26,22,0.12), 0 4px 8px rgba(28,26,22,0.06)',
  focus: '0 0 0 3px rgba(200,113,42,0.12)',
} as const;

export const motion = {
  durationFast: '120ms',
  durationBase: '200ms',
  durationSlow: '350ms',
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easeIn:  'cubic-bezier(0.4, 0, 1, 1)',
} as const;

// Component sizing constants
export const size = {
  touchTarget:    48,
  controlSm:      28,
  controlDefault: 36,
  controlLg:      42,
  topbarHeight:   52,
  sidenavWidth:   200,
  tabbarHeight:   64,
  fabSize:        48,
} as const;

export type Colors  = typeof colors;
export type Spacing = typeof spacing;
export type Radius  = typeof radius;
