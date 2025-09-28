
// functions/src/services/validationService.ts
import * as crypto from 'crypto';
import * as functions from 'firebase-functions';
import { WhatsAppCredentials } from '../types/whatsapp';
import * as admin from 'firebase-admin';

export class ValidationService {
  static validateWebhookSignature(payload: any, signature: string, appSecret: string): boolean {
    try {
      const hmac = crypto.createHmac('sha256', appSecret);
      const generatedSignature = hmac.update(JSON.stringify(payload)).digest('hex');
      
      return `sha256=${generatedSignature}` === signature;
    } catch (error) {
      functions.logger.error('Erro ao validar assinatura do webhook:', error);
      return false;
    }
  }

  static async authenticateRequest(authHeader: string | undefined): Promise<{ userId: string; companyId: string }> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new functions.https.HttpsError('unauthenticated', 'A requisição precisa ser autenticada.');
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      if (!decodedToken.companyId) {
        throw new functions.https.HttpsError('failed-precondition', 'Company ID não encontrado no token.');
      }

      return {
        userId: decodedToken.uid,
        companyId: decodedToken.companyId,
      };
    } catch (error: any) {
      functions.logger.error('Erro na autenticação:', error);
      throw new functions.https.HttpsError('unauthenticated', error.message || 'Token inválido ou expirado.');
    }
  }

  static validateWhatsAppCredentials(credentials: WhatsAppCredentials): void {
    const requiredFields: (keyof WhatsAppCredentials)[] = ['accessToken', 'whatsAppBusinessAccountId', 'phoneNumberId', 'metaAppSecret'];
    
    for (const field of requiredFields) {
      if (!credentials[field]) {
        throw new functions.https.HttpsError('invalid-argument', `Campo obrigatório faltando: ${field}`);
      }
    }

    if (credentials.accessToken.length < 20) {
      throw new functions.https.HttpsError('invalid-argument', 'Access Token inválido.');
    }
    if (!/^\d+$/.test(credentials.phoneNumberId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Phone Number ID inválido.');
    }
  }
}
