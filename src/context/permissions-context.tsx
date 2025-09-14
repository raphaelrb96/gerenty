
"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// Define the shape of permissions for a single module
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

// Define the shape of permissions for a single user/employee
type UserPermissions = {
    modules: ModulePermissions;
    companies: Record<string, boolean>; // Key is companyId, value is boolean
};

// Define the shape of the entire permissions state
// Key is employeeId
type PermissionsState = Record<string, UserPermissions>;

interface PermissionsContextType {
  permissions: PermissionsState;
  setPermission: (employeeId: string, userPermissions: UserPermissions) => void;
  getPermissions: (employeeId: string) => UserPermissions | undefined;
  hasAccess: (employeeId: string, module: keyof ModulePermissions, companyId?: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

const PERMISSIONS_STORAGE_KEY = 'userPermissions';

export const PermissionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [permissions, setPermissions] = useState<PermissionsState>(() => {
    try {
      const item = window.localStorage.getItem(PERMISSIONS_STORAGE_KEY);
      return item ? JSON.parse(item) : {};
    } catch (error) {
      console.error("Failed to load permissions from localStorage", error);
      return {};
    }
  });

  const setPermission = useCallback((employeeId: string, userPermissions: UserPermissions) => {
    setPermissions(prevState => {
        const newState = {
            ...prevState,
            [employeeId]: userPermissions
        };
        try {
            window.localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(newState));
        } catch (error) {
            console.error("Failed to save permissions to localStorage", error);
        }
        return newState;
    });
  }, []);

  const getPermissions = useCallback((employeeId: string) => {
    return permissions[employeeId];
  }, [permissions]);

  const hasAccess = useCallback((employeeId: string, module: keyof ModulePermissions, companyId?: string) => {
      const userPerms = permissions[employeeId];
      if (!userPerms) {
          return false; // Default to no access if no permissions are set
      }

      const moduleAccess = userPerms.modules?.[module] ?? false;
      
      if (companyId) {
          const companyAccess = userPerms.companies?.[companyId] ?? false;
          return moduleAccess && companyAccess;
      }

      return moduleAccess;
  }, [permissions]);


  return (
    <PermissionsContext.Provider value={{ permissions, setPermission, getPermissions, hasAccess }}>
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
