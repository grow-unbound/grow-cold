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
        // Primary Color System (Warm Orange - Approachable)
        primary: {
          50: '#FEF6F0',
          100: '#FED5B8',
          200: '#FDB07D',
          300: '#FBAA6D',
          400: '#F59E0B', // Softer variant
          500: '#EA580C', // Primary
          600: '#D74A0A',
          700: '#CC4A08',
          800: '#B84207',
          900: '#8B3305',
        },

        // Secondary Color System (Calm Teal - Stability)
        secondary: {
          50: '#F0F9FC',
          100: '#CFF9F5',
          200: '#A5F3FC',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#0891B2', // Secondary
          600: '#0369A1',
          700: '#0284C7',
          800: '#0369A1',
          900: '#082F49',
        },

        // Accent Color System (Modern Purple - Premium feel)
        accent: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#7C3AED', // Accent
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#2E1065',
        },

        // Semantic Colors
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBEF63',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#34D399', // Soft Green (success)
          600: '#22C55E',
          700: '#16A34A',
          800: '#15803D',
          900: '#166534',
        },

        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FECF52',
          300: '#FBBF24', // Warm Amber (caution)
          400: '#F59E0B',
          500: '#F97316', // Warm Orange accent
          600: '#EA580C', // Same as primary (intentional)
          700: '#CC4A08',
          800: '#B45309',
          900: '#78350F',
        },

        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#FB6B3C', // Warm Red (alert but friendly)
          600: '#EA5621',
          700: '#DC2626',
          800: '#B91C1C',
          900: '#7F1D1D',
        },

        // Neutral Gray System
        neutral: {
          0: '#FFFFFF',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712',
        },

        // Status-specific colors
        status: {
          active: '#34D399', // Green
          stale: '#FBBF24', // Amber
          delivered: '#60A5FA', // Light Blue
          cleared: '#34D399', // Green
          writtenOff: '#9CA3AF', // Gray
          disputed: '#FB6B3C', // Warm Red
        },
      },

      // Typography: one step up from compact; `base` 17px (still ≥16 for comfortable inputs on most devices)
      fontSize: {
        caption: ['11px', { lineHeight: '1.35', fontWeight: '400' }],
        'caption-sm': ['10px', { lineHeight: '1.32', fontWeight: '400' }],

        label: ['11px', { lineHeight: '1.35', fontWeight: '600' }],
        'label-lg': ['12px', { lineHeight: '1.4', fontWeight: '600' }],

        base: ['17px', { lineHeight: '1.45', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '1.43', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],

        h3: ['16px', { lineHeight: '1.38', fontWeight: '600' }],
        h2: ['18px', { lineHeight: '1.32', fontWeight: '700' }],
        h1: ['24px', { lineHeight: '1.22', fontWeight: '700' }],

        xs: ['11px', { lineHeight: '1.35' }],
        sm: ['13px', { lineHeight: '1.43' }],
        lg: ['16px', { lineHeight: '1.5' }],
        xl: ['18px', { lineHeight: '1.32' }],
        '2xl': ['18px', { lineHeight: '1.32' }],
        '3xl': ['24px', { lineHeight: '1.22' }],
      },

      // Spacing Scale (8px base unit)
      spacing: {
        '0.5': '2px', // Micro
        '1': '4px', // Tight
        '2': '8px', // Base unit
        '3': '12px', // Small
        '4': '16px', // Default
        '6': '24px', // Medium
        '8': '32px', // Large
        '12': '48px', // Extra large
        '16': '64px', // Huge
        '20': '80px', // Extra huge
        '24': '96px', // Max
      },

      // Line-height for better readability
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75',
        loose: '2',
      },

      // Border radius (modern but not excessive)
      borderRadius: {
        none: '0',
        sm: '4px', // Micro roundness
        base: '8px', // Default (cards, buttons)
        md: '12px', // Medium
        lg: '16px', // Large
        full: '9999px', // Pill buttons
      },

      // Shadows (subtle, warm)
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        base: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
        focus: '0 0 0 3px rgba(234, 88, 12, 0.1)', // Orange focus ring
      },

      // Transitions (smooth, not slow)
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms', // Standard
        '300': '300ms', // Modals, larger elements
        '500': '500ms', // Loading states
      },

      // Animation for loading skeletons
      animation: {
        skeleton: 'skeleton 1.5s infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        spin: 'spin 1.2s linear infinite', // Slightly slower than default
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

      // Accessible focus states
      outline: {
        '2': '2px solid rgba(234, 88, 12, 1)',
      },

      outlineOffset: {
        '2': '2px',
      },

      minHeight: {
        touch: '34px',
        'touch-sm': '30px',
      },

      minWidth: {
        touch: '34px',
        'touch-sm': '30px',
      },
    },
  },

  // Dark mode (prepared for v1.1, not active yet)
  darkMode: 'class',

  plugins: [
    function ({ addComponents }: PluginAPI) {
      addComponents({
        // Button base styles
        '.btn-base': {
          '@apply px-2.5 py-1.5 text-sm rounded-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-touch min-w-touch': {},
        },

        // Primary button
        '.btn-primary': {
          '@apply btn-base bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:outline-2 focus:outline-offset-2 focus:outline-primary-500': {},
        },

        // Secondary button
        '.btn-secondary': {
          '@apply btn-base border border-secondary-500 text-secondary-500 hover:bg-secondary-50 active:bg-secondary-100 focus:outline-2 focus:outline-offset-2 focus:outline-secondary-500': {},
        },

        // Danger button
        '.btn-danger': {
          '@apply btn-base bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 focus:outline-2 focus:outline-offset-2 focus:outline-danger-500': {},
        },

        // Ghost button
        '.btn-ghost': {
          '@apply btn-base text-secondary-500 hover:underline active:text-secondary-700': {},
        },

        // Input base styles
        '.input-base': {
          '@apply w-full min-h-touch px-2.5 py-2 border border-neutral-200 rounded-base text-base font-normal transition-all duration-200 focus:border-primary-500 focus:ring-0 focus:shadow-focus disabled:bg-neutral-100 disabled:opacity-50': {},
        },

        // Card base
        '.card': {
          '@apply bg-white rounded-base border border-neutral-200 shadow-sm p-2 sm:p-3 md:p-4': {},
        },

        // Skeleton loading animation
        '.skeleton': {
          '@apply bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 bg-[length:1000px_100%] animate-skeleton': {},
        },

        // Text field wrapper (label + input + error)
        '.form-field': {
          '@apply flex flex-col gap-1.5': {},
        },

        // Heading hierarchy
        '.h1': {
          '@apply text-h1 font-bold text-neutral-900': {},
        },
        '.h2': {
          '@apply text-h2 font-bold text-neutral-900': {},
        },
        '.h3': {
          '@apply text-h3 font-semibold text-neutral-900': {},
        },

        // Status badge
        '.badge-active': {
          '@apply inline-flex items-center gap-0.5 rounded-sm bg-success-50 px-1.5 py-0.5 text-caption-sm font-semibold text-success-700': {},
        },
        '.badge-stale': {
          '@apply inline-flex items-center gap-0.5 rounded-sm bg-warning-50 px-1.5 py-0.5 text-caption-sm font-semibold text-warning-700': {},
        },
        '.badge-disputed': {
          '@apply inline-flex items-center gap-0.5 rounded-sm bg-danger-50 px-1.5 py-0.5 text-caption-sm font-semibold text-danger-700': {},
        },
        '.badge-cleared': {
          '@apply inline-flex items-center gap-0.5 rounded-sm bg-success-50 px-1.5 py-0.5 text-caption-sm font-semibold text-success-700': {},
        },

        // Accessibility: Visible focus
        '.focus-ring': {
          '@apply focus:outline-2 focus:outline-offset-2 focus:outline-primary-500': {},
        },

        // Full-width content rail (no max-width; horizontal padding only)
        '.page-container': {
          '@apply mx-0 w-full max-w-none px-3 sm:px-4 lg:px-6': {},
        },

        // Grid for lot cards
        '.lot-grid': {
          '@apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4': {},
        },

        // Text utilities
        '.text-truncate': {
          '@apply overflow-hidden text-ellipsis whitespace-nowrap': {},
        },
        '.text-clamp-2': {
          '@apply line-clamp-2': {},
        },
        '.text-clamp-3': {
          '@apply line-clamp-3': {},
        },

        // Offline indicator
        '.offline-indicator': {
          '@apply fixed top-0 left-0 right-0 bg-warning-100 border-b-2 border-warning-300 px-4 py-2 flex items-center gap-2 text-warning-700 text-sm font-medium': {},
        },

        // Loading spinner (for forms)
        '.loading-spinner': {
          '@apply inline-block animate-spin h-4 w-4 text-primary-500': {},
        },

        // Error message
        '.error-text': {
          '@apply text-danger-600 text-body-sm font-medium': {},
        },

        // Help text
        '.help-text': {
          '@apply text-neutral-500 text-body-sm font-normal': {},
        },
      });
    },
  ],
};

export default config;
