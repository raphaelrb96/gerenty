// functions/src/functions/webhookFunctions.ts
import * as functions from 'firebase-functions';
import { ValidationService } from '../services/validationService';
import { SecretManagerService } from '../services/secretManager';
import { FirestoreService } from '../services/firestoreService';
import { WebhookPayload, Message, Contact } from '../types/whatsapp';

export const whatsappWebhookListener = functions.https.onRequest(async (req, res) => {
  try {
    // Verificar se é uma solicitação de verificação do webhook
    if (req.method === 'GET') {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      // Extrair companyId da URL
      const companyId = req.path.split('/').pop();
      if (!companyId) {
        res.status(400).send('Company ID não encontrado na URL');
        return;
      }

      // Carregar app secret para validação
      const appSecret = await SecretManagerService.getWhatsAppAppSecret(companyId);
      
      if (mode === 'subscribe' && token === appSecret) {
        functions.logger.info(`Webhook verificado para empresa: ${companyId}`);
        res.status(200).send(challenge);
      } else {
        res.status(403).send('Verificação falhou');
      }
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Método não permitido');
      return;
    }

    // Identificar empresa a partir do payload
    const payload: WebhookPayload = req.body;
    const whatsAppBusinessAccountId = payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;

    if (!whatsAppBusinessAccountId) {
      res.status(400).send('WhatsApp Business Account ID não encontrado');
      return;
    }

    // Buscar companyId baseado no WhatsApp Business Account ID
    const companyId = await FirestoreService.findCompanyByWhatsAppId(whatsAppBusinessAccountId);
    if (!companyId) {
      functions.logger.error(`Empresa não encontrada para WhatsApp ID: ${whatsAppBusinessAccountId}`);
      res.status(404).send('Empresa não encontrada');
      return;
    }

    // Validar assinatura do webhook
    const signature = req.headers['x-hub-signature-256'] as string;
    const appSecret = await SecretManagerService.getWhatsAppAppSecret(companyId);
    
    if (!ValidationService.validateWebhookSignature(req.body, signature, appSecret)) {
      functions.logger.error(`Assinatura inválida para empresa: ${companyId}`);
      res.status(401).send('Assinatura inválida');
      return;
    }

    // Processar eventos
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        await processWebhookChange(companyId, change);
      }
    }

    res.status(200).send('EVENT_RECEIVED');

  } catch (error) {
    functions.logger.error('Erro no webhook:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

async function processWebhookChange(companyId: string, change: any) {
  try {
    const value = change.value;

    // Processar mensagens recebidas
    if (value.messages && value.messages.length > 0) {
      for (const message of value.messages) {
        await processIncomingMessage(companyId, message, value.contacts?.[0]);
      }
    }

    // Processar status de mensagens
    if (value.statuses && value.statuses.length > 0) {
      for (const status of value.statuses) {
        await processMessageStatus(companyId, status);
      }
    }

  } catch (error) {
    functions.logger.error('Erro ao processar webhook change:', error);
  }
}

async function processIncomingMessage(companyId: string, message: Message, contact?: Contact) {
  try {
    const phoneNumber = message.from;
    const messageId = message.id;

    // Buscar ou criar consumer
    const consumerId = await findOrCreateConsumer(companyId, phoneNumber, contact?.profile?.name);

    // Buscar ou criar conversa
    const conversationId = await findOrCreateConversation(companyId, consumerId, phoneNumber);

    // Preparar dados da mensagem
    const messageData = {
      id: messageId,
      direction: 'inbound' as const,
      type: message.type,
      content: {
        text: message.text?.body,
        mediaUrl: message.image?.id ? `https://graph.facebook.com/v17.0/${message.image.id}` : undefined,
      },
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      status: 'delivered' as const,
    };

    // Salvar mensagem
    await FirestoreService.saveMessage(companyId, conversationId, messageData);

    // Acionar Flow Engine (se necessário)
    await triggerFlowEngine(companyId, consumerId, message);

    functions.logger.info(`Mensagem processada para empresa ${companyId}, consumer ${consumerId}`);

  } catch (error) {
    functions.logger.error('Erro ao processar mensagem recebida:', error);
  }
}

async function processMessageStatus(companyId: string, status: any) {
  try {
    // Atualizar status da mensagem no Firestore
    // Implementar lógica de atualização de status
    functions.logger.info(`Status atualizado para mensagem ${status.id}: ${status.status}`);
  } catch (error) {
    functions.logger.error('Erro ao processar status:', error);
  }
}

async function findOrCreateConsumer(companyId: string, phoneNumber: string, name?: string): Promise<string> {
  // Lógica para buscar ou criar consumer
  // Retornar consumerId
  return `consumer_${phoneNumber}`;
}

async function findOrCreateConversation(companyId: string, consumerId: string, phoneNumber: string): Promise<string> {
  // Lógica para buscar ou criar conversa
  // Retornar conversationId
  return `conv_${phoneNumber}`;
}

async function triggerFlowEngine(companyId: string, consumerId: string, message: Message) {
  // Integração com o Flow Engine
  // Implementar lógica de acionamento de flows baseado no conteúdo da mensagem
}