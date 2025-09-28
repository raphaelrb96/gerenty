// functions/src/functions/messageFunctions.ts
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import * as functions from 'firebase-functions';
import { ValidationService } from '../services/validationService';
import { SecretManagerService } from '../services/secretManager';
import { FirestoreService } from '../services/firestoreService';
import { WhatsAppService } from '../services/whatsappService';
import { SendMessagePayload } from '../types/whatsapp';

// Interface para o token de autenticação customizado
interface CustomAuthToken {
  uid: string;
  companyId: string;
  [key: string]: any;
}

export const sendWhatsAppMessage = functions.https.onCall(async (data: any, context: any) => {
  // Verificar autenticação - contexto agora é CallableContext
  if (!context || !context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  // Extrair companyId do token de autenticação (mais seguro que do data)
  const token = context.auth.token as CustomAuthToken;
  const companyId = token.companyId || data.companyId;
  
  if (!companyId) {
    throw new functions.https.HttpsError('invalid-argument', 'Company ID é obrigatório');
  }

  try {
    // Validar dados de entrada
    const { to, message, messageType = 'text', templateName } = data;
    
    if (!to) {
      throw new functions.https.HttpsError('invalid-argument', 'Número de destinatário é obrigatório');
    }

    if (messageType === 'text' && !message) {
      throw new functions.https.HttpsError('invalid-argument', 'Mensagem de texto é obrigatória');
    }

    if (messageType === 'template' && !templateName) {
      throw new functions.https.HttpsError('invalid-argument', 'Nome do template é obrigatório para mensagens de template');
    }

    // Validar formato do número de telefone
    const phoneRegex = /^\d+$/;
    const cleanPhone = to.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      throw new functions.https.HttpsError('invalid-argument', 'Número de telefone inválido');
    }

    // Obter integração da empresa
    const integration = await FirestoreService.getCompanyIntegration(companyId);
    if (!integration) {
      throw new functions.https.HttpsError('failed-precondition', 'Integração do WhatsApp não encontrada para esta empresa');
    }

    if (integration.status !== 'connected') {
      throw new functions.https.HttpsError('failed-precondition', `Integração do WhatsApp está com status: ${integration.status}`);
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
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
        },
      };
    } else {
      payload = {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { 
          body: message.substring(0, 4096) // Limite da API do WhatsApp
        },
      };
    }

    // Enviar mensagem
    const result = await WhatsAppService.sendMessage(
      accessToken,
      integration.phoneNumberId,
      payload
    );

    if (!result.messages || result.messages.length === 0) {
      throw new functions.https.HttpsError('internal', 'Resposta inválida da API do WhatsApp');
    }

    // Buscar ou criar consumer ID baseado no número de telefone
    const consumerId = await findOrCreateConsumerId(companyId, cleanPhone);
    const conversationId = await findOrCreateConversationId(companyId, consumerId, cleanPhone);

    // Salvar mensagem enviada no Firestore
    const messageData = {
      id: result.messages[0].id,
      direction: 'outbound' as const,
      type: messageType,
      content: {
        text: messageType === 'text' ? message : `Template: ${templateName}`,
        templateName: messageType === 'template' ? templateName : undefined
      },
      timestamp: new Date(),
      status: 'sent' as const,
      whatsappMessageId: result.messages[0].id,
      messageStatus: 'sent'
    };

    await FirestoreService.saveMessage(companyId, conversationId, messageData);

    // Atualizar última mensagem da conversa
    await updateConversationLastMessage(companyId, conversationId, messageData);

    return {
      success: true,
      messageId: result.messages[0].id,
      timestamp: new Date().toISOString(),
      recipient: cleanPhone,
      messageStatus: 'sent'
    };

  } catch (error: any) {
    functions.logger.error('Erro ao enviar mensagem:', {
      companyId,
      error: error.message,
      stack: error.stack,
      data
    });

    // Tratamento específico para erros da API do WhatsApp
    if (error.message?.includes('access token') || error.message?.includes('permission')) {
      throw new functions.https.HttpsError('permission-denied', 'Problema de autenticação com a API do WhatsApp');
    }

    if (error.message?.includes('template') || error.message?.includes('invalid parameter')) {
      throw new functions.https.HttpsError('invalid-argument', error.message);
    }

    throw new functions.https.HttpsError('internal', error.message || 'Erro interno ao enviar mensagem');
  }
});

export const sendTestMessage = functions.https.onRequest(async (req, res) => {
  // Configurar CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    // Autenticação
    const { companyId } = await ValidationService.authenticateRequest(req.headers.authorization);

    // Validar corpo da requisição
    if (!req.body || !req.body.testPhone) {
      res.status(400).json({ error: 'Número de teste é obrigatório' });
      return;
    }

    const { testPhone } = req.body;

    // Validar formato do número de telefone
    const phoneRegex = /^\d+$/;
    const cleanPhone = testPhone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      res.status(400).json({ error: 'Número de telefone inválido' });
      return;
    }

    // Obter integração
    const integration = await FirestoreService.getCompanyIntegration(companyId);
    if (!integration) {
      res.status(400).json({ error: 'Integração não encontrada' });
      return;
    }

    if (integration.status !== 'connected') {
      res.status(400).json({ error: `Integração com status: ${integration.status}` });
      return;
    }

    // Obter access token
    const accessToken = await SecretManagerService.getWhatsAppAccessToken(companyId);

    // Enviar mensagem de teste
    const payload: SendMessagePayload = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: 'hello_world',
        language: { code: 'pt_BR' },
      },
    };

    const result = await WhatsAppService.sendMessage(
      accessToken,
      integration.phoneNumberId,
      payload
    );

    if (!result.messages || result.messages.length === 0) {
      throw new Error('Resposta inválida da API do WhatsApp');
    }

    res.status(200).json({
      success: true,
      messageId: result.messages[0].id,
      status: 'enviado',
      recipient: cleanPhone
    });

  } catch (error: any) {
    functions.logger.error('Erro no envio de teste:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    if (error.message.includes('não autorizado') || error.message.includes('autenticação')) {
      res.status(401).json({ error: 'Problema de autenticação com a API do WhatsApp' });
    } else if (error.message.includes('template') || error.message.includes('inválido')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro interno ao enviar mensagem de teste' });
    }
  }
});

// Funções auxiliares que precisam ser implementadas
async function findOrCreateConsumerId(companyId: string, phoneNumber: string): Promise<string> {
  // Implementar lógica para buscar ou criar consumer
  // Por enquanto, retornar um ID baseado no telefone
  return `consumer_${phoneNumber}`;
}

async function findOrCreateConversationId(companyId: string, consumerId: string, phoneNumber: string): Promise<string> {
  // Implementar lógica para buscar ou criar conversa
  // Por enquanto, retornar um ID baseado no telefone
  return `conv_${phoneNumber}`;
}

async function updateConversationLastMessage(companyId: string, conversationId: string, messageData: any): Promise<void> {
  // Implementar lógica para atualizar última mensagem da conversa
  try {
    const conversationRef = FirestoreService['db']
      .collection('companies')
      .doc(companyId)
      .collection('conversations')
      .doc(conversationId);

    await conversationRef.set({
      lastMessage: messageData.content.text,
      lastMessageTimestamp: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
  } catch (error) {
    functions.logger.error('Erro ao atualizar conversa:', error);
  }
}