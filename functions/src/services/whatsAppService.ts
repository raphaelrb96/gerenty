
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

  async fetchMediaUrl(mediaId: string, companyId: string): Promise<string | null> {
    try {
      const accessToken = await this.secretManager.getWhatsAppToken(companyId);

      // 1. Get media details including the temporary URL
      const mediaDetailsResponse = await fetch(`https://graph.facebook.com/v17.0/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!mediaDetailsResponse.ok) {
        const errorData = await mediaDetailsResponse.json();
        functions.logger.error(`[WhatsAppService] Failed to fetch media details for ID ${mediaId}`, { error: errorData, companyId });
        return null;
      }

      const mediaDetails = await mediaDetailsResponse.json();
      const mediaUrl = mediaDetails.url;
      const mimeType = mediaDetails.mime_type;

      if (!mediaUrl || !mimeType) {
        functions.logger.error(`[WhatsAppService] Media URL or MIME type not found for ID ${mediaId}`, { mediaDetails });
        return null;
      }

      // 2. Download the actual media content using the authenticated URL
      const mediaDataResponse = await fetch(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!mediaDataResponse.ok) {
        const errorText = await mediaDataResponse.text();
        functions.logger.error(`[WhatsAppService] Failed to download media content from URL ${mediaUrl}`, { status: mediaDataResponse.status, error: errorText, companyId });
        return null;
      }

      // 3. Convert the downloaded content to a Base64 data URI
      const mediaDownloaded = await mediaDataResponse.json();
      const buffer = await mediaDataResponse.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');

      return `data:${mimeType};base64,${base64Data}`;

    } catch (error) {
      functions.logger.error(`[WhatsAppService] Exception fetching media URL for ID ${mediaId}`, { error, companyId });
      return null;
    }
  }

  async fetchMediaVideoUrl(mediaId: string, companyId: string): Promise<string | null> {
    try {
      const accessToken = await this.secretManager.getWhatsAppToken(companyId);

      // 1. Busca detalhes da mídia
      const mediaDetailsResponse = await fetch(`https://graph.facebook.com/v17.0/${mediaId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!mediaDetailsResponse.ok) {
        const errorData = await mediaDetailsResponse.json();
        functions.logger.error(`Failed to fetch media details for ID ${mediaId}`, { error: errorData });
        return null;
      }

      const mediaDetails = await mediaDetailsResponse.json();
      const mediaUrl = mediaDetails.url;
      const mimeType = mediaDetails.mime_type;

      if (!mediaUrl) {
        functions.logger.error(`Media URL not found for ID ${mediaId}`);
        return null;
      }

      // 2. Faz download do vídeo
      const mediaDataResponse = await fetch(mediaUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (!mediaDataResponse.ok) {
        functions.logger.error(`Failed to download media content for ID ${mediaId}`, {
          status: mediaDataResponse.status
        });
        return null;
      }

      // 3. Faz upload para Firebase Storage
      functions.logger.log(`Fazendo Upload de um video no Storage`);
      const bucket = admin.storage().bucket();
      const fileName = `companies/${companyId}/videos/${mediaId}_${Date.now()}.mp4`;
      const file = bucket.file(fileName);

      const arrayBuffer = await mediaDataResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          metadata: {
            originalMediaId: mediaId,
            companyId: companyId,
            uploadedAt: new Date().toISOString()
          }
        }
      });


      // 4. Gera URL pública (ou signed URL)
      functions.logger.log(`Gerando URL pública para o video`);
      // const [publicUrl] = await file.getSignedUrl({
      //   action: 'read',
      //   expires: '03-01-2500' // Data longa no futuro
      // });

      //if (!publicUrl) {
      functions.logger.log(`Tornando arquivo público e gerando URL`);
      // Torna o arquivo público
      await file.makePublic();
      // Obtém URL pública
      const publicUrlFallback = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      functions.logger.info(`Video uploaded to Storage: ${publicUrlFallback}`);
      return publicUrlFallback;
      //}

      //functions.logger.info(`Video uploaded to Storage: ${publicUrl}`);
      //return publicUrl;

    } catch (error) {
      functions.logger.error(`Exception processing video for ID ${mediaId}`, { error });
      return null;
    }
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

      let result: MessageResult;
      if (payload.type === 'template') {
        result = await this.tryTemplateMessage(integration.phoneNumberId, accessToken, payload);
      } else {
        result = await this.tryConversationMessage(integration.phoneNumberId, accessToken, payload);
      }

      // ✅  Salvar a mensagem enviada no Firestore se for bem-sucedida
      if (result.success && result.messageId) {
        await this.saveOutboundMessage(companyId, payload, result.messageId);
      }

      return result;

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

  private async saveOutboundMessage(companyId: string, payload: SendMessagePayload, messageId: string): Promise<void> {
    try {
      const consumerQuery = await this.db.collection('companies')
        .doc(companyId)
        .collection('consumers')
        .where('phone', '==', payload.phoneNumber)
        .limit(1)
        .get();

      if (consumerQuery.empty) {
        functions.logger.warn(`[saveOutboundMessage] Consumer not found for phone ${payload.phoneNumber}. Cannot save message.`);
        return;
      }

      const consumerId = consumerQuery.docs[0].id;
      const conversationQuery = await this.db.collection('companies')
        .doc(companyId)
        .collection('conversations')
        .where('consumerId', '==', consumerId)
        .where('status', 'in', ['open', 'pending'])
        .limit(1)
        .get();

      let conversationId: string;
      const now = admin.firestore.Timestamp.now();
      const lastMessageText = payload.message || `[Template: ${payload.templateName}]`;

      if (conversationQuery.empty) {
        const conversationRef = await this.db.collection('companies')
          .doc(companyId)
          .collection('conversations')
          .add({
            consumerId,
            status: 'open',
            unreadMessagesCount: 0, // Outbound message doesn't make it unread
            lastMessage: lastMessageText,
            lastMessageTimestamp: now,
            createdAt: now,
            updatedAt: now,
          });
        conversationId = conversationRef.id;
      } else {
        conversationId = conversationQuery.docs[0].id;
        await this.db.collection('companies')
          .doc(companyId)
          .collection('conversations')
          .doc(conversationId)
          .update({
            lastMessage: lastMessageText,
            lastMessageTimestamp: now,
            updatedAt: now,
            // Reset unread count if we are replying
            unreadMessagesCount: 0
          });
      }

      const messageContent: any = {
        id: messageId,
        direction: 'outbound',
        type: payload.type,
        timestamp: now,
        status: 'sent', // Initial status
        createdAt: now,
      };

      if (payload.type === 'text') {
        messageContent.content = { text: { body: payload.message } };
      } else if (payload.type === 'template') {
        messageContent.content = { template: { name: payload.templateName, language: { code: 'pt_BR' } } };
      }

      await this.db.collection('companies')
        .doc(companyId)
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .add(messageContent);

      functions.logger.info(`[saveOutboundMessage] Saved outbound message ${messageId} to conversation ${conversationId}`);

    } catch (error) {
      functions.logger.error(`[saveOutboundMessage] Error saving outbound message:`, error);
      // Do not throw, as the message was already sent to the user.
    }
  }
}
