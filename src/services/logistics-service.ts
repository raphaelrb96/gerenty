
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


export async function createRoute(routeData: Omit<Route, 'id' | 'createdAt' | 'totalValue' | 'status' | 'orders'> & { orderIds: string[] }): Promise<Route> {
    const batch = writeBatch(db);
    const { orderIds, ...restOfRouteData } = routeData;

    try {
        // 1. Fetch full order details
        const orderDocs = await Promise.all(orderIds.map(id => getDoc(doc(ordersCollection, id))));
        const orders: Order[] = orderDocs.map(d => convertOrderTimestamps({id: d.id, ...d.data()}) as Order);

        // 2. Calculate totals
        const totalValue = orders.reduce((sum, order) => sum + order.total, 0);
        const cashTotal = orders.filter(o => o.payment.method === 'dinheiro').reduce((sum, o) => sum + o.total, 0);
        const cardTotal = orders.filter(o => o.payment.method === 'credito' || o.payment.method === 'debito').reduce((sum, o) => sum + o.total, 0);
        const pixTotal = orders.filter(o => o.payment.method === 'pix').reduce((sum, o) => sum + o.total, 0);
        const onlineTotal = orders.filter(o => o.payment.type === 'online').reduce((sum, o) => sum + o.total, 0);

        // 3. Create the new route document
        const newRouteRef = doc(collection(db, "routes"));
        const newRoutePayload = {
            ...restOfRouteData,
            totalValue,
            cashTotal,
            cardTotal,
            pixTotal,
            onlineTotal,
            cashAccounted: 0,
            earnings: routeData.earnings || { type: 'fixed', value: 0 },
            status: 'em_andamento' as const,
            createdAt: serverTimestamp(),
            startedAt: serverTimestamp(),
        };
        batch.set(newRouteRef, newRoutePayload);

        // 4. Update all selected orders with the new routeId
        orders.forEach(order => {
            const orderRef = doc(ordersCollection, order.id);
            batch.update(orderRef, { 
                'delivery.routeId': newRouteRef.id, 
                'delivery.status': 'em_transito', 
            });
        });

        // 5. Commit the batch
        await batch.commit();

        return {
            id: newRouteRef.id,
            ...newRoutePayload,
            orders, // include full order details in returned object
            createdAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
        } as Route;

    } catch (error) {
        console.error("Error creating route: ", error);
        throw new Error("Failed to create route.");
    }
}

export async function updateRoute(routeId: string, dataToUpdate: Partial<Omit<Route, 'id' | 'orders'>>): Promise<void> {
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
        
        batch.update(routeRef, { status: 'finalizada', finishedAt: serverTimestamp() });
        
        // This is a simplified fetch. In a real scenario, you might need to fetch them again
        // or ensure they are passed correctly.
        const ordersInRoute = await getDocs(query(ordersCollection, where('delivery.routeId', '==', routeId)));

        ordersInRoute.docs.forEach(orderDoc => {
             const orderRef = orderDoc.ref;
             const orderData = orderDoc.data() as Order;

             if (deliveredOrderIds.includes(orderDoc.id)) {
                 batch.update(orderRef, { 'delivery.status': 'entregue', status: 'delivered', completedAt: serverTimestamp() });
             } else {
                 batch.update(orderRef, { 'delivery.status': 'devolvida', status: 'devolvido' });
                
                 for (const item of orderData.items) {
                    const productRef = doc(db, 'products', item.productId);
                    batch.update(productRef, { availableStock: increment(item.quantity) });
                }
             }
        });
        
        await batch.commit();
        
    } catch (error) {
        console.error("Error finalizing route:", error);
        throw new Error("Failed to finalize route.");
    }
}

export async function updateDeliveryStatus(orderId: string, newStatus: 'em_transito' | 'entregue' | 'devolvida' | 'cancelada', routeId?: string): Promise<void> {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const updateData: any = {
            'delivery.status': newStatus,
        };
        if (routeId) {
            updateData['delivery.routeId'] = routeId;
        }
        await updateDoc(orderRef, updateData);
    } catch (error) {
        console.error("Error updating delivery status:", error);
        throw new Error("Failed to update delivery status.");
    }
}

