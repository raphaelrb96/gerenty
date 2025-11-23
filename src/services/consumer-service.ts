

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
import type { Customer as Consumer } from "@/lib/types";

const getConsumersCollection = (companyId: string) => collection(db, `customers`);

const convertConsumerTimestamps = (data: any): Consumer => {
    const consumer = { id: data.id, ...data };
    for (const key of ['createdAt', 'lastPurchaseAt']) {
        if (consumer[key]?.toDate) {
            consumer[key] = consumer[key].toDate().toISOString();
        }
    }
    return consumer as Consumer;
}

export function getConsumersByCompany(companyId: string, ownerId: string, callback: (consumers: Consumer[]) => void): Unsubscribe {
    const consumersCollection = getConsumersCollection(companyId);
    const q = query(consumersCollection, where("ownerId", "==", ownerId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const consumers: Consumer[] = [];
        querySnapshot.forEach((doc) => {
            consumers.push(convertConsumerTimestamps({ id: doc.id, ...doc.data() }));
        });
        callback(consumers);
    }, (error) => {
         console.error("Error getting consumers:", error);
        throw new Error("Failed to fetch consumers.");
    });

    return unsubscribe;
}

export async function getConsumerById(consumerId: string): Promise<Consumer | null> {
    try {
        const consumerDocRef = doc(db, `customers`, consumerId);
        const consumerDoc = await getDoc(consumerDocRef);

        if (!consumerDoc.exists()) {
            console.warn(`No consumer found with id: ${consumerId}`);
            return null;
        }
        
        const data = consumerDoc.data();
        return convertConsumerTimestamps({ id: consumerDoc.id, ...data });

    } catch (error) {
        console.error("Error getting consumer by ID: ", error);
        throw new Error("Failed to fetch consumer data.");
    }
}
