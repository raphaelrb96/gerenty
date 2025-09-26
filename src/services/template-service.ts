
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
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
        // This is a simplification. In a real multi-tenant app, you would filter by ownerId.
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

export async function addTemplate(templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<MessageTemplate> {
    try {
        const docRef = await addDoc(templatesCollection, {
            ...templateData,
            status: 'pending', // Default status for new templates
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        const newDocSnap = await getDoc(docRef);
        return convertTemplateTimestamps({ id: docRef.id, ...newDocSnap.data() });
    } catch (error) {
        console.error("Error adding template: ", error);
        throw new Error("Failed to add template.");
    }
}

export async function updateTemplate(templateId: string, templateData: Partial<Omit<MessageTemplate, 'id'>>): Promise<void> {
    try {
        const templateDoc = doc(db, "messageTemplates", templateId);
        await updateDoc(templateDoc, {
            ...templateData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating template: ", error);
        throw new Error("Failed to update template.");
    }
}

export async function deleteTemplate(templateId: string): Promise<void> {
    try {
        const templateDoc = doc(db, "messageTemplates", templateId);
        await deleteDoc(templateDoc);
    } catch (error) {
        console.error("Error deleting template: ", error);
        throw new Error("Failed to delete template.");
    }
}
