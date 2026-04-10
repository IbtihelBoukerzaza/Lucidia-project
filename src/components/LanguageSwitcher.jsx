import React from 'react';
import { useLanguage } from '../contexts/LanguageContext'

export default function LanguageSwitcher() {
  const { currentLang, toggleLanguage } = useLanguage()

  return (
    <button
      onClick={toggleLanguage}
      className="group relative inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-700/60 bg-slate-900/80 backdrop-blur-sm transition-all duration-300 hover:border-sky-500/60 hover:bg-slate-800/90 hover:scale-105"
      title={currentLang === 'ar' ? 'English' : 'العربية'}
    >
      <span className="text-lg transition-transform duration-300 group-hover:scale-110">
        🌐
      </span>
      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-950/90 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
        {currentLang === 'ar' ? 'EN' : 'AR'}
      </span>
    </button>
  )
}
