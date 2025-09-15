
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, updateDoc, writeBatch, increment, getDoc } from "firebase/firestore";
import type { Route, Order, PaymentDetails, OrderStatus } from "@/lib/types";

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

// This function needs to exist to convert timestamps from Firestore for client-side use.
// Added a local helper since it's not exported from order-service.
const convertOrderTimestamps = (data: any): Order => {
    const order = { ...data };
    for (const key of ['createdAt', 'updatedAt', 'completedAt', 'cancelledAt']) {
        if (order[key]?.toDate) {
            order[key] = order[key].toDate().toISOString();
        }
    }
    return order as Order;
}


export async function getRoutes(ownerId: string): Promise<Route[]> {
    try {
        const q = query(routesCollection, where("ownerId", "==", ownerId));
        const querySnapshot = await getDocs(q);
        const routes: Route[] = [];
        for (const doc of querySnapshot.docs) {
            const routeData = convertRouteTimestamps({ id: doc.id, ...doc.data() });
            
            // Fetch the full order objects for the route
            if (routeData.orderIds && routeData.orderIds.length > 0) {
                 const ordersQuery = query(ordersCollection, where('__name__', 'in', routeData.orderIds));
                 const ordersSnapshot = await getDocs(ordersQuery);
                 routeData.orders = ordersSnapshot.docs.map(orderDoc => convertOrderTimestamps({ id: orderDoc.id, ...orderDoc.data() }) as Order);
            } else {
                routeData.orders = [];
            }
            routes.push(routeData);
        }
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
        // 1. Fetch full order details to calculate totals
        const orderDocs = await Promise.all(orderIds.map(id => getDoc(doc(ordersCollection, id))));
        const orders: Order[] = orderDocs.map(d => {
            if (!d.exists()) throw new Error(`Order with ID ${d.id} not found.`);
            return convertOrderTimestamps({id: d.id, ...d.data()}) as Order;
        });

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
            orderIds, // Store only the IDs
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

        // 4. Update all selected orders with the new routeId and status
        orders.forEach(order => {
            const orderRef = doc(ordersCollection, order.id);
            batch.update(orderRef, { 
                'delivery.routeId': newRouteRef.id, 
                'status': 'out_for_delivery', 
            });
        });

        // 5. Commit the batch
        await batch.commit();

        return {
            id: newRouteRef.id,
            ...newRoutePayload,
            orders, // include full order details in returned object for immediate use
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
        
        batch.update(routeRef, { status: 'finalizada', finishedAt: serverTimestamp() });
        
        const routeData = routeDoc.data() as Route & { orderIds: string[] };
        const allOrderIdsInRoute = routeData.orderIds || [];

        for (const orderId of allOrderIdsInRoute) {
            const orderRef = doc(db, "orders", orderId);
            
            if (deliveredOrderIds.includes(orderId)) {
                batch.update(orderRef, { status: 'delivered', completedAt: serverTimestamp() });
            } else {
                batch.update(orderRef, { status: 'returned' });
                
                const orderSnap = await getDoc(orderRef);
                if (orderSnap.exists()) {
                    const orderData = orderSnap.data() as Order;
                    for (const item of orderData.items) {
                        const productRef = doc(db, 'products', item.productId);
                        // Increment stock only if manageStock is a number
                        const productSnap = await getDoc(productRef);
                        if(productSnap.exists() && typeof productSnap.data().availableStock === 'number') {
                           batch.update(productRef, { availableStock: increment(item.quantity) });
                        }
                    }
                }
            }
        }
        
        await batch.commit();
        
    } catch (error) {
        console.error("Error finalizing route:", error);
        throw new Error("Failed to finalize route.");
    }
}

export async function batchUpdateDeliveryDetails(orderIds: string[], updates: { payment?: Partial<PaymentDetails>, status?: OrderStatus }): Promise<void> {
    const batch = writeBatch(db);

    orderIds.forEach(orderId => {
        const orderRef = doc(db, "orders", orderId);
        const updateData: { [key: string]: any } = {};

        if (updates.payment) {
            for (const [key, value] of Object.entries(updates.payment)) {
                updateData[`payment.${key}`] = value;
            }
        }
        
        if (updates.status) {
            updateData['status'] = updates.status;
        }


        if (Object.keys(updateData).length > 0) {
            updateData.updatedAt = serverTimestamp();
            batch.update(orderRef, updateData);
        }
    });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error batch updating delivery details:", error);
        throw new Error("Failed to update deliveries.");
    }
}

export async function updateDeliveryStatus(orderId: string, newStatus: OrderStatus, routeId?: string): Promise<void> {
    try {
        const orderRef = doc(db, 'orders', orderId);
        const updateData: any = {
            'status': newStatus,
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
