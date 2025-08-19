"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Importa os arquivos de tradução
import en from '@/locales/en.json';
import pt from '@/locales/pt.json';
import es from '@/locales/es.json';

type Language = 'en' | 'pt' | 'es';

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations = { en, pt, es };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Tenta obter o idioma do navegador
    const browserLang = navigator.language.split('-')[0] as Language;
    if (['en', 'pt', 'es'].includes(browserLang)) {
      setLanguage(browserLang);
    }
  }, []);

  const t = (key: string): string => {
    // Navega no objeto de tradução aninhado
    const keys = key.split('.');
    let result = translations[language] as any;
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Se a chave não for encontrada, retorna a própria chave
        return key;
      }
    }
    return result || key;
  };
  

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
