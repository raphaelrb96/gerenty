import type { Timestamp, FieldValue } from "firebase/firestore";

export type Plan = {
  name: string;
  price: number;
  features: string[];
};

export type User = {
  uid: string;
  email: string | null;
  name: string | null;
  profileImage?: string;
  phoneNumber?: string;
  authProvider: 'email' | 'google' | 'facebook';
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  role: 'admin' | 'empresa';
  plan: Plan | null;
  statusPlan: 'ativo' | 'inativo' | 'pendente';
  validityDate?: Date | Timestamp | FieldValue;
  assignedDate?: Date | Timestamp | FieldValue;
  createdAt: Date | Timestamp | FieldValue;
  lastLogin?: Date | Timestamp | FieldValue;
  updatedAt?: Date | Timestamp | FieldValue;
  onboardingCompleted?: boolean;
};

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  attributes?: string;
  imageUrl?: string;
  imageHint?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Order = {
  id: string;
  customer: string;
  status: 'Fulfilled' | 'Processing' | 'Pending' | 'Cancelled';
  amount: number;
  date: string; // Should be Timestamp, but keeping string for simplicity from old mock
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Finance = {
    id: string;
    userId: string;
    type: 'income' | 'expense';
    amount: number;
    currency: 'BRL' | 'USD' | 'EUR';
    source: string;
    category: string;
    status: 'pending' | 'completed' | 'failed';
    description: string;
    referenceId?: string;
    notes?: string;
    transactionDate: Date | Timestamp | FieldValue;
    createdAt: Date | Timestamp | FieldValue;
}
