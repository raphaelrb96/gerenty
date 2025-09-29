// functions/src/services/template-service.ts
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { SecretManagerService } from './secretManager';
import { MessageTemplate } from '../types/whatsapp';

export class TemplateService {
    private db = admin.firestore();
    private secretManager = SecretManagerService.getInstance();

    private async getWabaId(companyId: string): Promise<string> {
        const integrationDoc = await this.db.collection('companies').doc(companyId).collection('integrations').doc('whatsapp').get();
        const wabaId = integrationDoc.data()?.whatsAppId;
        if (!wabaId) {
            throw new functions.https.HttpsError('not-found', 'ID da Conta do WhatsApp Business não encontrado.');
        }
        return wabaId;
    }

    async createTemplateInMeta(companyId: string, templateData: Omit<MessageTemplate, 'id' | 'status'>): Promise<{ id: string }> {
        const wabaId = await this.getWabaId(companyId);
        const accessToken = await this.secretManager.getWhatsAppToken(companyId);

        const response = await fetch(`https://graph.facebook.com/v17.0/${wabaId}/message_templates`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(templateData),
        });

        const result = await response.json();

        if (!response.ok) {
            functions.logger.error('Meta API error on create:', result.error);
            throw new functions.https.HttpsError('internal', result.error.message || 'Failed to create template in Meta.');
        }

        // We don't save to Firestore here because the sync function will handle it.
        return { id: result.id };
    }

    async updateTemplateInMeta(templateId: string, data: Partial<MessageTemplate>): Promise<void> {
        // The WhatsApp Graph API does not support direct updates to templates.
        // The process is to delete the old one and create a new one.
        // This is a complex operation and for now, we will log a warning.
        functions.logger.warn(`Template updates are not directly supported by the API. Manual recreation is advised. Template ID: ${templateId}`);
        // In a real scenario, you might add logic here to update the template in your own DB
        // if the status is what's being updated, but not the content.
    }

    async deleteTemplateInMeta(companyId: string, templateName: string): Promise<void> {
        const wabaId = await this.getWabaId(companyId);
        const accessToken = await this.secretManager.getWhatsAppToken(companyId);

        const response = await fetch(`https://graph.facebook.com/v17.0/${wabaId}/message_templates?name=${templateName}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            functions.logger.error('Meta API error on delete:', result.error);
            throw new functions.https.HttpsError('internal', result.error?.message || 'Failed to delete template in Meta.');
        }

        // Also delete from Firestore
        const templatesRef = this.db.collection('companies').doc(companyId).collection('messageTemplates');
        const q = query(templatesRef, where('name', '==', templateName));
        const snapshot = await q.get();
        
        const batch = this.db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
}
