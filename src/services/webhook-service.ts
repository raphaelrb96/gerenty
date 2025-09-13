
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import type { Webhook } from "@/lib/types";

const webhooksCollection = collection(db, "webhooks");

const convertWebhookTimestamps = (data: any): Webhook => {
    return {
        id: data.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
    } as Webhook;
};

export async function getWebhooks(companyId: string): Promise<Webhook[]> {
    try {
        const q = query(webhooksCollection, where("companyId", "==", companyId));
        const querySnapshot = await getDocs(q);
        const webhooks: Webhook[] = [];
        querySnapshot.forEach((doc) => {
            webhooks.push(convertWebhookTimestamps({ id: doc.id, ...doc.data() }));
        });
        return webhooks;
    } catch (error) {
        console.error("Error getting webhooks:", error);
        throw new Error("Failed to fetch webhooks.");
    }
}

export async function createWebhook(webhookData: Omit<Webhook, 'id' | 'createdAt'>): Promise<Webhook> {
    try {
        const docRef = await addDoc(webhooksCollection, {
            ...webhookData,
            createdAt: serverTimestamp(),
        });
        return { id: docRef.id, ...webhookData, createdAt: new Date() } as Webhook;
    } catch (error) {
        console.error("Error creating webhook:", error);
        throw new Error("Failed to create webhook.");
    }
}

export async function deleteWebhook(webhookId: string): Promise<void> {
    try {
        const webhookDoc = doc(db, "webhooks", webhookId);
        await deleteDoc(webhookDoc);
    } catch (error) {
        console.error("Error deleting webhook:", error);
        throw new Error("Failed to delete webhook.");
    }
}
