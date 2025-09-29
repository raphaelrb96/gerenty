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

      // Primeiro tenta enviar mensagem de conversação (dentro da janela de 24h)
      const conversationResult = await this.tryConversationMessage(
        integration.phoneNumberId,
        accessToken,
        payload
      );

      if (conversationResult.success) {
        return conversationResult;
      }

      // Se falhou, tenta enviar template (fora da janela de 24h)
      functions.logger.info(`[WhatsAppService] Conversation message failed, trying template`);
      const templateResult = await this.tryTemplateMessage(
        integration.phoneNumberId,
        accessToken,
        payload
      );

      return templateResult;

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

      const result = await response.json();

      functions.logger.info(`[WhatsAppService] Conversation API response:`, {
        status: response.status,
        result: result
      });

      if (response.ok && result.messages?.[0]?.id) {
        const messageId = result.messages[0].id;
        functions.logger.info(`[WhatsAppService] Message accepted for delivery, ID: ${messageId}`);

        // Agora verifica o status real da mensagem
        const statusResult = await this.checkMessageStatus(phoneNumberId, accessToken, messageId);

        if (statusResult.delivered) {
          functions.logger.info(`[WhatsAppService] Conversation message delivered successfully`);
          return {
            success: true,
            messageId: messageId,
            messageType: 'conversation'
          };
        } else {
          // Se a mensagem falhou no delivery, verifica se é erro de janela de 24h
          if (statusResult.error?.includes('24') || statusResult.error?.includes('window')) {
            functions.logger.info(`[WhatsAppService] Outside 24h window detected`);
            return {
              success: false,
              error: 'outside_24h_window',
              messageType: 'conversation'
            };
          }

          functions.logger.error(`[WhatsAppService] Conversation message failed to deliver: ${statusResult.error}`);
          return {
            success: false,
            error: statusResult.error || 'Message delivery failed',
            messageType: 'conversation'
          };
        }
      } else {
        // Se a API já rejeitou imediatamente
        functions.logger.error('[WhatsAppService] Conversation message rejected by API:', result.error);

        if (result.error?.code === 131047) {
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
    } catch (error) {
      functions.logger.error('[WhatsAppService] Error sending conversation message:', error);
      return {
        success: false,
        error: 'Conversation message failed',
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

      const templateName = 'test_send';

      const messageData = {
        messaging_product: 'whatsapp',
        to: payload.phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
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

        // Verifica se é erro de template não encontrado/não autorizado
        if (result.error?.code === 131058 || result.error?.code === 131056) {
          errorMessage = `Template "${templateName}" não configurado. Configure templates no painel da Meta.`;

          // Informações detalhadas para o front-end
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
            needsTemplateSetup: true,
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

  private async createTemplateAndRetry(
    phoneNumberId: string,
    accessToken: string,
    payload: SendMessagePayload,
    templateName: string
  ): Promise<MessageResult> {
    try {
      // Tenta criar o template
      const createResult = await this.createTemplate(phoneNumberId, accessToken, templateName);

      if (createResult.success) {
        functions.logger.info(`[WhatsAppService] Template created successfully, waiting for propagation...`);

        // Aguarda um pouco para o template propagar
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Tenta enviar novamente com o template recém-criado
        functions.logger.info(`[WhatsAppService] Retrying message with new template...`);
        return await this.retryWithTemplate(phoneNumberId, accessToken, payload, templateName);
      } else {
        functions.logger.error(`[WhatsAppService] Failed to create template: ${createResult.error}`);

        // Se não conseguiu criar, tenta com templates alternativos
        return await this.tryAlternativeTemplates(phoneNumberId, accessToken, payload);
      }
    } catch (error) {
      functions.logger.error('[WhatsAppService] Error in createTemplateAndRetry:', error);
      return {
        success: false,
        error: 'Template creation and retry failed',
        messageType: 'template'
      };
    }
  }

  private async retryWithTemplate(
    phoneNumberId: string,
    accessToken: string,
    payload: SendMessagePayload,
    templateName: string
  ): Promise<MessageResult> {
    try {
      const messageData = {
        messaging_product: 'whatsapp',
        to: payload.phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
        }
      };

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

      const result = await response.json();

      if (response.ok && result.messages?.[0]?.id) {
        functions.logger.info(`[WhatsAppService] Retry successful with template ${templateName}`);
        return {
          success: true,
          messageId: result.messages[0].id,
          messageType: 'template'
        };
      } else {
        functions.logger.error(`[WhatsAppService] Retry failed:`, result.error);
        return {
          success: false,
          error: `Template created but still failed: ${result.error?.message}`,
          messageType: 'template'
        };
      }
    } catch (error) {
      functions.logger.error('[WhatsAppService] Error in retryWithTemplate:', error);
      return {
        success: false,
        error: 'Retry with template failed',
        messageType: 'template'
      };
    }
  }

  private async tryAlternativeTemplates(
    phoneNumberId: string,
    accessToken: string,
    payload: SendMessagePayload
  ): Promise<MessageResult> {
    try {
      // Lista de templates que podem existir por padrão
      const alternativeTemplates = [
        'hello_world',
        'sample_issue_resolution',
        'sample_flight_confirmation',
        'utilities_quick_reply'
      ];

      for (const templateName of alternativeTemplates) {
        functions.logger.info(`[WhatsAppService] Trying alternative template: ${templateName}`);

        const messageData = {
          messaging_product: 'whatsapp',
          to: payload.phoneNumber,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' },
          }
        };

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

        const result = await response.json();

        if (response.ok && result.messages?.[0]?.id) {
          functions.logger.info(`[WhatsAppService] Alternative template ${templateName} worked!`);
          return {
            success: true,
            messageId: result.messages[0].id,
            messageType: 'template'
          };
        }
      }

      functions.logger.error(`[WhatsAppService] All alternative templates failed`);
      return {
        success: false,
        error: 'Todos os templates falharam. Configure templates manualmente no painel da Meta.',
        messageType: 'template'
      };

    } catch (error) {
      functions.logger.error('[WhatsAppService] Error in tryAlternativeTemplates:', error);
      return {
        success: false,
        error: 'Alternative templates failed',
        messageType: 'template'
      };
    }
  }

  private async checkMessageStatus(
    phoneNumberId: string,
    accessToken: string,
    messageId: string,
    maxRetries: number = 5,
    delayMs: number = 2000
  ): Promise<{ status: string; delivered: boolean; error?: string }> {
    try {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        functions.logger.info(`[WhatsAppService] Checking message status (attempt ${attempt}/${maxRetries}) for: ${messageId}`);

        await new Promise(resolve => setTimeout(resolve, delayMs));

        const response = await fetch(
          `https://graph.facebook.com/v17.0/${phoneNumberId}/messages?message_id=${messageId}&fields=status,errors`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const result = await response.json();

        if (response.ok && result.status) {
          functions.logger.info(`[WhatsAppService] Message ${messageId} status: ${result.status}`);

          // Se a mensagem foi entregue ou lida, consideramos sucesso
          if (result.status === 'delivered' || result.status === 'read' || result.status === 'sent') {
            return { status: result.status, delivered: true };
          }

          // Se falhou, retorna erro
          if (result.status === 'failed') {
            const errorMsg = result.errors?.[0]?.message || 'Message delivery failed';
            functions.logger.error(`[WhatsAppService] Message ${messageId} failed: ${errorMsg}`);
            return { status: result.status, delivered: false, error: errorMsg };
          }

          // Se ainda está pendente, continua verificando
          if (attempt < maxRetries) {
            functions.logger.info(`[WhatsAppService] Message ${messageId} still pending (${result.status}), waiting...`);
            continue;
          } else {
            // Timeout - última tentativa ainda pendente
            return { status: result.status, delivered: false, error: 'Message status check timeout' };
          }
        } else {
          functions.logger.error(`[WhatsAppService] Error checking message status:`, result.error);
          return { status: 'error', delivered: false, error: result.error?.message || 'Failed to check message status' };
        }
      }

      return { status: 'timeout', delivered: false, error: 'Max retries reached' };
    } catch (error) {
      functions.logger.error('[WhatsAppService] Error checking message status:', error);
      return { status: 'error', delivered: false, error: 'Failed to check message status' };
    }
  }

  private async createTemplate(
    phoneNumberId: string,
    accessToken: string,
    templateName: string = 'test_send'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      functions.logger.info(`[WhatsAppService] Attempting to create template: ${templateName}`);

      // Primeiro, precisamos do WhatsApp Business Account ID (WABA ID)
      // O phoneNumberId não é o WABA ID, precisamos buscar o WABA ID correto
      const wabaResponse = await fetch(
        `https://graph.facebook.com/v17.0/${phoneNumberId}?fields=connected_waba`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const wabaResult = await wabaResponse.json();
      functions.logger.info(`[WhatsAppService] WABA lookup result:`, wabaResult);

      if (!wabaResponse.ok) {
        functions.logger.error('[WhatsAppService] Failed to get WABA info:', wabaResult.error);
        return { success: false, error: 'Cannot access WhatsApp Business Account' };
      }

      const wabaId = wabaResult.connected_waba?.id;

      if (!wabaId) {
        functions.logger.error('[WhatsAppService] No WABA ID found in response');
        return { success: false, error: 'WhatsApp Business Account ID not found' };
      }

      functions.logger.info(`[WhatsAppService] Found WABA ID: ${wabaId}`);

      // Estrutura correta do template para a API
      const templateData = {
        name: templateName,
        category: 'UTILITY', // UTILITY, MARKETING, AUTHENTICATION
        components: [
          {
            type: 'BODY',
            text: 'Este é um template de teste para o sistema Gerenty. Mensagem de teste enviada com sucesso!',
            example: {
              body_text: [['Mensagem de teste do sistema Gerenty']]
            }
          },
          {
            type: 'BUTTONS',
            buttons: [
              {
                type: 'QUICK_REPLY',
                text: '👍 Funcionou'
              },
              {
                type: 'QUICK_REPLY',
                text: '🔄 Testar Novamente'
              }
            ]
          }
        ],
        language: 'pt_BR'
      };

      functions.logger.info(`[WhatsAppService] Creating template with data:`, templateData);

      const createResponse = await fetch(
        `https://graph.facebook.com/v17.0/${wabaId}/message_templates`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData),
        }
      );

      const createResult = await createResponse.json();

      functions.logger.info(`[WhatsAppService] Template creation response:`, {
        status: createResponse.status,
        statusText: createResponse.statusText,
        result: createResult
      });

      if (createResponse.ok && createResult.id) {
        functions.logger.info(`[WhatsAppService] Template ${templateName} created successfully, ID: ${createResult.id}`);
        return { success: true };
      } else {
        functions.logger.error('[WhatsAppService] Failed to create template:', createResult.error);

        let errorMsg = 'Failed to create template';
        if (createResult.error?.code === 131073) {
          errorMsg = 'Template com este nome já existe';
        } else if (createResult.error?.code === 131074) {
          errorMsg = 'Limite de templates atingido';
        } else if (createResult.error?.code === 131075) {
          errorMsg = 'Categoria de template inválida';
        } else if (createResult.error?.code === 131076) {
          errorMsg = 'Estrutura do template inválida';
        } else if (createResult.error?.message) {
          errorMsg = createResult.error.message;
        }

        return { success: false, error: errorMsg };
      }
    } catch (error) {
      functions.logger.error('[WhatsAppService] Error creating template:', error);
      return { success: false, error: 'Template creation failed' };
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