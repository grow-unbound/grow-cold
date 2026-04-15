import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from '@growcold/shared';

void i18n.use(initReactI18next).init({
  lng: 'te',
  fallbackLng: 'en',
  ns: ['nav', 'menu', 'common'],
  defaultNS: 'nav',
  resources: {
    te: {
      nav: resources.te.nav,
      menu: resources.te.menu,
      common: resources.te.common,
    },
    en: {
      nav: resources.en.nav,
      menu: resources.en.menu,
      common: resources.en.common,
    },
  },
  interpolation: { escapeValue: false },
});

export { i18n };
