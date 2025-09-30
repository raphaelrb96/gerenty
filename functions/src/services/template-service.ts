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

    async createTemplateInMeta(
        companyId: string,
        templateData: Omit<MessageTemplate, 'id' | 'status' | 'createdAt' | 'updatedAt'>
    ): Promise<{ id: string, status: 'approved' | 'pending' | 'rejected' }> {
        try {
            const wabaId = await this.getWabaId(companyId);
            const accessToken = await this.secretManager.getWhatsAppToken(companyId);

            functions.logger.log('Creating template with:', {
                wabaId,
                templateName: templateData.name,
                category: templateData.category
            });

            const metaTemplateData = {
                name: templateData.name,
                category: templateData.category.toUpperCase(),
                language: templateData.language,
                components: templateData.components.map(component => {
                    const cleanComponent: any = {
                        type: component.type,
                        text: component.text,
                        format: component.format,
                    };
                    if (component.type === 'BODY' && component.example) {
                        cleanComponent.example = component.example;
                    }
                    if (component.buttons) {
                        cleanComponent.buttons = component.buttons.map(button => ({
                            type: button.type,
                            text: button.text,
                            ...(button.url && { url: button.url }),
                            ...(button.example && { example: button.example })
                        }));
                    }
                    return cleanComponent;
                })
            };

            functions.logger.log('Sending to Meta API:', JSON.stringify(metaTemplateData, null, 2));

            const response = await fetch(
                `https://graph.facebook.com/v17.0/${wabaId}/message_templates`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(metaTemplateData),
                }
            );

            const result = await response.json();
            functions.logger.log('Meta API response:', result);

            if (!response.ok) {
                let errorMessage = result.error?.message || 'Failed to create template in Meta';
                throw new functions.https.HttpsError('internal', `${errorMessage} (Code: ${result.error?.code})`);
            }

            if (!result.id) {
                throw new functions.https.HttpsError('internal', 'Template created but no ID returned from Meta');
            }

            functions.logger.log('✅ Template created successfully:', result.id);
            return { id: result.id, status: (result.status?.toLowerCase() || 'pending') };

        } catch (error: any) {
            functions.logger.error('Error in createTemplateInMeta:', error);
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }
            throw new functions.https.HttpsError('internal', error.message || 'Failed to create template');
        }
    }

    async saveTemplateInFirestore(
        companyId: string,
        templateData: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<void> {
        try {
            const templatesCollection = this.db.collection('companies').doc(companyId).collection('messageTemplates');
            await templatesCollection.add({
                ...templateData,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            functions.logger.info(`Template ${templateData.name} saved to Firestore for company ${companyId}`);
        } catch (error) {
            functions.logger.error(`Error saving template to Firestore for company ${companyId}:`, error);
            // Não relançar como HttpsError para não falhar a operação inteira se a criação na Meta deu certo
        }
    }
    
    async updateTemplateStatusInFirestore(companyId: string, templateName: string, newStatus: string): Promise<void> {
        try {
            const templatesCollection = this.db.collection('companies').doc(companyId).collection('messageTemplates');
            const querySnapshot = await templatesCollection.where('name', '==', templateName).get();

            if (querySnapshot.empty) {
                functions.logger.warn(`Template status update received for non-existent template: ${templateName} in company ${companyId}`);
                return;
            }

            const templateDoc = querySnapshot.docs[0];
            await templateDoc.ref.update({
                status: newStatus.toLowerCase(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            functions.logger.info(`Template ${templateName} status updated to ${newStatus} for company ${companyId}`);
        } catch (error) {
             functions.logger.error(`Error updating template status in Firestore for ${templateName}:`, error);
        }
    }


    async updateTemplateInMeta(
        companyId: string,
        templateName: string,
        data: Partial<Omit<MessageTemplate, 'id'>>
    ): Promise<{ success: boolean; message: string }> {
        try {
            functions.logger.log('Attempting template update:', { companyId, templateName, updateData: data });
    
            const templatesCollection = admin.firestore().collection('companies').doc(companyId).collection('messageTemplates');
            const templateQuery = await templatesCollection.where('name', '==', templateName).limit(1).get();
    
            if (templateQuery.empty) {
                throw new functions.https.HttpsError('not-found', `Template "${templateName}" not found`);
            }
    
            const existingTemplate = templateQuery.docs[0].data() as MessageTemplate;
            functions.logger.log('Found existing template:', existingTemplate.name);
    
            const allowedUpdates = ['name', 'category', 'components', 'language'];
            const updateKeys = Object.keys(data);
            const invalidUpdates = updateKeys.filter(key => !allowedUpdates.includes(key));
            if (invalidUpdates.length > 0) {
                throw new functions.https.HttpsError('invalid-argument', `Cannot update fields: ${invalidUpdates.join(', ')}. Only name, category, components, and language can be updated.`);
            }
    
            const needsRecreation = updateKeys.some(key => ['name', 'category', 'components'].includes(key));
    
            if (needsRecreation) {
                functions.logger.log('Template needs recreation due to structural changes');
                await this.deleteTemplateInMeta(companyId, templateName);
                
                const newTemplateData = {
                    name: data.name || existingTemplate.name,
                    category: data.category || existingTemplate.category,
                    language: data.language || existingTemplate.language,
                    components: data.components || existingTemplate.components,
                };
                
                const result = await this.createTemplateInMeta(companyId, newTemplateData);
                await this.saveTemplateInFirestore(companyId, { ...newTemplateData, status: result.status });
                
                return { success: true, message: `Template updated successfully. New template ID: ${result.id}` };
            } else {
                await templatesCollection.doc(templateQuery.docs[0].id).update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                return { success: true, message: 'Template metadata updated successfully' };
            }
    
        } catch (error: any) {
            functions.logger.error('Error in updateTemplateInMeta:', error);
            if (error instanceof functions.https.HttpsError) throw error;
            throw new functions.https.HttpsError('internal', error.message || 'Failed to update template');
        }
    }

    async deleteTemplateInMeta(companyId: string, templateName: string): Promise<void> {
        try {
            const wabaId = await this.getWabaId(companyId);
            const accessToken = await this.secretManager.getWhatsAppToken(companyId);
    
            functions.logger.log('Deleting template:', { companyId, templateName, wabaId });
    
            const response = await fetch(`https://graph.facebook.com/v17.0/${wabaId}/message_templates?name=${encodeURIComponent(templateName)}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });
    
            const result = await response.json();
    
            if (!response.ok) {
                let errorMessage = `Failed to delete template from Meta. (Code: ${result.error?.code})`;
                if (result.error?.message) {
                    errorMessage = `${result.error.message} (Code: ${result.error.code})`;
                }
                throw new functions.https.HttpsError('internal', errorMessage);
            }

            // Also delete from Firestore
            const templatesCollection = this.db.collection('companies').doc(companyId).collection('messageTemplates');
            const querySnapshot = await templatesCollection.where('name', '==', templateName).get();
            if (!querySnapshot.empty) {
                await querySnapshot.docs[0].ref.delete();
            }
    
            functions.logger.log('✅ Template deleted successfully:', templateName);
    
        } catch (error: any) {
            functions.logger.error('Error in deleteTemplateInMeta:', error);
            if (error instanceof functions.https.HttpsError) throw error;
            throw new functions.https.HttpsError('internal', error.message || 'Failed to delete template');
        }
    }
}
