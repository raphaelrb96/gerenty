// functions/src/functions/templateFunctions.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SecurityService } from '../services/securityService';
import { TemplateService } from '../services/template-service';
import { CallableRequest, MessageTemplate } from '../types/whatsapp';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const securityService = new SecurityService();
const templateService = new TemplateService();

export const createTemplate = functions.https.onCall(async (request: CallableRequest<Omit<MessageTemplate, 'id'>>) => {
    const validation = await securityService.validateCallableRequest(request);
    if (!validation.isValid || !validation.companyId) {
        throw new functions.https.HttpsError('unauthenticated', validation.error || 'Validation failed');
    }

    try {
        const result = await templateService.createTemplateInMeta(validation.companyId, request.data);
        return { success: true, ...result };
    } catch (error: any) {
        functions.logger.error('Error creating template:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Failed to create template', error.message);
    }
});


export const updateTemplate = functions.https.onCall(async (request: CallableRequest<{ templateId: string; data: Partial<MessageTemplate> }>) => {
    const validation = await securityService.validateCallableRequest(request);
    if (!validation.isValid || !validation.companyId) {
        throw new functions.https.HttpsError('unauthenticated', validation.error || 'Validation failed');
    }

    const { templateId, data } = request.data;

    try {
        await templateService.updateTemplateInMeta(templateId, data);
        return { success: true };
    } catch (error: any) {
        functions.logger.error('Error updating template:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update template');
    }
});


export const deleteTemplate = functions.https.onCall(async (request: CallableRequest<{ templateName: string }>) => {
    const validation = await securityService.validateCallableRequest(request);
    if (!validation.isValid || !validation.companyId) {
        throw new functions.https.HttpsError('unauthenticated', validation.error || 'Validation failed');
    }

    const { templateName } = request.data;

    try {
        await templateService.deleteTemplateInMeta(validation.companyId, templateName);
        return { success: true };
    } catch (error: any) {
        functions.logger.error('Error deleting template:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete template');
    }
});
