

'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, Timestamp, and, getDoc } from "firebase/firestore";
import type { Order, OrderStatus } from "@/lib/types";

const ordersCollection = collection(db, "orders");

const convertOrderTimestamps = (data: any): Order => {
    const order = { id: data.id, ...data };
    for (const key of ['createdAt', 'updatedAt', 'completedAt', 'cancelledAt']) {
        if (order[key]?.toDate) {
            order[key] = order[key].toDate().toISOString();
        }
    }
    return order as Order;
}


// Get all orders for a specific company
export async function getOrders(companyId: string): Promise<Order[]> {
    try {
        const q = query(ordersCollection, where("companyId", "==", companyId));
        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];
        querySnapshot.forEach((doc) => {
            orders.push(convertOrderTimestamps({ id: doc.id, ...doc.data() }));
        });
        orders.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
        return orders;
    } catch (error) {
        console.error("Error getting orders: ", error);
        throw new Error("Failed to fetch orders.");
    }
}

// Get all orders that are ready to be assigned to a route
export async function getUnassignedOrders(companyIds: string[]): Promise<Order[]> {
    if (companyIds.length === 0) return [];
    try {
        // Fetch all orders for the given companies
        const allOrders = await getOrdersForCompanies(companyIds);
        
        // Filter locally
        return allOrders.filter(order => 
            (
            order.status === 'processing' ||
            order.status === 'pending'  ||
            order.status === 'confirmed'
            )
            && 
            order.shipping?.method !== 'retirada_loja'
        );

    } catch (error) {
        console.error("Error getting unassigned orders: ", error);
        throw new Error("Failed to fetch unassigned orders.");
    }
}


// Get all orders for a list of companies
export async function getOrdersForCompanies(companyIds: string[]): Promise<Order[]> {
    if (companyIds.length === 0) {
        return [];
    }
    try {
        const allOrders: Order[] = [];
        // Chunk the companyIds array to avoid Firestore's 30-item limit on 'in' queries
        for (let i = 0; i < companyIds.length; i += 30) {
            const chunk = companyIds.slice(i, i + 30);
            const q = query(ordersCollection, where("companyId", "in", chunk));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                allOrders.push(convertOrderTimestamps({ id: doc.id, ...doc.data() }));
            });
        }
        allOrders.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
        return allOrders;
    } catch (error) {
        console.error("Error getting orders for companies: ", error);
        throw new Error("Failed to fetch orders.");
    }
}


// Add a new order
export async function addOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    try {
        const fullOrderData = {
            ...orderData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(ordersCollection, fullOrderData);
        
        // Fetch the newly created document to get the server-generated timestamps
        const newDocSnap = await getDoc(docRef);
        const newDocData = newDocSnap.data();

        return convertOrderTimestamps({
            id: docRef.id,
            ...newDocData
        }) as Order;

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

    