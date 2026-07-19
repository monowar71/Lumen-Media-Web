import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enLibrary from './locales/en/library.json';
import enDetails from './locales/en/details.json';
import enPlayer from './locales/en/player.json';
import enSettings from './locales/en/settings.json';
import enErrors from './locales/en/errors.json';
import ruCommon from './locales/ru/common.json';
import ruAuth from './locales/ru/auth.json';
import ruLibrary from './locales/ru/library.json';
import ruDetails from './locales/ru/details.json';
import ruPlayer from './locales/ru/player.json';
import ruSettings from './locales/ru/settings.json';
import ruErrors from './locales/ru/errors.json';

export const SUPPORTED_LOCALES = ['ru', 'en'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'ru';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    library: enLibrary,
    details: enDetails,
    player: enPlayer,
    settings: enSettings,
    errors: enErrors,
  },
  ru: {
    common: ruCommon,
    auth: ruAuth,
    library: ruLibrary,
    details: ruDetails,
    player: ruPlayer,
    settings: ruSettings,
    errors: ruErrors,
  },
} as const;

export function isAppLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'auth', 'library', 'details', 'player', 'settings', 'errors'],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
