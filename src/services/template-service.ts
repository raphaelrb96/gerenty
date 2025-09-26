
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import type { MessageTemplate } from "@/lib/types";

const getTemplatesCollection = (companyId: string) => collection(db, `companies/${companyId}/messageTemplates`);

const convertTemplateTimestamps = (data: any): MessageTemplate => {
    const template = { id: data.id, ...data };
    for (const key of ['createdAt', 'updatedAt']) {
        if (template[key]?.toDate) {
            template[key] = template[key].toDate().toISOString();
        }
    }
    return template as MessageTemplate;
};

export async function getTemplatesByCompany(companyId: string): Promise<MessageTemplate[]> {
    try {
        const templatesCollection = getTemplatesCollection(companyId);
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

export async function addTemplate(companyId: string, templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<MessageTemplate> {
    try {
        const templatesCollection = getTemplatesCollection(companyId);
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

export async function updateTemplate(companyId: string, templateId: string, templateData: Partial<Omit<MessageTemplate, 'id'>>): Promise<void> {
    try {
        const templateDoc = doc(db, `companies/${companyId}/messageTemplates`, templateId);
        await updateDoc(templateDoc, {
            ...templateData,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating template: ", error);
        throw new Error("Failed to update template.");
    }
}

export async function deleteTemplate(companyId: string, templateId: string): Promise<void> {
    try {
        const templateDoc = doc(db, `companies/${companyId}/messageTemplates`, templateId);
        await deleteDoc(templateDoc);
    } catch (error) {
        console.error("Error deleting template: ", error);
        throw new Error("Failed to delete template.");
    }
}
