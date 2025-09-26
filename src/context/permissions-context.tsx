
"use client";

import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from './auth-context';
import { EmployeePermissions } from '@/lib/types';

type ModulePermissions = EmployeePermissions['modules'];

interface PermissionsContextType {
  hasAccess: (module: keyof ModulePermissions) => boolean;
  getPermissions: (employeeId: string) => EmployeePermissions | undefined;
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
  
  const getPermissions = useCallback((employeeId: string): EmployeePermissions | undefined => {
      // This is a placeholder as we don't have the full team data here.
      // A more robust solution would fetch this from a team context.
      if (userData?.uid === employeeId) {
          return userData.permissions;
      }
      return undefined;
  }, [userData]);


  return (
    <PermissionsContext.Provider value={{ hasAccess, getPermissions }}>
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
