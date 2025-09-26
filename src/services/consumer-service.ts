
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import type { Consumer } from "@/lib/types";

const getConsumersCollection = (companyId: string) => collection(db, `companies/${companyId}/consumers`);

const convertConsumerTimestamps = (data: any): Consumer => {
    const consumer = { id: data.id, ...data };
    for (const key of ['createdAt', 'lastPurchaseAt']) {
        if (consumer[key]?.toDate) {
            consumer[key] = consumer[key].toDate().toISOString();
        }
    }
    return consumer as Consumer;
}

export async function getConsumersByCompany(companyId: string): Promise<Consumer[]> {
    try {
        const consumersCollection = getConsumersCollection(companyId);
        const querySnapshot = await getDocs(consumersCollection);
        const consumers: Consumer[] = [];
        querySnapshot.forEach((doc) => {
            consumers.push(convertConsumerTimestamps({ id: doc.id, ...doc.data() }));
        });
        return consumers;
    } catch (error) {
        console.error("Error getting consumers:", error);
        throw new Error("Failed to fetch consumers.");
    }
}

export async function getConsumerById(companyId: string, consumerId: string): Promise<Consumer | null> {
    try {
        const consumerDocRef = doc(db, `companies/${companyId}/consumers`, consumerId);
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
