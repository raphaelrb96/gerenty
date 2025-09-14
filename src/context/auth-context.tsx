
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // 1. Check if the user is a main account owner
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data() as User);
        } else {
          // 2. If not a main user, check if they are an employee
          const employee = await getEmployeeByAuthId(firebaseUser.uid);
          if (employee) {
            // 3. If they are an employee, fetch the main account owner's data (for plan, etc.)
            const ownerDocRef = doc(db, 'users', employee.ownerId);
            const ownerDoc = await getDoc(ownerDocRef);
            if (ownerDoc.exists()) {
              const ownerData = ownerDoc.data() as User;
              // Construct a userData object for the employee, using the owner's plan
              // and marking the role based on the employee's role.
              const employeeAsUser: User = {
                ...ownerData, // Inherit plan and other details from the owner
                uid: firebaseUser.uid, // But use the employee's own UID
                email: firebaseUser.email!,
                name: employee.name,
                role: employee.role, // Use the employee's specific role
              };
              setUserData(employeeAsUser);
            } else {
               // Should not happen if data is consistent
               setUserData(null);
            }
          } else {
            // Neither a main user nor an employee found
            setUserData(null);
          }
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAuthenticated = !!user && !loading;

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAuthenticated }}>
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
