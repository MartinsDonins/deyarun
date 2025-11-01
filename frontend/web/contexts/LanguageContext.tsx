import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { SupportedLanguage, setLanguage, getLanguage, t, tp } from '../lib/i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  tp: (key: string, params: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setCurrentLanguage] = useState<SupportedLanguage>('lv');

  useEffect(() => {
    // Initialize language from localStorage or browser settings
    const savedLanguage = getLanguage();
    setCurrentLanguage(savedLanguage);
  }, []);

  const changeLanguage = useCallback((lang: SupportedLanguage) => {
    // Update both the global i18n state and React state
    setLanguage(lang);
    setCurrentLanguage(lang);
  }, []);

  const translate = useCallback((key: string) => {
    return t(key, language);
  }, [language]);
  
  const translateWithParams = useCallback((key: string, params: Record<string, string | number>) => {
    return tp(key, params, language);
  }, [language]);

  const value: LanguageContextType = useMemo(() => ({
    language,
    setLanguage: changeLanguage,
    t: translate,
    tp: translateWithParams,
  }), [language, changeLanguage, translate, translateWithParams]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;