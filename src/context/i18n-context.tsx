
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Importa os arquivos de tradução
import en from '@/locales/en.json';
import pt from '@/locales/pt.json';
import es from '@/locales/es.json';

type Language = 'en' | 'pt' | 'es';

type TranslateOptions = {
    [key: string]: string | number;
} | { returnObjects: boolean };


interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: TranslateOptions) => any;
}

const translations = { en, pt, es };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('pt');

  useEffect(() => {
    // Tenta obter o idioma do navegador
    const browserLang = navigator.language.split('-')[0] as Language;
    if (['en', 'pt', 'es'].includes(browserLang)) {
      setLanguage(browserLang);
    }
  }, []);

  const t = (key: string, options?: TranslateOptions): any => {
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

    if (options && 'returnObjects' in options && options.returnObjects === true) {
        return result;
    }

    if (typeof result === 'string' && options) {
        return Object.entries(options).reduce((acc, [key, value]) => {
            return acc.replace(`{${key}}`, String(value));
        }, result);
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
