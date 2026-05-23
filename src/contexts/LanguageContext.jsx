import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLang(lng);
      document.documentElement.dir  = lng === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
    };
    i18n.on('languageChanged', handleLanguageChanged);
    document.documentElement.dir  = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    return () => i18n.off('languageChanged', handleLanguageChanged);
  }, [i18n]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir  = lng === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lng;
  };

  const toggleLanguage = () => {
    const cycle = { ar: 'en', en: 'fr', fr: 'ar' };
    changeLanguage(cycle[currentLang] ?? 'ar');
  };

  return (
    <LanguageContext.Provider value={{
      currentLang,
      changeLanguage,
      toggleLanguage,
      isRTL: currentLang === 'ar',
    }}>
      {children}
    </LanguageContext.Provider>
  );
};