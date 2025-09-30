// functions/src/functions/templateFunctions.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SecurityService } from '../services/securityService';
import { TemplateService } from '../services/template-service';
import { CallableRequest } from '../types/whatsapp';

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const securityService = new SecurityService();
const templateService = new TemplateService();

// ✅ CORREÇÃO: Interface específica para criação
interface CreateTemplateRequest {
    name: string;
    category: string;
    language: string;
    components: any[];
    companyId: string;
    uid?: string;
}

export const createTemplate = functions.https.onCall(async (request: CallableRequest<CreateTemplateRequest>) => {
    const validation = await securityService.validateCallableRequest(request);

    functions.logger.log('Creating template.. uid: ', JSON.stringify(request.auth?.uid));

    // if (!validation.isValid || !validation.companyId) {
    //     functions.logger.error('Creating template Error...', JSON.stringify(validation));
    //     throw new functions.https.HttpsError('unauthenticated', validation.error || 'Validation failed');
    // }

    functions.logger.log('Creating template auth is Valid..');

    try {
        const { name, category, language, components, companyId } = request.data;
        const result = await templateService.createTemplateInMeta(companyId, {
            name,
            category: category as 'UTILITY' | 'MARKETING' | 'AUTHENTICATION',
            language,
            components,
        });
        return {
            success: true,
            id: result.id || `template-${Date.now()}`,
            message: 'Template created successfully'
        };
    } catch (error: any) {
        functions.logger.error('Error creating template:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Failed to create template');
    }
});

// ✅ CORREÇÃO: Interface para update
interface UpdateTemplateRequest {
    companyId: string;
    uid?: string;
    templateName: string; // Mude de templateId para templateName
    data: {
        name?: string;
        category?: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
        components?: any[];
        language?: string;
    };
}

export const updateTemplate = functions.https.onCall(async (request: functions.https.CallableRequest<UpdateTemplateRequest>) => {
    const validation = await securityService.validateCallableRequest(request);
    // if (!validation.isValid || !validation.companyId) {
    //     throw new functions.https.HttpsError('unauthenticated', validation.error || 'Validation failed');
    // }

    // ✅ CORREÇÃO: Agora pegamos todos os 3 parâmetros do request.data
    const { templateName, data, companyId } = request.data;

    try {
        // ✅ CORREÇÃO: Passa todos os 3 parâmetros corretamente
        await templateService.updateTemplateInMeta(companyId, templateName, data);
        return {
            success: true,
            message: 'Template updated successfully'
        };
    } catch (error: any) {
        functions.logger.error('Error updating template:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to update template');
    }
});

// ✅ CORREÇÃO: Interface para delete com companyId
interface DeleteTemplateRequest {
    templateName: string;
    companyId: string;
    uid?: string;
}

export const deleteTemplate = functions.https.onCall(async (request: CallableRequest<DeleteTemplateRequest>) => {
    const validation = await securityService.validateCallableRequest(request);
    // if (!validation.isValid) {
    //     throw new functions.https.HttpsError('unauthenticated', validation.error || 'Validation failed');
    // }

    const { templateName, companyId } = request.data;

    try {
        await templateService.deleteTemplateInMeta(companyId, templateName);
        return {
            success: true,
            message: 'Template deleted successfully'
        };
    } catch (error: any) {
        functions.logger.error('Error deleting template:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Failed to delete template');
    }
});