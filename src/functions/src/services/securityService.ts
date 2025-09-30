// src/services/securityService.ts
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import * as functions from 'firebase-functions';
import { SecretManagerService } from './secretManager';
import { ValidationResult, CallableRequest } from '../types/whatsapp';

export class SecurityService {
    private secretManager: SecretManagerService;
    private db: admin.firestore.Firestore;

    constructor() {
        this.secretManager = SecretManagerService.getInstance();
        this.db = admin.firestore();
    }

    async validateCallableRequest(request: CallableRequest<any>): Promise<ValidationResult> {
        try {
            // Verifica se o request está autenticado
            if (!request.auth) {
                return { isValid: false, error: 'Unauthorized: User not authenticated' };
            }

            functions.logger.log('validateCallableRequest:', 'Request Autenticado');

            const userId = request.auth.uid;
            const companyId = request.data?.companyId;

            if (!companyId) {
                return { isValid: false, error: 'Company ID not provided in the request' };
            }

            functions.logger.log('validateCallableRequest: ', 'Company ID ' + companyId);

            // Verifica se a empresa existe
            const companyDoc = await this.db.collection('companies').doc(companyId).get();
            if (!companyDoc.exists) {
                return { isValid: false, error: 'Company not found' };
            }

            functions.logger.log('validateCallableRequest:', 'Empresa existente ' + JSON.stringify(companyDoc.data()));

            const companyData = companyDoc.data();

            // Verifica se o usuário tem acesso à empresa
            // Estrutura flexível que suporta diferentes modelos de permissão
            const hasAccess =
                // Se a empresa tem um ownerId e é o usuário atual
                companyData?.ownerId === userId ||
                // Se a empresa tem um array de users/members que inclui o usuário
                (companyData?.users && companyData.users.includes(userId)) ||
                // Se a empresa tem um array de authorizedUsers que inclui o usuário
                (companyData?.authorizedUsers && companyData.authorizedUsers.includes(userId)) ||
                // Se a empresa tem um campo createdBy que é o usuário atual
                companyData?.createdBy === userId;

            if (!hasAccess) {
                functions.logger.warn(`User ${userId} attempted to access company ${companyId} without permission`);
                return { isValid: false, error: 'User does not have permission for this company' };
            }

            functions.logger.info(`User ${userId} authorized for company ${companyId}`);
            return { isValid: true, companyId };
        } catch (error) {
            functions.logger.error('Error validating request:', error);
            return { isValid: false, error: 'Internal server error during validation' };
        }
    }

    async verifyWhatsAppCredentials(
        accessToken: string,
        phoneNumberId: string
    ): Promise<boolean> {
        try {
            const response = await fetch(
                `https://graph.facebook.com/v17.0/${phoneNumberId}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.status === 200;
        } catch (error) {
            functions.logger.error('Error verifying WhatsApp credentials:', error);
            return false;
        }
    }

    async validateWebhookSignature(
        companyId: string,
        payload: string,
        signature: string
    ): Promise<boolean> {
        try {
            functions.logger.info(`Validating webhook signature for company: ${companyId}`);

            const appSecret = await this.secretManager.getWhatsAppSecret(companyId);

            const expectedSignature = crypto
                .createHmac('sha256', appSecret)
                .update(payload)
                .digest('hex');

            functions.logger.info(`Signature validation - Received: ${signature.substring(0, 10)}..., Expected: ${expectedSignature.substring(0, 10)}...`);

            const isValid = crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            );

            functions.logger.info(`Signature validation result: ${isValid}`);

            return isValid;
        } catch (error) {
            functions.logger.error('Error validating webhook signature:', error);
            return false;
        }
    }
}
