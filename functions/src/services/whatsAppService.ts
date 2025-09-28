// src/services/whatsAppService.ts
import { SecretManagerService } from './secretManager';
import { SendMessagePayload } from '../types/whatsapp';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

export class WhatsAppService {
  private secretManager: SecretManagerService;
  private db: admin.firestore.Firestore;

  constructor() {
    this.secretManager = SecretManagerService.getInstance();
    this.db = admin.firestore();
  }

  async sendMessage(
    companyId: string,
    payload: SendMessagePayload
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const accessToken = await this.secretManager.getWhatsAppToken(companyId);
      
      // Obtém o phoneNumberId da empresa
      const integration = await this.getCompanyIntegration(companyId);
      if (!integration) {
        return { success: false, error: 'WhatsApp integration not found' };
      }

      const messageData: any = {
        messaging_product: 'whatsapp',
        to: payload.phoneNumber,
      };

      if (payload.type === 'template') {
        messageData.type = 'template';
        messageData.template = {
          name: payload.templateName || 'hello_world',
          language: { code: 'pt_BR' },
        };
      } else {
        messageData.type = 'text';
        messageData.text = { body: payload.message };
      }

      const response = await fetch(
        `https://graph.facebook.com/v17.0/${integration.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        return { success: true, messageId: result.messages?.[0]?.id };
      } else {
        functions.logger.error('WhatsApp API error:', result.error);
        return { success: false, error: result.error?.message || 'Failed to send message' };
      }
    } catch (error) {
      functions.logger.error('Error sending WhatsApp message:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  async getCompanyIntegration(companyId: string): Promise<any> {
    try {
      const doc = await this.db.collection('companies')
        .doc(companyId)
        .collection('integrations')
        .doc('whatsapp')
        .get();

      return doc.exists ? doc.data() : null;
    } catch (error) {
      functions.logger.error('Error getting company integration:', error);
      return null;
    }
  }
}