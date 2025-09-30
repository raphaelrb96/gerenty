// src/lib/template-service.ts (ou onde estiver seu código front-end)
'use server';

import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import type { MessageTemplate } from "@/lib/types";
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

// ✅ CORREÇÃO: Interfaces alinhadas com o back-end
interface CreateTemplateResponse {
    success: boolean;
    id: string;
    message?: string;
}

interface UpdateTemplateResponse {
    success: boolean;
    message?: string;
}

interface DeleteTemplateResponse {
    success: boolean;
    message?: string;
}

// ✅ CORREÇÃO: Tipos alinhados com as Cloud Functions
const createTemplateCallable = httpsCallable<{
    name: string;
    category: string;
    language: string;
    components: any[];
    companyId: string;
    uid?: string;
}, CreateTemplateResponse>(functions, 'createTemplate');

const updateTemplateCallable = httpsCallable<{
    templateName: string;
    data: {
        name?: string;
        category?: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
        components?: any[];
        language?: string;
    };
    companyId: string;
    uid?: string;
}, {
    success: boolean;
    message?: string;
}>(functions, 'updateTemplate');

const deleteTemplateCallable = httpsCallable<{
    templateName: string;
    companyId: string;
    uid?: string;
}, DeleteTemplateResponse>(functions, 'deleteTemplate');

const getTemplatesCollection = (companyId: string) =>
    collection(db, `companies/${companyId}/messageTemplates`);

// ✅ CORREÇÃO: Função de conversão mais robusta
const convertTemplateTimestamps = (data: any): MessageTemplate => {
    const template = {
        id: data.id,
        name: data.name || '',
        category: data.category || 'utility',
        language: data.language || 'pt_BR',
        status: data.status || 'pending',
        components: data.components || [],
        createdAt: '',
        updatedAt: '',
        ...data
    };

    // Converte timestamps do Firestore
    for (const key of ['createdAt', 'updatedAt']) {
        if (data[key]?.toDate) {
            template[key] = data[key].toDate().toISOString();
        } else if (data[key]) {
            template[key] = data[key];
        } else {
            template[key] = new Date().toISOString();
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
            try {
                const templateData = convertTemplateTimestamps({
                    id: doc.id,
                    ...doc.data()
                });
                templates.push(templateData);
            } catch (error) {
                console.error(`Error processing template ${doc.id}:`, error);
            }
        });

        return templates;
    } catch (error) {
        console.error("Error getting message templates: ", error);
        throw new Error("Failed to fetch message templates.");
    }
}

// ✅ CORREÇÃO: Interface para criação de template
interface CreateTemplateData {
    name: string;
    category: string;
    language: string;
    components: any[];
}

export async function addTemplate(
    companyId: string,
    templateData: CreateTemplateData
): Promise<{ id: string }> {
    try {
        const result = await createTemplateCallable({
            ...templateData,
            companyId,
            uid: auth.currentUser?.uid
        });

        if (!result.data.success) {
            throw new Error(result.data.message || "Failed to create template in Meta.");
        }

        return { id: result.data.id };
    } catch (error: any) {
        console.error("Error adding template: ", error);

        let errorMessage = "Failed to add template.";
        if (error?.details?.message) {
            errorMessage = error.details.message;
        } else if (error?.message) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }
}

// ✅ CORREÇÃO: Interface para atualização
interface UpdateTemplateData {
    name?: string;
    category?: string;
    components?: any[];
}

export async function updateTemplate(
    companyId: string,
    templateName: string, // Mude de templateId para templateName
    templateData: {
        name?: string;
        category?: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
        components?: any[];
        language?: string;
    }
): Promise<void> {
    try {
        // ✅ CORREÇÃO: Envie todos os parâmetros necessários
        const result = await updateTemplateCallable({
            templateName,    // Nome do template
            data: templateData, // Dados para atualizar
            companyId,        // ID da empresa
            uid: auth.currentUser?.uid
        });

        if (!result.data.success) {
            throw new Error(result.data.message || "Failed to update template in Meta.");
        }

        // Atualização local no Firestore se necessário
        const templatesCollection = getTemplatesCollection(companyId);
        const q = query(templatesCollection, where('name', '==', templateName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const templateDoc = querySnapshot.docs[0];
            await updateDoc(templateDoc.ref, {
                ...templateData,
                updatedAt: serverTimestamp(),
            });
        }

    } catch (error: any) {
        console.error("Error updating template: ", error);
        throw new Error(error.message || "Failed to update template.");
    }
}

export async function deleteTemplate(companyId: string, templateName: string): Promise<void> {
    try {
        const result = await deleteTemplateCallable({
            templateName,
            companyId,
            uid: auth.currentUser?.uid
        });

        if (!result.data.success) {
            throw new Error(result.data.message || "Failed to delete template in Meta.");
        }

        // Também remove localmente
        const templatesCollection = getTemplatesCollection(companyId);
        const q = query(templatesCollection, where('name', '==', templateName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const templateDoc = querySnapshot.docs[0];
            await deleteDoc(templateDoc.ref);
        }

    } catch (error: any) {
        console.error("Error deleting template: ", error);
        throw new Error(error.message || "Failed to delete template.");
    }
}