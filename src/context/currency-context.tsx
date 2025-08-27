
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Currency = 'USD' | 'BRL' | 'EUR';

// Base currency is USD. Rates represent how many of the target currency one USD is.
const exchangeRates = {
  'USD': 1,
  'BRL': 5.3,
  'EUR': 0.92,
};

const currencySymbols: Record<Currency, string> = {
  'USD': '$',
  'BRL': 'R$',
  'EUR': '€',
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPlanPrice: (valueInUsd: number) => string;
  formatCurrency: (value: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>('USD');

  const formatPlanPrice = (valueInUsd: number) => {
    const rate = exchangeRates[currency];
    const convertedValue = valueInUsd * rate;
    const symbol = currencySymbols[currency];
    
    return `${symbol}${convertedValue.toFixed(2)}`;
  };

  const formatCurrency = (value: number) => {
    return `R$${(value || 0).toFixed(2)}`;
  };
  

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPlanPrice, formatCurrency }}>
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
