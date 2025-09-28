// src/functions/whatsapp.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SecretManagerService } from '../services/secretManager';
import { SecurityService } from '../services/securityService';
import { WhatsAppService } from '../services/whatsAppService';
import {
    CallableRequest,
    SendMessagePayload,
    WhatsAppCredentials
} from '../types/whatsapp';

// Inicializa o Firebase Admin
admin.initializeApp();

const secretManager = SecretManagerService.getInstance();
const securityService = new SecurityService();
const whatsAppService = new WhatsAppService();

/**
 * 1. validateAndSaveCredentials - Configuração Segura Multi-Tenant
 */
export const validateAndSaveCredentials = functions.https.onCall(
    async (request: CallableRequest<WhatsAppCredentials>): Promise<{
        success: boolean;
        message: string;
        webhookUrl: string;
        companyId: string;
    }> => {
        try {
            // Valida a requisição e obtém o companyId
            const validation = await securityService.validateCallableRequest(request);
            if (!validation.isValid || !validation.companyId) {
                throw new functions.https.HttpsError('unauthenticated', validation.error || 'Validation failed');
            }

            const companyId = validation.companyId;
            const { accessToken, phoneNumberId, whatsAppBusinessId, metaAppSecret } = request.data;

            // Validação inicial dos campos
            if (!accessToken || !phoneNumberId || !whatsAppBusinessId || !metaAppSecret) {
                throw new functions.https.HttpsError('invalid-argument', 'All credentials are required');
            }

            // Teste de saúde da API do Meta
            const isHealthy = await securityService.verifyWhatsAppCredentials(accessToken, phoneNumberId);
            if (!isHealthy) {
                throw new functions.https.HttpsError('failed-precondition', 'Invalid WhatsApp credentials');
            }

            // Persistência segura no Secret Manager
            await secretManager.storeWhatsAppToken(companyId, accessToken);
            await secretManager.storeWhatsAppSecret(companyId, metaAppSecret);

            // Gera a URL do webhook
            const region = process.env.FUNCTION_REGION || 'us-central1';
            const projectId = process.env.GCLOUD_PROJECT;
            const webhookUrl = `https://${region}-${projectId}.cloudfunctions.net/whatsappWebhookListener/${companyId}`;

            // Salva informações não sensíveis no Firestore
            const integrationData = {
                whatsAppId: whatsAppBusinessId,
                phoneNumberId,
                webhookUrl,
                status: 'connected',
                companyId,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            await admin.firestore()
                .collection('companies')
                .doc(companyId)
                .collection('integrations')
                .doc('whatsapp')
                .set(integrationData, { merge: true });

            // Registra o webhook no Meta
            const webhookRegistered = await registerWebhookWithMeta(companyId, accessToken, whatsAppBusinessId);
            if (!webhookRegistered) {
                // Log a warning but don't fail the operation, user can do it manually.
                functions.logger.warn(`Webhook registration failed for company: ${companyId}. User should configure it manually.`);
            }

            return {
                success: true,
                message: 'WhatsApp credentials saved successfully',
                webhookUrl,
                companyId,
            };
        } catch (error: any) {
            functions.logger.error('Error saving WhatsApp credentials:', error);

            if (error instanceof functions.https.HttpsError) {
                throw error;
            }

            throw new functions.https.HttpsError('internal', 'Failed to save WhatsApp credentials');
        }
    }
);

/**
 * 2. whatsappWebhookListener - Processamento de Eventos Multi-Tenant
 */
export const whatsappWebhookListener = functions.https.onRequest(
    async (req: functions.https.Request, res) => {
        // Suporte para verificação do webhook (GET)
        if (req.method === 'GET') {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];

            // Extrai o companyId da URL
            const pathParts = req.path.split('/');
            const companyId = pathParts[pathParts.length - 1];

            if (!companyId) {
                res.status(400).send('Company ID not found in webhook URL');
                return;
            }

            try {
                // Verifica o token usando o secret da empresa
                // No painel da Meta, o 'Verify Token' deve ser o mesmo que o 'metaAppSecret'
                const appSecret = await secretManager.getWhatsAppSecret(companyId);

                if (mode === 'subscribe' && token === appSecret) {
                    functions.logger.info(`Webhook verified for company: ${companyId}`);
                    res.status(200).send(challenge);
                } else {
                    functions.logger.error(`Webhook verification failed for company ${companyId}. Mode: ${mode}, Token: ${token}`);
                    res.status(403).send('Verification failed');
                }
            } catch (error) {
                functions.logger.error('Error verifying webhook:', error);
                res.status(500).send('Internal server error');
            }
            return;
        }

        // Processamento de eventos (POST)
        if (req.method === 'POST') {
            try {
                // Extrai o companyId da URL
                const pathParts = req.path.split('/');
                const companyId = pathParts[pathParts.length - 1];

                if (!companyId) {
                    res.status(400).send('Company ID not found in webhook URL');
                    return;
                }

                const signature = req.headers['x-hub-signature-256'] as string;
                if (!signature) {
                    res.status(401).send('Missing signature');
                    return;
                }

                // Valida a assinatura do webhook
                const rawBody = JSON.stringify(req.body);
                const isValidSignature = await securityService.validateWebhookSignature(
                    companyId,
                    rawBody,
                    signature.replace('sha256=', '')
                );

                if (!isValidSignature) {
                    functions.logger.warn(`Invalid webhook signature for company: ${companyId}`);
                    res.status(401).send('Invalid signature');
                    return;
                }

                const payload = req.body;

                // Processa os eventos do webhook
                await processWebhookEvents(companyId, payload);

                res.status(200).send('EVENT_RECEIVED');
            } catch (error) {
                functions.logger.error('Error processing webhook:', error);
                res.status(500).send('Internal server error');
            }
            return;
        }

        res.status(405).send('Method not allowed');
    }
);

