
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import type { Company } from "@/lib/types";

const companiesCollection = collection(db, "companies");

// Get all companies for a specific user (owner)
export async function getCompaniesForUser(ownerId: string): Promise<Company[]> {
    try {
        const q = query(companiesCollection, where("ownerId", "==", ownerId));
        const querySnapshot = await getDocs(q);
        const companies: Company[] = [];
        querySnapshot.forEach((doc) => {
            companies.push({ id: doc.id, ...doc.data() } as Company);
        });
        return companies;
    } catch (error) {
        console.error("Error getting companies: ", error);
        throw new Error("Failed to fetch companies.");
    }
}

// Get a single company by its ID
export async function getCompanyById(companyId: string): Promise<Company | null> {
    try {
        const companyDocRef = doc(db, "companies", companyId);
        const companyDoc = await getDoc(companyDocRef);

        if (!companyDoc.exists()) {
            console.warn(`No company found with id: ${companyId}`);
            return null;
        }

        return { id: companyDoc.id, ...companyDoc.data() } as Company;
    } catch (error) {
        console.error("Error getting company by ID: ", error);
        throw new Error("Failed to fetch company data.");
    }
}


// Add a new company
export async function addCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    try {
        const docRef = await addDoc(companiesCollection, {
            ...companyData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        return {
            id: docRef.id,
            ...companyData,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Company;

    } catch (error) {
        console.error("Error adding company: ", error);
        throw new Error("Failed to add company.");
    }
}

// Update an existing company
export async function updateCompany(companyId: string, companyData: Partial<Omit<Company, 'id' | 'createdAt'>>): Promise<void> {
    try {
        const companyDoc = doc(db, "companies", companyId);
        await updateDoc(companyDoc, {
            ...companyData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating company: ", error);
        throw new Error("Failed to update company.");
    }
}
