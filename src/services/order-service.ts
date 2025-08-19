
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { Order } from "@/lib/types";

const ordersCollection = collection(db, "orders");

export async function getOrders(userId: string): Promise<Order[]> {
    try {
        const q = query(ordersCollection, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];
        querySnapshot.forEach((doc) => {
            orders.push({ id: doc.id, ...doc.data() } as Order);
        });
        return orders;
    } catch (error) {
        console.error("Error getting orders: ", error);
        throw new Error("Failed to fetch orders.");
    }
}
