import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ta from './locales/ta.json';
import hi from './locales/hi.json';
import ml from './locales/ml.json';
import { getUserSettings, saveUserSettings } from '@/storage';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeName: 'English' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ml', label: 'Malayalam', nativeName: 'മലയാളം' },
] as const;

export type SupportedLanguageCode = 'en' | 'ta' | 'hi' | 'ml';

const resources = {
  en: { translation: en },
  ta: { translation: ta },
  hi: { translation: hi },
  ml: { translation: ml },
};

const settings = getUserSettings();
const initialLanguage = settings.language || 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function setAppLanguage(lang: SupportedLanguageCode): void {
  i18n.changeLanguage(lang);
  saveUserSettings({ language: lang });
}

export default i18n;
