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

    async validateCallableRequest(request: CallableRequest): Promise<ValidationResult> {
        try {
            // Verifica se o request está autenticado
            if (!request.auth) {
                return { isValid: false, error: 'Unauthorized: User not authenticated' };
            }

            const userId = request.auth.uid;

            // Obtém o companyId do usuário
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (!userDoc.exists) {
                return { isValid: false, error: 'User not found' };
            }

            const userData = userDoc.data();
            const companyId = userData?.companyId;

            if (!companyId) {
                return { isValid: false, error: 'User not associated with any company' };
            }

            // Verifica se a empresa existe
            const companyDoc = await this.db.collection('companies').doc(companyId).get();
            if (!companyDoc.exists) {
                return { isValid: false, error: 'Company not found' };
            }

            return { isValid: true, companyId };
        } catch (error) {
            functions.logger.error('Error validating request:', error);
            return { isValid: false, error: 'Internal server error during validation' };
        }
    }

    async validateWebhookSignature(
        companyId: string,
        payload: string,
        signature: string
    ): Promise<boolean> {
        try {
            const appSecret = await this.secretManager.getWhatsAppSecret(companyId);

            const expectedSignature = crypto
                .createHmac('sha256', appSecret)
                .update(payload)
                .digest('hex');

            return crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            );
        } catch (error) {
            functions.logger.error('Error validating webhook signature:', error);
            return false;
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
}