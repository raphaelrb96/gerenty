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
    ): Promise<{ id: string }> {
        try {
            const wabaId = await this.getWabaId(companyId);
            const accessToken = await this.secretManager.getWhatsAppToken(companyId);

            functions.logger.log('Creating template with:', {
                wabaId,
                templateName: templateData.name,
                category: templateData.category
            });

            // ✅ CORREÇÃO: Estrutura correta para a API da Meta
            const metaTemplateData = {
                name: templateData.name,
                category: templateData.category.toUpperCase(), // ✅ MAIÚSCULAS
                language: templateData.language,
                components: templateData.components.map(component => {
                    // ✅ Remove campos desnecessários e sanitiza
                    const cleanComponent: any = {
                        type: component.type,
                        text: component.text,
                        format: component.format,
                    };

                    // ✅ Adiciona example apenas para BODY se existir
                    if (component.type === 'BODY' && component.example) {
                        cleanComponent.example = component.example;
                    }

                    // ✅ Adiciona buttons se existirem
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
                functions.logger.error('Meta API error details:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: result.error
                });

                let errorMessage = 'Failed to create template in Meta';
                if (result.error?.message) {
                    errorMessage = `${result.error.message} (Code: ${result.error.code})`;
                }

                throw new functions.https.HttpsError('internal', errorMessage);
            }

            if (!result.id) {
                functions.logger.error('Meta API returned success but no template ID:', result);
                throw new functions.https.HttpsError('internal', 'Template created but no ID returned from Meta');
            }

            functions.logger.log('✅ Template created successfully:', result.id);
            return { id: result.id };

        } catch (error: any) {
            functions.logger.error('Error in createTemplateInMeta:', error);

            if (error instanceof functions.https.HttpsError) {
                throw error;
            }

            throw new functions.https.HttpsError('internal', error.message || 'Failed to create template');
        }
    }

    async updateTemplateInMeta(
        companyId: string, // ✅ Adicione companyId
        templateName: string, // ✅ Mude de templateId para templateName
        data: Partial<Omit<MessageTemplate, 'id'>>
    ): Promise<{ success: boolean; message: string }> {
        try {
            functions.logger.log('Attempting template update:', {
                companyId,
                templateName,
                updateData: data
            });
    
            // ✅ CORREÇÃO: Para atualizar um template na Meta, precisamos:
            // 1. Deletar o template existente
            // 2. Criar um novo com as modificações
            
            // Primeiro, obtenha o template atual do Firestore
            const templatesCollection = admin.firestore()
                .collection('companies')
                .doc(companyId)
                .collection('messageTemplates');
                
            const templateQuery = await templatesCollection
                .where('name', '==', templateName)
                .limit(1)
                .get();
    
            if (templateQuery.empty) {
                throw new functions.https.HttpsError('not-found', `Template "${templateName}" not found`);
            }
    
            const existingTemplate = templateQuery.docs[0].data() as MessageTemplate;
            
            functions.logger.log('Found existing template:', existingTemplate.name);
    
            // ✅ Só permite atualizar campos específicos
            const allowedUpdates = ['name', 'category', 'components', 'language'];
            const updateKeys = Object.keys(data);
            
            const invalidUpdates = updateKeys.filter(key => !allowedUpdates.includes(key));
            if (invalidUpdates.length > 0) {
                throw new functions.https.HttpsError(
                    'invalid-argument', 
                    `Cannot update fields: ${invalidUpdates.join(', ')}. Only name, category, components, and language can be updated.`
                );
            }
    
            // ✅ Para mudanças de nome/categoria/components, precisa recriar
            const needsRecreation = updateKeys.some(key => 
                ['name', 'category', 'components'].includes(key)
            );
    
            if (needsRecreation) {
                functions.logger.log('Template needs recreation due to structural changes');
                
                // 1. Primeiro delete o template antigo
                await this.deleteTemplateInMeta(companyId, templateName);
                
                // 2. Crie um novo template com os dados atualizados
                const newTemplateData = {
                    name: data.name || existingTemplate.name,
                    category: data.category || existingTemplate.category,
                    language: data.language || existingTemplate.language,
                    components: data.components || existingTemplate.components,
                };
                
                const result = await this.createTemplateInMeta(companyId, newTemplateData);
                
                return {
                    success: true,
                    message: `Template updated successfully. New template ID: ${result.id}`
                };
            } else {
                // ✅ Apenas atualiza no Firestore (para campos como status)
                await templatesCollection.doc(templateQuery.docs[0].id).update({
                    ...data,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                return {
                    success: true,
                    message: 'Template metadata updated successfully'
                };
            }
    
        } catch (error: any) {
            functions.logger.error('Error in updateTemplateInMeta:', error);
            
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }
            
            throw new functions.https.HttpsError(
                'internal', 
                error.message || 'Failed to update template'
            );
        }
    }

    async deleteTemplateInMeta(companyId: string, templateName: string): Promise<void> {
        try {
            const wabaId = await this.getWabaId(companyId);
            const accessToken = await this.secretManager.getWhatsAppToken(companyId);
    
            functions.logger.log('Deleting template:', { companyId, templateName, wabaId });
    
            // ✅ A API da Meta requer que você delete pelo NAME, não por ID
            const response = await fetch(
                `https://graph.facebook.com/v17.0/${wabaId}/message_templates?name=${encodeURIComponent(templateName)}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                }
            );
    
            const result = await response.json();
    
            if (!response.ok) {
                functions.logger.error('Meta API delete error:', result.error);
                
                let errorMessage = 'Failed to delete template from Meta';
                if (result.error?.message) {
                    errorMessage = `${result.error.message} (Code: ${result.error.code})`;
                }
                
                throw new functions.https.HttpsError('internal', errorMessage);
            }
    
            functions.logger.log('✅ Template deleted successfully:', templateName);
    
        } catch (error: any) {
            functions.logger.error('Error in deleteTemplateInMeta:', error);
            
            if (error instanceof functions.https.HttpsError) {
                throw error;
            }
            
            throw new functions.https.HttpsError('internal', error.message || 'Failed to delete template');
        }
    }
}
