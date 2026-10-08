import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import arTranslation from './locales/ar.json';
import enTranslation from './locales/en.json';
import frTranslation from './locales/fr.json';

const resources = {
  ar: { translation: arTranslation },
  en: { translation: enTranslation },
  fr: { translation: frTranslation }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Do NOT hardcode lng here — let LanguageDetector read it from localStorage
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en', 'fr'],
    detection: {
      // Order of sources to detect language from
      order: ['localStorage', 'navigator'],
      // localStorage key name
      lookupLocalStorage: 'johar_lang',
      // Cache the detected language in localStorage
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
