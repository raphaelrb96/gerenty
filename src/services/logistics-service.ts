
"use server";

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, writeBatch, increment, getDoc } from "firebase/firestore";
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

export async function updateRoute(routeId: string, dataToUpdate: Partial<Omit<Route, 'id'>>): Promise<void> {
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
        const routeDoc = await getDoc(routeRef);
        if (!routeDoc.exists()) {
            throw new Error("Route not found");
        }
        const route = routeDoc.data() as Route;
        
        batch.update(routeRef, { status: 'entregue', finishedAt: serverTimestamp() });
        
        for (const order of route.orders) {
            const orderRef = doc(db, 'orders', order.id);
            
            if (deliveredOrderIds.includes(order.id)) {
                batch.update(orderRef, { status: 'delivered', 'delivery.status': 'entregue', completedAt: serverTimestamp() });
            } else {
                batch.update(orderRef, { status: 'devolvido', 'delivery.status': 'devolvida' });
                
                for (const item of order.items) {
                    const productRef = doc(db, 'products', item.productId);
                    batch.update(productRef, { availableStock: increment(item.quantity) });
                }
            }
        }
        
        await batch.commit();
        
    } catch (error) {
        console.error("Error finalizing route:", error);
        throw new Error("Failed to finalize route.");
    }
}
