import { config as baseConfig } from '@gluestack-ui/config';

/** Grab-inspired primary scale (Green Haze) + Tuna-leaning text. */
const brandColors = {
  primary0: '#E8F8EF',
  primary50: '#C4ECD4',
  primary100: '#C4ECD4',
  primary200: '#9EDBB8',
  primary300: '#6EC999',
  primary400: '#3CB87A',
  primary500: '#00B14F',
  primary600: '#009948',
  primary700: '#007A3A',
  primary800: '#006030',
  primary900: '#004824',
  primary950: '#003018',
  /** High-emphasis body/headings (Tuna) */
  textLight900: '#363A45',
  textLight800: '#3D424D',
  backgroundLight50: '#F7F7F8',
  /** HOME_TAB dashboard — lodged / chips active */
  dashboardLodged: '#00B14F',
  /** HOME_TAB dashboard — delivered */
  dashboardDelivered: '#0891B2',
  dashboardAccentPurple: '#7C3AED',
  dashboardMoney: '#00B14F',
  dashboardDanger: '#DC2626',
  dashboardMuted: '#6B7280',
  dashboardSurface: '#F9FAFB',
} as const;

export const config = {
  ...baseConfig,
  tokens: {
    ...baseConfig.tokens,
    colors: {
      ...baseConfig.tokens.colors,
      ...brandColors,
    },
  },
};
