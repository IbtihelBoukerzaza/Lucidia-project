import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files
import enTranslations from "../locales/en.json";
import arTranslations from "../locales/ar.json";
import frTranslations from "../locales/fr.json";

const resources = {
  en: {
    translation: enTranslations,
  },
  ar: {
    translation: arTranslations,
  },
  fr: { translation: frTranslations }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,

    // Keep Arabic as default ONLY if nothing is detected
    fallbackLng: "en",

    supportedLngs: ["en", "ar","fr"],

    debug: false,

    interpolation: {
      escapeValue: false,
    },

    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;