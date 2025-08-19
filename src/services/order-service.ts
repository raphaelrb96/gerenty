
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { Order } from "@/lib/types";

const ordersCollection = collection(db, "orders");

// NOTE: In a real-world scenario, you'd likely want to implement pagination.
export async function getOrders(vendorId: string): Promise<Order[]> {
    try {
        const q = query(ordersCollection, where("vendorId", "==", vendorId));
        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            orders.push({ 
                id: doc.id, 
                ...data,
                // Ensure date fields are handled correctly, they might be Timestamps
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
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