/**
 * 3. sendTestMessage - Utilitário Multi-Tenant
 */
export const sendTestMessage = functions.https.onCall(
    async (request: CallableRequest<SendMessagePayload>): Promise<{
        success: boolean;
        messageId?: string;
        message: string;
    }> => {
        try {
            // Valida a requisição e obtém o companyId
            const validation = await securityService.validateCallableRequest(request);
            if (!validation.isValid || !validation.companyId) {
                throw new functions.https.HttpsError('unauthenticated', validation.error || 'Validation failed');
            }

            const companyId = validation.companyId;
            const { phoneNumber, message, type = 'text', templateName } = request.data;

            if (!phoneNumber) {
                throw new functions.https.HttpsError('invalid-argument', 'Phone number is required');
            }

            if (type === 'text' && !message) {
                throw new functions.https.HttpsError('invalid-argument', 'Message text is required for text messages');
            }

            if (type === 'template' && !templateName) {
                throw new functions.https.HttpsError('invalid-argument', 'Template name is required for template messages');
            }

            const result = await whatsAppService.sendMessage(companyId, {
                phoneNumber,
                message: message || '',
                type,
                templateName,
            });

            if (result.success) {
                return {
                    success: true,
                    messageId: result.messageId,
                    message: 'Message sent successfully',
                };
            } else {
                throw new functions.https.HttpsError('internal', result.error || 'Failed to send message');
            }
        } catch (error: any) {
            functions.logger.error('Error sending test message:', error);

            if (error instanceof functions.https.HttpsError) {
                throw error;
            }

            throw new functions.https.HttpsError('internal', 'Failed to send test message');
        }
    }
);

/**
 * Função auxiliar para registrar webhook no Meta
 */
async function registerWebhookWithMeta(
    companyId: string,
    accessToken: string,
    whatsAppBusinessId: string
): Promise<boolean> {
    try {
        const response = await fetch(
            `https://graph.facebook.com/v17.0/${whatsAppBusinessId}/subscribed_apps`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscribed_fields: ['messages', 'message_deliveries', 'message_reads'],
                }),
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            functions.logger.error(`Error registering webhook for company ${companyId}:`, errorData);
            return false;
        }

        return response.ok;
    } catch (error) {
        functions.logger.error('Error registering webhook with Meta:', error);
        return false;
    }
}

/**
 * Função auxiliar para processar eventos do webhook
 */
