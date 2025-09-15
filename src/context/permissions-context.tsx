
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context';

type ModulePermissions = {
    dashboard?: boolean;
    products?: boolean;
    orders?: boolean;
    crm?: boolean;
    financials?: boolean;
    logistics?: boolean;
    reports?: boolean;
    team?: boolean;
    settings?: boolean;
};

interface PermissionsContextType {
  hasAccess: (module: keyof ModulePermissions) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userData } = useAuth();

  const hasAccess = useCallback((module: keyof ModulePermissions): boolean => {
    if (!userData) {
      return false;
    }
    // Owner has access to everything
    if (userData.role === 'empresa') {
      return true;
    }
    // For sub-accounts, check their specific permissions object
    if (userData.permissions?.modules) {
        return !!userData.permissions.modules[module];
    }
    
    return false;
  }, [userData]);


  return (
    <PermissionsContext.Provider value={{ hasAccess }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = (): PermissionsContextType => {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
