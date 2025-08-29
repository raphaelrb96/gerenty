
"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import type { Customer, OrderCustomer } from "@/lib/types";

const customersCollection = collection(db, "customers");

const convertCustomerTimestamps = (data: any): Customer => {
    const customer = { id: data.id, ...data };
    for (const key of ['createdAt', 'updatedAt', 'lastInteraction']) {
        if (customer[key]?.toDate) {
            customer[key] = customer[key].toDate().toISOString();
        }
    }
    return customer as Customer;
}

export async function getCustomersByUser(ownerId: string): Promise<Customer[]> {
    try {
        const q = query(customersCollection, where("ownerId", "==", ownerId));
        const querySnapshot = await getDocs(q);
        const customers: Customer[] = [];
        querySnapshot.forEach((doc) => {
            customers.push(convertCustomerTimestamps({ id: doc.id, ...doc.data() }));
        });
        return customers;
    } catch (error) {
        console.error("Error getting customers:", error);
        throw new Error("Failed to fetch customers.");
    }
}

export async function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'lastInteraction'>): Promise<Customer> {
    try {
        const docRef = await addDoc(customersCollection, {
            ...customerData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastInteraction: serverTimestamp(),
        });

        const newDocSnap = await getDoc(docRef);
        return convertCustomerTimestamps({ id: docRef.id, ...newDocSnap.data() });
    } catch (error) {
        console.error("Error adding customer:", error);
        throw new Error("Failed to add customer.");
    }
}

export async function updateCustomerStatus(customerId: string, status: Customer['status']): Promise<void> {
    try {
        const customerDoc = doc(db, "customers", customerId);
        await updateDoc(customerDoc, {
            status,
            updatedAt: serverTimestamp(),
            lastInteraction: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating customer status:", error);
        throw new Error("Failed to update customer status.");
    }
}

// Re-exporting the type for easier import
export type { Customer };
