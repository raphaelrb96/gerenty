
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, Timestamp } from "firebase/firestore";
import type { Order } from "@/lib/types";

const ordersCollection = collection(db, "orders");

// Get all orders for a specific company
// NOTE: In a real-world scenario, you'd likely want to implement pagination.
export async function getOrders(companyId: string): Promise<Order[]> {
    try {
        const q = query(ordersCollection, where("companyId", "==", companyId));
        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            orders.push({ 
                id: doc.id, 
                ...data,
                // Ensure date fields are handled correctly, they might be Timestamps
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            } as Order);
        });
        // Sort orders by date, most recent first
        orders.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
        return orders;
    } catch (error) {
        console.error("Error getting orders: ", error);
        throw new Error("Failed to fetch orders.");
    }
}

// Add a new order
export async function addOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    try {
        const docRef = await addDoc(ordersCollection, {
            ...orderData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        
        const newOrder: Order = {
            id: docRef.id,
            ...orderData,
            createdAt: Timestamp.now(), // Use Firestore Timestamp for consistency
            updatedAt: Timestamp.now()
        };

        return newOrder;

    } catch (error) {
        console.error("Error adding order: ", error);
        throw new Error("Failed to add order.");
    }
}

// Update an existing order (e.g., to change its status)
export async function updateOrder(orderId: string, dataToUpdate: Partial<Order>): Promise<void> {
    try {
        const orderDoc = doc(db, "orders", orderId);
        await updateDoc(orderDoc, {
            ...dataToUpdate,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating order: ", error);
        throw new Error("Failed to update order.");
    }
}

    