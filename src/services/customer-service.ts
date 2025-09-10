

"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, getDoc, deleteDoc, writeBatch } from "firebase/firestore";
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
        return customers.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
        console.error("Error getting customers:", error);
        throw new Error("Failed to fetch customers.");
    }
}

export async function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'lastInteraction' | 'order'>): Promise<Customer> {
    try {
        const docRef = await addDoc(customersCollection, {
            ...customerData,
            order: new Date().getTime(),
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

export async function updateCustomer(customerId: string, customerData: Partial<Omit<Customer, 'id'>>): Promise<Customer> {
    try {
        const customerDoc = doc(db, "customers", customerId);
        await updateDoc(customerDoc, {
            ...customerData,
            updatedAt: serverTimestamp(),
        });
        const updatedDocSnap = await getDoc(customerDoc);
        return convertCustomerTimestamps({ id: customerId, ...updatedDocSnap.data() });

    } catch (error) {
        console.error("Error updating customer:", error);
        throw new Error("Failed to update customer.");
    }
}

export async function deleteCustomer(customerId: string): Promise<void> {
    try {
        const customerDoc = doc(db, "customers", customerId);
        await deleteDoc(customerDoc);
    } catch (error) {
        console.error("Error deleting customer:", error);
        throw new Error("Failed to delete customer.");
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

export async function batchUpdateCustomerOrder(customers: { id: string, order: number }[]): Promise<void> {
    try {
        const batch = writeBatch(db);
        customers.forEach(customer => {
            const docRef = doc(db, "customers", customer.id);
            batch.update(docRef, { order: customer.order, updatedAt: serverTimestamp() });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error batch updating customer order:", error);
        throw new Error("Failed to update customer order.");
    }
}


// Re-exporting the type for easier import
export type { Customer };