async function processWebhookEvents(companyId: string, payload: any): Promise<void> {
    try {
        for (const entry of payload.entry) {
            for (const change of entry.changes) {
                const value = change.value;

                // Processa mensagens recebidas
                if (value.messages) {
                    for (const message of value.messages) {
                        await processIncomingMessage(companyId, message, value.metadata);
                    }
                }

                // Processa status de mensagens
                if (value.statuses) {
                    for (const status of value.statuses) {
                        await processMessageStatus(companyId, status);
                    }
                }
            }
        }
    } catch (error) {
        functions.logger.error('Error processing webhook events:', error);
        throw error;
    }
}

/**
 * Processa mensagens recebidas
 */
async function processIncomingMessage(
    companyId: string,
    message: any,
    metadata: any
): Promise<void> {
    try {
        const db = admin.firestore();
        const phoneNumber = message.from;

        // Busca ou cria o consumer
        const consumerQuery = await db.collection('companies')
            .doc(companyId)
            .collection('consumers')
            .where('phone', '==', phoneNumber)
            .limit(1)
            .get();

        let consumerId: string;
        let consumerName = 'Unknown';

        if (consumerQuery.empty) {
            // Cria novo consumer
            const consumerRef = await db.collection('companies')
                .doc(companyId)
                .collection('consumers')
                .add({
                    name: consumerName,
                    phone: phoneNumber,
                    type: 'lead',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            consumerId = consumerRef.id;
        } else {
            consumerId = consumerQuery.docs[0].id;
            consumerName = consumerQuery.docs[0].data().name || consumerName;
        }

        // Busca ou cria a conversa
        const conversationQuery = await db.collection('companies')
            .doc(companyId)
            .collection('conversations')
            .where('consumerId', '==', consumerId)
            .where('status', 'in', ['open', 'pending'])
            .limit(1)
            .get();

        let conversationId: string;

        if (conversationQuery.empty) {
            // Cria nova conversa
            const conversationRef = await db.collection('companies')
                .doc(companyId)
                .collection('conversations')
                .add({
                    consumerId,
                    status: 'open',
                    unreadMessagesCount: 1,
                    lastMessage: message.text?.body || '[Media message]',
                    lastMessageTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            conversationId = conversationRef.id;
        } else {
            conversationId = conversationQuery.docs[0].id;
            // Atualiza contador de mensagens não lidas
            await db.collection('companies')
                .doc(companyId)
                .collection('conversations')
                .doc(conversationId)
                .update({
                    unreadMessagesCount: admin.firestore.FieldValue.increment(1),
                    lastMessage: message.text?.body || '[Media message]',
                    lastMessageTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
        }

        // Salva a mensagem
        await db.collection('companies')
            .doc(companyId)
            .collection('conversations')
            .doc(conversationId)
            .collection('messages')
            .add({
                id: message.id,
                direction: 'inbound',
                type: message.type,
                content: {
                    text: message.text?.body,
                    mediaUrl: message.image?.url || message.document?.url || message.video?.url,
                    caption: message.image?.caption || message.document?.caption || message.video?.caption,
                },
                timestamp: admin.firestore.Timestamp.fromDate(new Date(parseInt(message.timestamp) * 1000)),
                status: 'delivered',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

        functions.logger.info(`Message processed for company ${companyId}, conversation ${conversationId}`);
    } catch (error) {
        functions.logger.error('Error processing incoming message:', error);
        throw error;
    }
}

/**
 * Processa status de mensagens
 */
async function processMessageStatus(companyId: string, status: any): Promise<void> {
    try {
        const db = admin.firestore();

        // Atualiza o status da mensagem no Firestore
        const messagesQuery = await db.collectionGroup('messages')
            .where('id', '==', status.id)
            .get();

        for (const doc of messagesQuery.docs) {
            await doc.ref.update({
                status: status.status,
                statusTimestamp: admin.firestore.Timestamp.fromDate(new Date(parseInt(status.timestamp) * 1000)),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        functions.logger.info(`Message status updated for company ${companyId}, message ${status.id}`);
    } catch (error) {
        functions.logger.error('Error processing message status:', error);
        throw error;
    }
}
    