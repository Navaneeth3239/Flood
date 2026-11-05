import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';
import ml from './locales/ml.json';

const resources = {
  en: { translation: en },
  ta: { translation: ta },
  hi: { translation: hi },
  ml: { translation: ml },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ta', 'hi', 'ml'],
    debug: import.meta.env.DEV,
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lngs, _ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing key "${key}" in languages:`, lngs);
      }
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

// Synchronize document.documentElement.lang with active language
const syncHtmlLang = (lng?: string) => {
  const activeLng = lng || i18n.resolvedLanguage || i18n.language || 'en';
  document.documentElement.lang = activeLng;
};

syncHtmlLang();
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
