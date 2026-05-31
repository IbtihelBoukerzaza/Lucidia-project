import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const NEXT_LABEL = { ar: 'EN', en: 'FR', fr: 'AR' };
const NEXT_TITLE = { ar: 'English', en: 'Français', fr: 'العربية' };

export default function LanguageSwitcher() {
  const { currentLang, toggleLanguage } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleLanguage}
      title={NEXT_TITLE[currentLang] ?? 'العربية'}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        border: `1px solid ${isDark ? '#2A2A2A' : '#E0DDD5'}`,
        background: isDark ? '#1A1A1A' : '#F0F0EC',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: '16px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#C9A84C';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = isDark ? '#2A2A2A' : '#E0DDD5';
      }}
    >
      🌐
    </button>
  );
}