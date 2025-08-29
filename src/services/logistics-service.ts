
"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, writeBatch } from "firebase/firestore";
import type { Route, Order } from "@/lib/types";

const routesCollection = collection(db, "routes");

const convertRouteTimestamps = (data: any): Route => {
    const route = { id: data.id, ...data };
    for (const key of ['createdAt', 'startedAt', 'finishedAt']) {
        if (route[key]?.toDate) {
            route[key] = route[key].toDate().toISOString();
        }
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

export async function createRoute(
    ownerId: string, 
    driverId: string, 
    driverName: string, 
    orders: Order[],
    title?: string,
    notes?: string
): Promise<void> {
    const batch = writeBatch(db);

    try {
        // 1. Create the new route document
        const newRouteRef = doc(routesCollection);
        const totalValue = orders.reduce((sum, order) => sum + order.total, 0);
        const totalFee = orders.reduce((sum, order) => sum + (order.shippingCost || 0), 0);

        const newRouteData: Omit<Route, 'id'> = {
            ownerId,
            driverId,
            driverName,
            title: title || `Rota de ${driverName} - ${new Date().toLocaleDateString()}`,
            notes,
            orders,
            status: "A Processar",
            totalValue,
            totalFee,
            createdAt: serverTimestamp(),
        };
        batch.set(newRouteRef, newRouteData);

        // 2. Update each order to include the new routeId
        orders.forEach(order => {
            const orderRef = doc(db, "orders", order.id);
            batch.update(orderRef, { "shipping.routeId": newRouteRef.id });
        });

        // 3. Commit all changes at once
        await batch.commit();

    } catch (error) {
        console.error("Error creating route and updating orders: ", error);
        throw new Error("Failed to create route.");
    }
}

export type { Route };
