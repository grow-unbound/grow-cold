import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from '@growcold/shared';

void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'te',
  ns: ['nav', 'menu', 'common', 'login', 'signup', 'authVerify', 'onboarding', 'pages', 'home'],
  defaultNS: 'nav',
  resources: {
    te: {
      nav: resources.te.nav,
      menu: resources.te.menu,
      common: resources.te.common,
      login: resources.te.login,
      signup: resources.te.signup,
      authVerify: resources.te.authVerify,
      onboarding: resources.te.onboarding,
      pages: resources.te.pages,
      home: resources.te.home,
    },
    en: {
      nav: resources.en.nav,
      menu: resources.en.menu,
      common: resources.en.common,
      login: resources.en.login,
      signup: resources.en.signup,
      authVerify: resources.en.authVerify,
      onboarding: resources.en.onboarding,
      pages: resources.en.pages,
      home: resources.en.home,
    },
  },
  interpolation: { escapeValue: false },
});

export { i18n };
