
"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, writeBatch, increment } from "firebase/firestore";
import type { Route, Order } from "@/lib/types";

const routesCollection = collection(db, "routes");
const ordersCollection = collection(db, "orders");
const productsCollection = collection(db, "products");


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


export async function createRoute(routeData: Omit<Route, 'id' | 'createdAt' | 'totalValue' | 'status'>): Promise<Route> {
    const batch = writeBatch(db);

    try {
        // 1. Calculate totals
        const totalValue = routeData.orders.reduce((sum, order) => sum + order.total, 0);
        const totalCashInRoute = routeData.orders
            .filter(o => o.payment.method === 'dinheiro')
            .reduce((sum, o) => sum + o.total, 0);
        
        // 2. Create the new route document
        const newRouteRef = doc(collection(db, "routes"));
        const newRoutePayload = {
            ...routeData,
            totalValue,
            totalCashInRoute,
            totalEarnings: 0, // Default to 0, can be updated later
            status: 'a_processar' as const,
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

export async function updateRoute(routeId: string, dataToUpdate: Partial<Route>): Promise<void> {
    try {
        const routeDoc = doc(db, "routes", routeId);
        await updateDoc(routeDoc, {
            ...dataToUpdate,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating route: ", error);
        throw new Error("Failed to update route.");
    }
}

export async function finalizeRoute(routeId: string, deliveredOrderIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    const routeRef = doc(db, 'routes', routeId);

    try {
        // 1. Get the route to find all associated orders
        const routeDoc = await doc(routeRef).get();
        if (!routeDoc.exists()) {
            throw new Error("Route not found");
        }
        const route = routeDoc.data() as Route;
        
        // 2. Update the main route status
        batch.update(routeRef, { status: 'entregue', finishedAt: serverTimestamp() });
        
        // 3. Iterate through all orders in the route
        for (const order of route.orders) {
            const orderRef = doc(db, 'orders', order.id);
            
            if (deliveredOrderIds.includes(order.id)) {
                // This order was delivered
                batch.update(orderRef, { status: 'delivered', completedAt: serverTimestamp() });
            } else {
                // This order was NOT delivered (returned)
                batch.update(orderRef, { status: 'devolvido' });
                
                // 4. For each returned item, increment the stock back
                for (const item of order.items) {
                    const productRef = doc(db, 'products', item.productId);
                    // Firestore's increment is atomic and safe for concurrent operations
                    batch.update(productRef, { availableStock: increment(item.quantity) });
                }
            }
        }
        
        // 5. Commit all updates atomically
        await batch.commit();
        
    } catch (error) {
        console.error("Error finalizing route:", error);
        throw new Error("Failed to finalize route.");
    }
}


export type { Route };
