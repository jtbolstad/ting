import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../../public/locales/en/translation.json';
import noTranslation from '../../public/locales/no/translation.json';
import daTranslation from '../../public/locales/da/translation.json';
import esTranslation from '../../public/locales/es/translation.json';
import plTranslation from '../../public/locales/pl/translation.json';
import urTranslation from '../../public/locales/ur/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      no: {
        translation: noTranslation,
      },
      da: {
        translation: daTranslation,
      },
      es: {
        translation: esTranslation,
      },
      pl: {
        translation: plTranslation,
      },
      ur: {
        translation: urTranslation,
      },
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
