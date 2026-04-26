import type { Config } from 'tailwindcss';
import type { PluginAPI } from 'tailwindcss/types/config';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/shared/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary: Grab-inspired Green Haze (brand, CTAs, focus)
        primary: {
          50: '#E8F8EF',
          100: '#C4ECD4',
          200: '#9EDBB8',
          300: '#6EC999',
          400: '#3CB87A',
          500: '#00B14F', // Green Haze — canonical
          600: '#009948',
          700: '#007A3A',
          800: '#006030',
          900: '#004824',
        },

        // Secondary: neutral outline / supporting chrome (replaces teal)
        secondary: {
          50: '#F7F7F8',
          100: '#EEEFF1',
          200: '#DCDEE3',
          300: '#C4C7CE',
          400: '#9CA0AA',
          500: '#6B7280',
          600: '#4B5563',
          700: '#3D4450',
          800: '#2E3238',
          900: '#25282D',
        },

        // Accent: Bermuda mint (highlights, info chips — Grab palette family)
        accent: {
          50: '#F0FDF8',
          100: '#D9F7EC',
          200: '#B3EFD9',
          300: '#7BDCB5',
          400: '#4ECA9A',
          500: '#1FB77E',
          600: '#0F9A6A',
          700: '#0D7A56',
          800: '#0C6146',
          900: '#0A4F3A',
        },

        // Semantic
        success: {
          50: '#EEFBF3',
          100: '#D6F4E2',
          200: '#AEE7C8',
          300: '#7CDBA8',
          400: '#48C47E',
          500: '#1FA85A',
          600: '#168A4A',
          700: '#126E3C',
          800: '#0F5A32',
          900: '#0C4829',
        },

        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },

        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },

        // Neutrals — Tuna (#363A45) for strongest text
        neutral: {
          0: '#FFFFFF',
          50: '#F7F7F8',
          100: '#EEEFF1',
          200: '#E2E4E8',
          300: '#C8CCD4',
          400: '#9AA0AD',
          500: '#6B7280',
          600: '#5C6370',
          700: '#4A505C',
          800: '#3D424D',
          900: '#363A45', // Tuna — headings, high-emphasis body
          950: '#1B1D22',
        },

        // Status (lots / inventory) — distinct, system-harmonized
        status: {
          active: '#1FA85A',
          stale: '#F59E0B',
          delivered: '#3B82F6',
          cleared: '#1FA85A',
          writtenOff: '#9AA0AD',
          disputed: '#EF4444',
        },
      },

      fontSize: {
        caption: ['12px', { lineHeight: '1.35', fontWeight: '400' }],
        'caption-sm': ['12px', { lineHeight: '1.32', fontWeight: '400' }],

        label: ['12px', { lineHeight: '1.33', fontWeight: '600' }],
        'label-lg': ['14px', { lineHeight: '1.43', fontWeight: '600' }],

        base: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.43', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],

        h3: ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        h2: ['20px', { lineHeight: '1.33', fontWeight: '700' }],
        h1: ['24px', { lineHeight: '1.25', fontWeight: '700' }],

        xs: ['12px', { lineHeight: '1.33' }],
        sm: ['14px', { lineHeight: '1.43' }],
        lg: ['16px', { lineHeight: '1.5' }],
        xl: ['18px', { lineHeight: '1.32' }],
        '2xl': ['20px', { lineHeight: '1.33' }],
        '3xl': ['24px', { lineHeight: '1.25' }],
      },

      spacing: {
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },

      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
        loose: '2',
      },

      // Grab-style: softer modules (12px default, 16px large, 20px hero)
      borderRadius: {
        none: '0',
        sm: '4px',
        base: '12px',
        md: '14px',
        lg: '16px',
        xl: '18px',
        '2xl': '20px',
        '3xl': '24px',
        full: '9999px',
      },

      boxShadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        base: '0 1px 3px rgba(0, 0, 0, 0.06)',
        md: '0 4px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        lg: '0 10px 20px rgba(0, 0, 0, 0.07), 0 2px 6px rgba(0, 0, 0, 0.04)',
        xl: '0 18px 32px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04)',
        focus: '0 0 0 3px rgba(0, 177, 79, 0.15)',
      },

      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
      },

      animation: {
        skeleton: 'skeleton 1.5s infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spin: 'spin 1.2s linear infinite',
      },

      keyframes: {
        skeleton: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },

      outline: {
        '2': '2px solid rgba(0, 177, 79, 1)',
      },

      outlineOffset: {
        '2': '2px',
        '4': '4px',
      },

      // Grab-style 48px minimum for primary touch targets (buttons, inputs, tab bars)
      minHeight: {
        touch: '48px',
        'touch-sm': '40px',
      },

      minWidth: {
        touch: '48px',
        'touch-sm': '40px',
      },

      height: {
        touch: '48px',
      },
    },
  },

  darkMode: 'class',

  plugins: [
    function ({ addComponents }: PluginAPI) {
      addComponents({
        '.btn-base': {
          '@apply min-h-touch px-4 py-3 text-base rounded-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center': {},
        },

        '.btn-primary': {
          '@apply btn-base bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:outline-2 focus:outline-offset-4 focus:outline-primary-500': {},
        },

        // Neutral outline (secondary / cancel)
        '.btn-secondary': {
          '@apply btn-base border-2 border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 focus:outline-2 focus:outline-offset-4 focus:outline-primary-500': {},
        },

        '.btn-danger': {
          '@apply btn-base bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus:outline-2 focus:outline-offset-4 focus:outline-danger-500': {},
        },

        '.btn-ghost': {
          '@apply btn-base min-w-0 border-0 bg-transparent text-primary-600 hover:underline active:text-primary-800': {},
        },

        '.input-base': {
          '@apply w-full min-h-touch border-2 border-neutral-200 px-4 py-3 text-base font-normal text-neutral-900 rounded-base transition-all duration-200 focus:border-primary-500 focus:ring-0 focus:shadow-focus disabled:bg-neutral-100 disabled:opacity-50': {},
        },

        '.card': {
          '@apply bg-white rounded-base border border-neutral-200 shadow-sm p-4 md:p-5 lg:p-6': {},
        },

        // Super-app: floating modules (minimal border, soft ring + depth)
        '.card-elevated': {
          '@apply rounded-lg border-0 bg-white p-4 shadow-md ring-1 ring-black/[0.05] md:p-5': {},
        },

        // Auth screens: single elevated panel (no GrowCold/Grab logo — text title only)
        '.auth-panel': {
          '@apply mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border-0 bg-white p-5 shadow-lg ring-1 ring-black/[0.06] sm:p-6': {},
        },

        // Full-page auth / onboarding canvas (subtle brand gradient, safe areas)
        '.auth-page': {
          '@apply flex min-h-screen min-h-[100dvh] items-center justify-center bg-gradient-to-b from-primary-50/90 via-white to-neutral-50 px-3 py-8 pt-[max(1.5rem,env(safe-area-inset-top,0px))] pb-[max(2rem,env(safe-area-inset-bottom,0px))]': {},
        },

        '.skeleton': {
          '@apply bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:1000px_100%] animate-skeleton': {},
        },

        '.form-field': {
          '@apply flex flex-col gap-2': {},
        },

        '.h1': {
          '@apply text-h1 font-bold text-neutral-900': {},
        },
        '.h2': {
          '@apply text-h2 font-bold text-neutral-900': {},
        },
        '.h3': {
          '@apply text-h3 font-semibold text-neutral-900': {},
        },

        '.badge-active': {
          '@apply inline-flex items-center gap-0.5 rounded-sm bg-success-50 px-1.5 py-0.5 text-label font-semibold text-success-800': {},
        },
        '.badge-stale': {
          '@apply inline-flex items-center gap-0.5 rounded-sm bg-warning-50 px-1.5 py-0.5 text-label font-semibold text-warning-800': {},
        },
        '.badge-disputed': {
          '@apply inline-flex items-center gap-0.5 rounded-sm bg-danger-50 px-1.5 py-0.5 text-label font-semibold text-danger-800': {},
        },
        '.badge-cleared': {
          '@apply inline-flex items-center gap-0.5 rounded-sm bg-success-50 px-1.5 py-0.5 text-label font-semibold text-success-800': {},
        },

        '.focus-ring': {
          '@apply focus:outline-2 focus:outline-offset-4 focus:outline-primary-500': {},
        },

        '.page-container': {
          '@apply mx-0 w-full max-w-none px-3 sm:px-4 lg:px-6': {},
        },

        '.lot-grid': {
          '@apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4': {},
        },

        '.text-truncate': {
          '@apply overflow-hidden text-ellipsis whitespace-nowrap': {},
        },
        '.text-clamp-2': {
          '@apply line-clamp-2': {},
        },
        '.text-clamp-3': {
          '@apply line-clamp-3': {},
        },

        '.offline-indicator': {
          '@apply fixed top-0 left-0 right-0 bg-warning-100 border-b-2 border-warning-300 px-4 py-2 flex items-center gap-2 text-warning-800 text-sm font-medium': {},
        },

        '.loading-spinner': {
          '@apply inline-block animate-spin h-4 w-4 text-primary-500': {},
        },

        '.error-text': {
          '@apply text-danger-600 text-xs font-medium': {},
        },

        '.help-text': {
          '@apply text-neutral-500 text-sm font-normal': {},
        },
      });
    },
  ],
};

export default config;
