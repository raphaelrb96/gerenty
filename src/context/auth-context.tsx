
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChange } from '@/services/auth-service';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, Employee } from '@/lib/types';
import { getEmployeeByAuthId } from '@/services/employee-service';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  effectiveOwnerId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [effectiveOwnerId, setEffectiveOwnerId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const mainUserData = userDoc.data() as User;
          setUserData(mainUserData);
          setEffectiveOwnerId(firebaseUser.uid);
        } else {
          const employee = await getEmployeeByAuthId(firebaseUser.uid);
          if (employee) {
            const ownerDocRef = doc(db, 'users', employee.ownerId);
            const ownerDoc = await getDoc(ownerDocRef);
            if (ownerDoc.exists()) {
              const ownerData = ownerDoc.data() as User;
              const employeeAsUser: User = {
                ...ownerData,
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                name: employee.name,
                role: employee.role,
              };
              setUserData(employeeAsUser);
              setEffectiveOwnerId(employee.ownerId);
            } else {
               setUserData(null);
               setEffectiveOwnerId(null);
            }
          } else {
            setUserData(null);
            setEffectiveOwnerId(null);
          }
        }
      } else {
        setUser(null);
        setUserData(null);
        setEffectiveOwnerId(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAuthenticated = !!user && !loading;

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAuthenticated, effectiveOwnerId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
