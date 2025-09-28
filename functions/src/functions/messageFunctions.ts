
// functions/src/functions/messageFunctions.ts
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import * as functions from 'firebase-functions';
import { ValidationService } from '../services/validationService';
import { SecretManagerService } from '../services/secretManager';
import { FirestoreService } from '../services/firestoreService';
import { WhatsAppService } from '../services/whatsappService';
import { SendMessagePayload, MessageData } from '../types/whatsapp';
import * as admin from 'firebase-admin';

// Interface para o token de autenticação customizado
interface CustomAuthToken {
  uid: string;
  companyId: string;
  [key: string]: any;
}

export const sendWhatsAppMessage = functions.https.onCall(async (data: any, context: any) => {
  // Verificar autenticação - onCall já faz a verificação básica
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado.');
  }

  // Extrair companyId do token de autenticação (mais seguro)
  const token = context.auth.token as CustomAuthToken;
  const companyId = token.companyId;
  
  if (!companyId) {
    throw new functions.https.HttpsError('failed-precondition', 'Company ID é obrigatório e não foi encontrado no token.');
  }

  try {
    // Validar dados de entrada
    const { to, message, messageType = 'text', templateName } = data;
    
    if (!to) {
      throw new functions.https.HttpsError('invalid-argument', 'Número de destinatário é obrigatório.');
    }
    if (messageType === 'text' && !message) {
      throw new functions.https.HttpsError('invalid-argument', 'Mensagem de texto é obrigatória.');
    }
    if (messageType === 'template' && !templateName) {
      throw new functions.https.HttpsError('invalid-argument', 'Nome do template é obrigatório para mensagens de template.');
    }

    const phoneRegex = /^\d+$/;
    const cleanPhone = to.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      throw new functions.https.HttpsError('invalid-argument', 'Número de telefone inválido.');
    }

    // Obter integração da empresa
    const integration = await FirestoreService.getCompanyIntegration(companyId);
    if (!integration) {
      throw new functions.https.HttpsError('failed-precondition', 'Integração do WhatsApp não encontrada para esta empresa.');
    }
    if (integration.status !== 'connected') {
      throw new functions.https.HttpsError('failed-precondition', `A integração do WhatsApp está com status: ${integration.status}.`);
    }

    // Obter access token
    const accessToken = await SecretManagerService.getWhatsAppAccessToken(companyId);

    // Preparar payload
    let payload: SendMessagePayload;
    if (messageType === 'template') {
      payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'template',
        template: { name: templateName, language: { code: 'pt_BR' } },
      };
    } else {
      payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: message.substring(0, 4096) },
      };
    }

    // Enviar mensagem
    const result = await WhatsAppService.sendMessage(accessToken, integration.phoneNumberId, payload);
    if (!result.messages || result.messages.length === 0) {
      throw new functions.https.HttpsError('internal', 'Resposta inválida da API do WhatsApp.');
    }

    const consumerId = await findOrCreateConsumerId(companyId, cleanPhone);
    const conversationId = await findOrCreateConversationId(companyId, consumerId);

    const messageData: MessageData = {
      id: result.messages[0].id,
      direction: 'outbound',
      type: messageType,
      content: { text: { body: messageType === 'text' ? message : `Template: ${templateName}` } },
      timestamp: new Date(),
      status: 'sent',
    };

    await FirestoreService.saveMessage(companyId, conversationId, messageData);
    await updateConversationLastMessage(companyId, conversationId, messageData);

    return {
      success: true,
      messageId: result.messages[0].id,
      recipient: cleanPhone,
    };

  } catch (error: any) {
    functions.logger.error('Erro ao enviar mensagem:', { companyId, error: error.message, stack: error.stack, data });
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', error.message || 'Erro interno ao enviar mensagem.');
  }
});


export const sendTestMessage = functions.https.onCall(async (data: any, context: any) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'A requisição precisa ser autenticada.');
    }

    const token = context.auth.token as CustomAuthToken;
    const companyId = token.companyId;

    if (!companyId) {
        throw new functions.https.HttpsError('failed-precondition', 'Company ID não encontrado no token de autenticação.');
    }
    
    try {
        if (!data.testPhone) {
            throw new functions.https.HttpsError('invalid-argument', 'Número de teste é obrigatório');
        }
        const { testPhone } = data;

        const integration = await FirestoreService.getCompanyIntegration(companyId);
        if (!integration || integration.status !== 'connected') {
            throw new functions.https.HttpsError('failed-precondition', 'Integração do WhatsApp não está ativa.');
        }

        const accessToken = await SecretManagerService.getWhatsAppAccessToken(companyId);
        
        const payload: SendMessagePayload = {
            messaging_product: 'whatsapp',
            to: testPhone,
            type: 'template',
            template: { name: 'hello_world', language: { code: 'pt_BR' } },
        };

        const result = await WhatsAppService.sendMessage(accessToken, integration.phoneNumberId, payload);
        if (!result.messages || result.messages.length === 0) {
            throw new functions.https.HttpsError('internal', 'Resposta inválida da API do WhatsApp');
        }

        return {
            success: true,
            messageId: result.messages[0].id,
            recipient: testPhone,
        };
    } catch (error: any) {
        functions.logger.error('Erro no envio de teste:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error.message || 'Erro interno ao enviar mensagem de teste.');
    }
});

// Funções auxiliares
async function findOrCreateConsumerId(companyId: string, phoneNumber: string): Promise<string> {
  return `consumer_${phoneNumber}`;
}
async function findOrCreateConversationId(companyId: string, consumerId: string): Promise<string> {
  return `conv_${consumerId}`;
}
async function updateConversationLastMessage(companyId: string, conversationId: string, messageData: MessageData): Promise<void> {
  try {
    const conversationRef = FirestoreService['db'].collection('companies').doc(companyId).collection('conversations').doc(conversationId);
    await conversationRef.set({
      lastMessage: messageData.content.text?.body,
      lastMessageTimestamp: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
  } catch (error) {
    functions.logger.error('Erro ao atualizar conversa:', error);
  }
}
