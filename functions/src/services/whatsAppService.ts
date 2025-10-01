
// src/services/whatsAppService.ts
import { SecretManagerService } from './secretManager';
import { MessageResult, SendMessagePayload, TemplateErrorInfo, WhatsAppApiResponse } from '../types/whatsapp';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

export class WhatsAppService {
  private secretManager: SecretManagerService;
  private db: admin.firestore.Firestore;

  constructor() {
    this.secretManager = SecretManagerService.getInstance();
    this.db = admin.firestore();
  }

  // src/services/whatsAppService.ts - Atualize completamente a função sendMessage
  async sendMessage(
    companyId: string,
    payload: SendMessagePayload
  ): Promise<MessageResult> {
    try {
      functions.logger.info(`[WhatsAppService] Starting message send to ${payload.phoneNumber}`);

      const accessToken = await this.secretManager.getWhatsAppToken(companyId);
      const integration = await this.getCompanyIntegration(companyId);

      if (!integration) {
        return {
          success: false,
          error: 'WhatsApp integration not found'
        };
      }

      if (payload.type === 'template') {
          return this.tryTemplateMessage(integration.phoneNumberId, accessToken, payload);
      }

      // Default to conversation message
      return this.tryConversationMessage(integration.phoneNumberId, accessToken, payload);

    } catch (error) {
      functions.logger.error('[WhatsAppService] Error sending WhatsApp message:', error);
      return {
        success: false,
        error: 'Internal server error'
      };
    }
  }

  // Atualize as assinaturas das funções
  private async tryConversationMessage(
    phoneNumberId: string,
    accessToken: string,
    payload: SendMessagePayload
  ): Promise<MessageResult> {
    try {
      const messageData = {
        messaging_product: 'whatsapp',
        to: payload.phoneNumber,
        type: 'text',
        text: {
          body: payload.message || 'Mensagem de teste do Gerenty'
        }
      };

      functions.logger.info(`[WhatsAppService] Sending conversation message to ${payload.phoneNumber}`);

      const response = await fetch(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData),
        }
      );

      const result: WhatsAppApiResponse = await response.json();

      functions.logger.info(`[WhatsAppService] Conversation API response:`, {
        status: response.status,
        result: result
      });

      if (response.ok && result.messages?.[0]?.id) {
        const messageId = result.messages[0].id;
        functions.logger.info(`[WhatsAppService] Message accepted for delivery, ID: ${messageId}`);
        return {
            success: true,
            messageId: messageId,
            messageType: 'conversation'
        };
      } else {
        // Se a API já rejeitou imediatamente
        functions.logger.error('[WhatsAppService] Conversation message rejected by API:', result.error);

        if (result.error?.code === 131047 || result.error?.message.includes("24 hour")) {
          functions.logger.info(`[WhatsAppService] Outside 24h window (immediate rejection)`);
          return {
            success: false,
            error: 'outside_24h_window',
            messageType: 'conversation'
          };
        }

        return {
          success: false,
          error: result.error?.message || 'Failed to send conversation message',
          messageType: 'conversation'
        };
      }
    } catch (error: any) {
      functions.logger.error('[WhatsAppService] Error sending conversation message:', error);
      return {
        success: false,
        error: error.message || 'Conversation message failed',
        messageType: 'conversation'
      };
    }
  }

  // src/services/whatsAppService.ts - Corrija a tipagem
  private async tryTemplateMessage(
    phoneNumberId: string,
    accessToken: string,
    payload: SendMessagePayload
  ): Promise<MessageResult> {
    try {
      functions.logger.info(`[WhatsAppService] 🚀 Starting template message process`);

      const templateName = payload.templateName || 'hello_world'; // Fallback to a common template

      const messageData = {
        messaging_product: 'whatsapp',
        to: payload.phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' }, // This might need to be dynamic in the future
        }
      };

      functions.logger.info(`[WhatsAppService] Sending template: ${templateName} to ${payload.phoneNumber}`);

      const response = await fetch(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData),
        }
      );

      const result = await response.json() as WhatsAppApiResponse;

      functions.logger.info(`[WhatsAppService] Template API response:`, {
        status: response.status,
        result: result
      });

      if (response.ok && result.messages?.[0]?.id) {
        const messageId = result.messages[0].id;
        functions.logger.info(`[WhatsAppService] ✅ Template message accepted for delivery, ID: ${messageId}`);

        return {
          success: true,
          messageId: messageId,
          messageType: 'template'
        };
      } else {
        functions.logger.error('[WhatsAppService] ❌ Template message rejected by API:', result.error);

        let errorMessage = 'Falha ao enviar template';
        let templateError: TemplateErrorInfo | undefined = undefined;

        if (result.error?.code === 132001 || result.error?.message.includes("does not exist")) {
          errorMessage = `Template "${templateName}" não existe ou não foi aprovado.`;
          templateError = {
            needsTemplateSetup: true,
            errorCode: result.error.code,
            errorMessage: result.error.message,
            phoneNumberId: phoneNumberId,
            templateName: templateName
          };
          functions.logger.info(`[WhatsAppService] 📋 Template setup required: ${templateName}`);
        } else if (result.error?.message) {
          templateError = {
            needsTemplateSetup: false,
            errorCode: result.error.code,
            errorMessage: result.error.message,
            phoneNumberId: phoneNumberId,
            templateName: templateName
          };
          errorMessage = `${result.error.message} (Code: ${result.error.code})`;
        }

        return {
          success: false,
          error: errorMessage,
          messageType: 'template',
          templateError: templateError
        };
      }
    } catch (error: any) {
      functions.logger.error('[WhatsAppService] 💥 Error in template message:', error);
      return {
        success: false,
        error: `Erro no template: ${error.message}`,
        messageType: 'template'
      };
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
