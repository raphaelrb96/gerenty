
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { getCompaniesForUser } from '@/services/company-service';
import type { Company } from '@/lib/types';
import { LoadingSpinner } from '@/components/common/loading-spinner';

interface CompanyContextType {
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompany: (company: Company | null) => void;
  loading: boolean;
  refreshCompanies: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const ACTIVE_COMPANY_STORAGE_KEY = 'activeCompanyId';

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    if (user) {
      setLoading(true);
      try {
        const userCompanies = await getCompaniesForUser(user.uid);
        setCompanies(userCompanies);

        if (userCompanies.length > 0) {
            const storedCompanyId = localStorage.getItem(ACTIVE_COMPANY_STORAGE_KEY);
            const companyToActivate = userCompanies.find(c => c.id === storedCompanyId) || userCompanies[0];
            
            setActiveCompanyState(companyToActivate);
            if (companyToActivate) {
                localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, companyToActivate.id);
            }
        } else {
            setActiveCompanyState(null);
            localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
        }

      } catch (error) {
        console.error("Failed to fetch companies:", error);
        setCompanies([]);
        setActiveCompanyState(null);
      } finally {
        setLoading(false);
      }
    } else {
      setCompanies([]);
      setActiveCompanyState(null);
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!authLoading) {
      fetchCompanies();
    }
  }, [user, authLoading]);

  const setActiveCompany = (company: Company | null) => {
    setActiveCompanyState(company);
    if (company) {
      localStorage.setItem(ACTIVE_COMPANY_STORAGE_KEY, company.id);
    } else {
      localStorage.removeItem(ACTIVE_COMPANY_STORAGE_KEY);
    }
  };
  
  if (authLoading || loading) {
    return <div className="flex h-screen w-full items-center justify-center"><LoadingSpinner /></div>
  }

  return (
    <CompanyContext.Provider value={{ companies, activeCompany, setActiveCompany, loading, refreshCompanies: fetchCompanies }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
