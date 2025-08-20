
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Currency = 'BRL' | 'USD' | 'EUR';

const exchangeRates = {
  'BRL': 1,
  'USD': 5.4,
  'EUR': 6.0,
};

const currencySymbols: Record<Currency, string> = {
  'BRL': 'R$',
  'USD': '$',
  'EUR': '€',
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatCurrency: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('BRL');

  const formatCurrency = (value: number) => {
    const rate = exchangeRates[currency];
    const convertedValue = value / rate;
    const symbol = currencySymbols[currency];
    return `${symbol}${convertedValue.toFixed(2)}`;
  };
  

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
