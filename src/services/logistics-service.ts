
"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, writeBatch } from "firebase/firestore";
import type { Route, Order } from "@/lib/types";

const routesCollection = collection(db, "routes");
const ordersCollection = collection(db, "orders");

const convertRouteTimestamps = (data: any): Route => {
    const route = { id: data.id, ...data };
    for (const key of ['createdAt', 'startedAt', 'finishedAt']) {
        if (route[key]?.toDate) {
            route[key] = route[key].toDate().toISOString();
        }
    }
    // Ensure orders within the route also have converted timestamps if necessary
    if (route.orders) {
        route.orders = route.orders.map((order: any) => {
            const newOrder = {...order};
            for (const key of ['createdAt', 'updatedAt', 'completedAt', 'cancelledAt']) {
                if (newOrder[key]?.toDate) {
                    newOrder[key] = newOrder[key].toDate().toISOString();
                }
            }
            return newOrder;
        })
    }
    return route as Route;
};


export async function getRoutes(ownerId: string): Promise<Route[]> {
    try {
        const q = query(routesCollection, where("ownerId", "==", ownerId));
        const querySnapshot = await getDocs(q);
        const routes: Route[] = [];
        querySnapshot.forEach((doc) => {
            routes.push(convertRouteTimestamps({ id: doc.id, ...doc.data() }));
        });
        routes.sort((a,b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
        return routes;
    } catch (error) {
        console.error("Error getting routes:", error);
        throw new Error("Failed to fetch routes.");
    }
}


export async function createRoute(routeData: Omit<Route, 'id' | 'createdAt' | 'totalValue' | 'totalFee' | 'status'>): Promise<Route> {
    const batch = writeBatch(db);

    try {
        // 1. Calculate totals
        const totalValue = routeData.orders.reduce((sum, order) => sum + order.total, 0);
        // Assuming fee is stored somewhere or calculated; defaulting to 0 for now
        const totalFee = 0; 

        // 2. Create the new route document
        const newRouteRef = doc(collection(db, "routes"));
        const newRoutePayload = {
            ...routeData,
            totalValue,
            totalFee,
            status: 'A Processar' as const,
            createdAt: serverTimestamp(),
        };
        batch.set(newRouteRef, newRoutePayload);

        // 3. Update all selected orders with the new routeId
        routeData.orders.forEach(order => {
            const orderRef = doc(ordersCollection, order.id);
            batch.update(orderRef, { 'shipping.routeId': newRouteRef.id, status: 'processing' });
        });

        // 4. Commit the batch
        await batch.commit();

        return {
            id: newRouteRef.id,
            ...newRoutePayload,
            createdAt: new Date().toISOString()
        } as Route;

    } catch (error) {
        console.error("Error creating route: ", error);
        throw new Error("Failed to create route.");
    }
}


export type { Route };
