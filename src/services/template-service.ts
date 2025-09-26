
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import type { MessageTemplate } from "@/lib/types";

const templatesCollection = collection(db, "messageTemplates");

const convertTemplateTimestamps = (data: any): MessageTemplate => {
    const template = { id: data.id, ...data };
    for (const key of ['createdAt', 'updatedAt']) {
        if (template[key]?.toDate) {
            template[key] = template[key].toDate().toISOString();
        }
    }
    return template as MessageTemplate;
};

export async function getTemplatesByUser(ownerId: string): Promise<MessageTemplate[]> {
    try {
        // In a real app, we'd likely filter by company or owner ID.
        // For this prototype, we fetch all for simplicity.
        const q = query(templatesCollection); 
        const querySnapshot = await getDocs(q);
        const templates: MessageTemplate[] = [];
        querySnapshot.forEach((doc) => {
            templates.push(convertTemplateTimestamps({ id: doc.id, ...doc.data() }));
        });
        return templates;
    } catch (error) {
        console.error("Error getting message templates: ", error);
        throw new Error("Failed to fetch message templates.");
    }
}
