import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from '@growcold/shared';

void i18n.use(initReactI18next).init({
  lng: 'te',
  fallbackLng: 'en',
  ns: ['nav', 'menu', 'common', 'home', 'pages', 'search'],
  defaultNS: 'nav',
  resources: {
    te: {
      nav: resources.te.nav,
      menu: resources.te.menu,
      common: resources.te.common,
      home: resources.te.home,
      pages: resources.te.pages,
      search: resources.te.search,
    },
    en: {
      nav: resources.en.nav,
      menu: resources.en.menu,
      common: resources.en.common,
      home: resources.en.home,
      pages: resources.en.pages,
      search: resources.en.search,
    },
  },
  interpolation: { escapeValue: false },
});

export { i18n };
