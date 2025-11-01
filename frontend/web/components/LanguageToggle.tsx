import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, useThemeClasses } from '../contexts/ThemeContext';
import { SupportedLanguage } from '../lib/i18n';

interface LanguageToggleProps {
  className?: string;
  showText?: boolean;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  className = '', 
  showText = true 
}) => {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const themeClasses = useThemeClasses();

  const toggleLanguage = () => {
    const newLanguage: SupportedLanguage = language === 'lv' ? 'en' : 'lv';
    setLanguage(newLanguage);
  };

  const getLanguageDisplay = (lang: SupportedLanguage) => {
    return lang === 'lv' ? 'LV' : 'EN';
  };

  const getLanguageFlag = (lang: SupportedLanguage) => {
    return lang === 'lv' ? '🇱🇻' : '🇬🇧';
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200
        ${theme === 'dark' 
          ? 'hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-600' 
          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-300'
        }
        ${className}
      `}
      title={`Switch to ${language === 'lv' ? 'English' : 'Latvian'}`}
    >
      <span className="text-sm">{getLanguageFlag(language)}</span>
      {showText && (
        <span className="text-sm font-medium">
          {getLanguageDisplay(language)}
        </span>
      )}
      <svg 
        className="w-3 h-3 opacity-60" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 9l4-4 4 4m0 6l-4 4-4-4" 
        />
      </svg>
    </button>
  );
};

export default LanguageToggle;