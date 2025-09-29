
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import type { MessageTemplate } from "@/lib/types";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

const createTemplateCallable = httpsCallable<Omit<MessageTemplate, 'id' | 'status'>, { success: boolean, id: string }>(functions, 'createTemplate');
const updateTemplateCallable = httpsCallable<{ templateId: string, data: Partial<MessageTemplate> }, { success: boolean }>(functions, 'updateTemplate');
const deleteTemplateCallable = httpsCallable<{ templateName: string, companyId: string }, { success: boolean }>(functions, 'deleteTemplate');


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

export async function addTemplate(companyId: string, templateData: Omit<MessageTemplate, 'id' | 'status'>): Promise<{ id: string }> {
    try {
        // We call the cloud function which calls the Meta API.
        // We don't save directly to Firestore anymore, the sync function will do that.
        const result = await createTemplateCallable({ ...templateData, companyId });
        if (!result.data.success) {
            throw new Error("Cloud function failed to create template in Meta.");
        }
        return { id: result.data.id };
    } catch (error) {
        console.error("Error adding template: ", error);
        if (error instanceof Error && 'details' in error) {
             const details = (error as any).details;
             throw new Error(details?.message || "Failed to add template via cloud function.");
        }
        throw new Error("Failed to add template.");
    }
}

export async function updateTemplate(companyId: string, templateId: string, templateData: Partial<Omit<MessageTemplate, 'id'>>): Promise<void> {
    try {
        // Updating templates via API is complex (delete/create). 
        // For now, we'll just update our local copy.
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

export async function deleteTemplate(companyId: string, templateName: string): Promise<void> {
    try {
        await deleteTemplateCallable({ templateName, companyId });
    } catch (error) {
        console.error("Error deleting template: ", error);
        throw new Error("Failed to delete template.");
    }
}
