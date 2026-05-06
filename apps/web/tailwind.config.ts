import type { Config } from 'tailwindcss';
import type { PluginAPI } from 'tailwindcss/types/config';
import { colors as t, radius, shadow, motion } from '@growcold/tokens';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/shared/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    // Full color override — prevents Tailwind default palette (e.g. blue-500) from leaking
    colors: {
      transparent: 'transparent',
      current:     'currentColor',
      white:       '#FFFFFF',
      black:       '#000000',

      // Surfaces
      surface: {
        page:    t.bgPage,
        DEFAULT: t.bgSurface,
        subtle:  t.bgSubtle,
        inset:   t.bgInset,
      },

      // Text
      text: {
        primary:     t.textPrimary,
        secondary:   t.textSecondary,
        tertiary:    t.textTertiary,
        placeholder: t.textPlaceholder,
        'on-brand':  t.textOnBrand,
      },

      // Brand — two-token system (ui = fills/icons, text = labels)
      brand: {
        ui:       t.brandUi,
        hover:    t.brandUiHover,
        press:    t.brandUiPress,
        text:     t.brandText,
        subtle:   t.brandSubtle,
        border:   t.brandBorder,
      },

      // Semantic: teal = inward/positive, rust = outward/error, amber-dark = pending/offline
      inward: {
        DEFAULT: t.inward,
        bg:      t.inwardBg,
        border:  t.inwardBorder,
      },
      outward: {
        DEFAULT: t.outward,
        bg:      t.outwardBg,
        border:  t.outwardBorder,
      },
      pending: {
        DEFAULT: t.pending,
        bg:      t.pendingBg,
        border:  t.pendingBorder,
      },

      // Borders (also used as Tailwind border-* utilities)
      border: {
        DEFAULT: t.borderDefault,
        strong:  t.borderStrong,
      },

      // Lot/stock status aliases — map to semantic tokens
      status: {
        active:     t.inward,
        cleared:    t.inward,
        stale:      t.pending,
        disputed:   t.outward,
        delivered:  t.inward,
        writtenOff: t.textTertiary,
      },
    },

    extend: {
      // Font families — CSS variables injected by next/font in layout.tsx
      fontFamily: {
        display: ['var(--font-display)', 'Noto Serif', 'Georgia', 'serif'],
        body:    ['var(--font-body)', 'Noto Sans', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'Noto Sans Mono', 'Menlo', 'monospace'],
      },

      // Type scale — v3 spec
      fontSize: {
        display: ['48px', { lineHeight: '1.1',  fontWeight: '700' }],
        h1:      ['38px', { lineHeight: '1.15', fontWeight: '600' }],
        h2:      ['30px', { lineHeight: '1.2',  fontWeight: '600' }],
        h3:      ['24px', { lineHeight: '1.25', fontWeight: '500' }],
        body:    ['15px', { lineHeight: '1.5',  fontWeight: '400' }],
        small:   ['13px', { lineHeight: '1.45', fontWeight: '400' }],
        label:   ['11px', { lineHeight: '1.3',  fontWeight: '500', letterSpacing: '0.1em' }],
        number:  ['38px', { lineHeight: '1.1',  fontWeight: '700' }],
        input:   ['16px', { lineHeight: '1.5' }],
        // Legacy aliases retained for backward-compat during sweep
        xs:   ['12px', { lineHeight: '1.33' }],
        sm:   ['13px', { lineHeight: '1.45' }],
        base: ['15px', { lineHeight: '1.5'  }],
        lg:   ['16px', { lineHeight: '1.5'  }],
        xl:   ['18px', { lineHeight: '1.32' }],
        '2xl':['20px', { lineHeight: '1.33' }],
        '3xl':['24px', { lineHeight: '1.25' }],
      },

      // 4px base grid
      spacing: {
        '0.5': '2px',
        '1':   '4px',
        '2':   '8px',
        '3':   '12px',
        '4':   '16px',
        '5':   '20px',
        '6':   '24px',
        '8':   '32px',
        '10':  '40px',
        '12':  '48px',
        '16':  '64px',
        '20':  '80px',
        '24':  '96px',
      },

      borderRadius: {
        none: '0',
        sm:   `${radius.sm}px`,
        md:   `${radius.md}px`,
        DEFAULT: `${radius.md}px`,
        lg:   `${radius.lg}px`,
        xl:   `${radius.xl}px`,
        '2xl': '24px',
        pill: `${radius.pill}px`,
        full: `${radius.pill}px`,
      },

      boxShadow: {
        none:  'none',
        sm:    shadow.sm,
        md:    shadow.md,
        lg:    shadow.lg,
        focus: shadow.focus,
      },

      transitionDuration: {
        fast: motion.durationFast,
        base: motion.durationBase,
        slow: motion.durationSlow,
      },

      transitionTimingFunction: {
        'ease-out': motion.easeOut,
        'ease-in':  motion.easeIn,
      },

      animation: {
        skeleton: 'shimmer 1.5s ease-in-out infinite',
        pulse:    'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spin:     'spin 1.2s linear infinite',
      },

      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        spin: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },

      // Touch targets — 48px minimum per v3 spec
      minHeight: { touch: '48px', 'touch-sm': '36px' },
      minWidth:  { touch: '48px', 'touch-sm': '36px' },
      height:    { touch: '48px', 'topbar': '52px', 'tabbar': '64px' },
      width:     { 'sidenav': '200px', 'fab': '48px' },
    },
  },

  darkMode: 'class',

  plugins: [
    function ({ addComponents }: PluginAPI) {
      addComponents({
        // ── Buttons ────────────────────────────────────────────
        '.btn-base': {
          height: '36px',
          paddingLeft: '20px',
          paddingRight: '20px',
          fontSize: '15px',
          fontWeight: '600',
          borderRadius: `${radius.md}px`,
          transition: `all ${motion.durationBase} ${motion.easeOut}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          userSelect: 'none',
          '&:disabled': { opacity: '0.4', cursor: 'not-allowed' },
          // 48px tap zone without affecting layout
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '-6px',
          },
        },

        '.btn-primary': {
          '@apply btn-base': {},
          backgroundColor: t.brandUi,
          color: t.textOnBrand,
          '&:hover:not(:disabled)': { backgroundColor: t.brandUiHover },
          '&:active:not(:disabled)': { backgroundColor: t.brandUiPress },
          '&:focus-visible': { boxShadow: shadow.focus, outline: 'none' },
        },

        '.btn-secondary': {
          '@apply btn-base': {},
          backgroundColor: t.bgSubtle,
          color: t.textPrimary,
          border: `1.5px solid ${t.borderDefault}`,
          '&:hover:not(:disabled)': { backgroundColor: t.bgInset },
          '&:focus-visible': { boxShadow: shadow.focus, outline: 'none' },
        },

        '.btn-ghost': {
          '@apply btn-base': {},
          backgroundColor: 'transparent',
          color: t.brandText,
          '&:hover:not(:disabled)': { textDecoration: 'underline' },
          '&:focus-visible': { boxShadow: shadow.focus, outline: 'none' },
        },

        '.btn-danger': {
          '@apply btn-base': {},
          backgroundColor: t.outwardBg,
          color: t.outward,
          border: `1.5px solid ${t.outwardBorder}`,
          '&:hover:not(:disabled)': { backgroundColor: t.outwardBorder },
          '&:focus-visible': { boxShadow: shadow.focus, outline: 'none' },
        },

        // ── Chips ─────────────────────────────────────────────
        '.chip': {
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: `${radius.pill}px`,
          border: `1.5px solid ${t.borderDefault}`,
          padding: '4px 12px',
          fontSize: '13px',
          fontWeight: '500',
          transition: `all ${motion.durationFast} ${motion.easeOut}`,
          cursor: 'pointer',
          userSelect: 'none',
        },
        '.chip-active': {
          '@apply chip': {},
          backgroundColor: t.brandUi,
          borderColor: t.brandUi,
          color: t.textOnBrand,
          fontWeight: '600',
        },
        '.chip-inactive': {
          '@apply chip': {},
          backgroundColor: t.bgSurface,
          color: t.textSecondary,
        },

        // ── Form inputs ───────────────────────────────────────
        '.input-base': {
          width: '100%',
          height: '36px',
          border: `1.5px solid ${t.borderDefault}`,
          borderRadius: `${radius.md}px`,
          padding: '0 12px',
          fontSize: '16px',
          fontWeight: '400',
          fontFamily: 'var(--font-body)',
          color: t.textPrimary,
          backgroundColor: t.bgSurface,
          transition: `border-color ${motion.durationFast} ${motion.easeOut}, box-shadow ${motion.durationFast} ${motion.easeOut}`,
          '&::placeholder': { color: t.textPlaceholder },
          '&:focus': {
            outline: 'none',
            borderColor: t.brandUi,
            boxShadow: shadow.focus,
          },
          '&:disabled': {
            backgroundColor: t.bgSubtle,
            color: t.textTertiary,
            cursor: 'not-allowed',
            opacity: '0.6',
          },
        },

        // ── Cards ─────────────────────────────────────────────
        '.card': {
          backgroundColor: t.bgSurface,
          borderRadius: `${radius.lg}px`,
          border: `1px solid ${t.borderDefault}`,
          boxShadow: shadow.sm,
          padding: '16px',
        },
        '.card-elevated': {
          backgroundColor: t.bgSurface,
          borderRadius: `${radius.lg}px`,
          boxShadow: shadow.md,
          padding: '16px',
        },

        // ── Auth screens ──────────────────────────────────────
        '.auth-panel': {
          margin: '0 auto',
          display: 'flex',
          width: '100%',
          maxWidth: '384px',
          flexDirection: 'column',
          gap: '16px',
          borderRadius: '16px',
          backgroundColor: t.bgSurface,
          padding: '24px',
          boxShadow: shadow.lg,
        },
        '.auth-page': {
          display: 'flex',
          minHeight: '100dvh',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.bgPage,
          padding: '24px 12px',
        },

        // ── Badges ────────────────────────────────────────────
        '.badge-base': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          borderRadius: `${radius.sm}px`,
          padding: '2px 6px',
          fontSize: '11px',
          fontWeight: '600',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        },
        '.badge-inward': {
          '@apply badge-base': {},
          backgroundColor: t.inwardBg,
          color: t.inward,
          border: `1px solid ${t.inwardBorder}`,
        },
        '.badge-outward': {
          '@apply badge-base': {},
          backgroundColor: t.outwardBg,
          color: t.outward,
          border: `1px solid ${t.outwardBorder}`,
        },
        '.badge-pending': {
          '@apply badge-base': {},
          backgroundColor: t.pendingBg,
          color: t.pending,
          border: `1px solid ${t.pendingBorder}`,
        },
        '.badge-brand': {
          '@apply badge-base': {},
          backgroundColor: t.brandSubtle,
          color: t.brandText,
          border: `1px solid ${t.brandBorder}`,
        },
        '.badge-neutral': {
          '@apply badge-base': {},
          backgroundColor: t.bgSubtle,
          color: t.textTertiary,
          border: `1px solid ${t.borderDefault}`,
        },
        // Status aliases — map to semantic badges
        '.badge-active':    { '@apply badge-inward': {} },
        '.badge-cleared':   { '@apply badge-inward': {} },
        '.badge-stale':     { '@apply badge-pending': {} },
        '.badge-disputed':  { '@apply badge-outward': {} },
        '.badge-delivered': { '@apply badge-inward': {} },
        '.badge-online':    { '@apply badge-inward': {} },
        '.badge-offline':   { '@apply badge-pending': {} },

        // ── Skeleton ──────────────────────────────────────────
        '.skeleton': {
          background: `linear-gradient(90deg, ${t.bgSubtle} 25%, ${t.bgInset} 50%, ${t.bgSubtle} 75%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite',
          borderRadius: `${radius.sm}px`,
        },

        // ── Offline indicator ─────────────────────────────────
        '.offline-indicator': {
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          backgroundColor: t.pendingBg,
          borderBottom: `2px solid ${t.pendingBorder}`,
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: t.pending,
          fontSize: '13px',
          fontWeight: '500',
          zIndex: '9999',
        },

        // ── Utilities ─────────────────────────────────────────
        '.focus-ring': {
          '&:focus-visible': {
            outline: 'none',
            boxShadow: shadow.focus,
          },
        },
        '.page-container': { width: '100%', maxWidth: 'none', padding: '0 12px' },
        '.lot-grid': {
          display: 'grid',
          gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
          gap: '16px',
          '@media (min-width: 640px)':  { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
          '@media (min-width: 768px)':  { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
          '@media (min-width: 1024px)': { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
        },
        '.form-field': { display: 'flex', flexDirection: 'column', gap: '8px' },
        '.text-truncate': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
        '.loading-spinner': {
          display: 'inline-block',
          animation: 'spin 1.2s linear infinite',
          color: t.brandUi,
        },
        '.error-text': { color: t.outward, fontSize: '12px', fontWeight: '500' },
        '.help-text':  { color: t.textSecondary, fontSize: '13px', fontWeight: '400' },

        // ── Type helpers ──────────────────────────────────────
        '.type-display': {
          fontFamily: 'var(--font-display)',
          fontSize: '48px', fontWeight: '700', lineHeight: '1.1',
          letterSpacing: '-0.01em', color: t.textPrimary,
        },
        '.type-number': {
          fontFamily: 'var(--font-display)',
          fontSize: '38px', fontWeight: '700', lineHeight: '1.1',
          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
          color: t.textPrimary,
        },
        '.type-label': {
          fontFamily: 'var(--font-mono)',
          fontSize: '11px', fontWeight: '500', lineHeight: '1.3',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: t.textTertiary,
        },
        '.type-mono': { fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' },

        // ── Heading helpers (legacy aliases) ──────────────────
        '.h1': { fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: '600', color: t.textPrimary },
        '.h2': { fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: '600', color: t.textPrimary },
        '.h3': { fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '500', color: t.textPrimary },
      });
    },
  ],
};

export default config;
