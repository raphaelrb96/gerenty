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

            const userId = request.auth.uid;
            // O companyId agora vem do payload da requisição
            const companyId = request.data.companyId;

            if (!companyId) {
                return { isValid: false, error: 'Company ID not provided in the request' };
            }

            // Opcional: Verifique se o usuário tem permissão para agir nesta empresa.
            // Para isso, precisaríamos de uma estrutura que ligue usuários a empresas
            // (por exemplo, um array 'authorizedUsers' no documento da empresa).
            // Por enquanto, vamos confiar que se o usuário está autenticado, ele pode agir.
            // Em um cenário de produção, esta verificação é crucial.
            const companyDoc = await this.db.collection('companies').doc(companyId).get();
            if (!companyDoc) {
                return { isValid: false, error: 'Company not found' };
            }
            // Verifica se o dono da empresa é o usuário que faz a requisição
            if (companyDoc.data()?.ownerId !== userId) {
                 // Se não for o dono, verifica se é um funcionário com permissão
                 // (essa lógica pode ser expandida)
                 return { isValid: false, error: 'User does not have permission for this company' };
            }


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
