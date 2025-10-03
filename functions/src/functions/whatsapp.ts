// src/functions/whatsapp.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { SecretManagerService } from '../services/secretManager';
import { SecurityService } from '../services/securityService';
import { WhatsAppService } from '../services/whatsAppService';
import { TemplateService } from '../services/template-service';
import {
    CallableRequest,
    SendMessagePayload,
    TemplateErrorInfo,
    WebhookPayload,
    WhatsAppCredentials,
    WhatsAppIntegration,
    MessageTemplate,
    IncomingMessage,
    MessageStatus,
    TemplateStatusUpdate,
    MessageContact,
    MessageMetadata,
    Flow,
    Conversation,
    LibraryMessage
} from '../types/whatsapp';
import { FieldValue } from 'firebase-admin/firestore';
import type { Node as FlowNode, Edge as FlowEdge } from 'reactflow';


// Inicializa o Firebase Admin
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();
const secretManager = SecretManagerService.getInstance();
const securityService = new SecurityService();
const whatsAppService = new WhatsAppService();
const templateService = new TemplateService();

/**
 * 1. validateAndSaveCredentials - Configuração Segura Multi-Tenant
 */
export const validateAndSaveCredentials = functions.https.onCall(
    async (request: CallableRequest<WhatsAppCredentials & { companyId: string }>): Promise<{
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
            const integrationData: Omit<WhatsAppIntegration, 'createdAt' | 'updatedAt'> & { createdAt: FieldValue, updatedAt: FieldValue } = {
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
// src/functions/whatsapp.ts
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

            functions.logger.info(`Webhook verification attempt for company: ${companyId}, mode: ${mode}`);

            if (!companyId) {
                functions.logger.error('Company ID not found in webhook URL');
                res.status(400).send('Company ID not found in webhook URL');
                return;
            }

            try {
                // Verifica se o secret existe antes de tentar acessá-lo
                const secretExists = await secretManager.whatsAppSecretExists(companyId);
                if (!secretExists) {
                    functions.logger.error(`WhatsApp secret not found for company: ${companyId}`);
                    res.status(404).send('WhatsApp integration not configured for this company');
                    return;
                }

                // Verifica o token usando o secret da empresa
                const appSecret = await secretManager.getWhatsAppSecret(companyId);

                if (mode === 'subscribe' && token === appSecret) {
                    functions.logger.info(`Webhook verified for company: ${companyId}`);
                    res.status(200).send(challenge);
                } else {
                    functions.logger.error(`Webhook verification failed for company ${companyId}. Mode: ${mode}, Token provided: ${token}, Expected: ${appSecret}`);
                    res.status(403).send('Verification failed');
                }
            } catch (error: any) {
                functions.logger.error('Error verifying webhook:', error);

                // Respostas mais específicas baseadas no erro
                if (error.message.includes('not found')) {
                    res.status(404).send('WhatsApp integration not configured');
                } else if (error.message.includes('Permission denied')) {
                    res.status(500).send('Configuration error');
                } else {
                    res.status(500).send('Internal server error');
                }
            }
            return;
        }

        // Processamento de eventos (POST)
        if (req.method === 'POST') {
            try {
                // Extrai o companyId da URL
                const pathParts = req.path.split('/');
                const companyId = pathParts[pathParts.length - 1];

                functions.logger.info(`Webhook event received for company: ${companyId}`);

                if (!companyId) {
                    res.status(400).send('Company ID not found in webhook URL');
                    return;
                }

                const signature = req.headers['x-hub-signature-256'] as string;
                if (!signature) {
                    functions.logger.warn('Missing signature in webhook request');
                    res.status(401).send('Missing signature');
                    return;
                }

                // Verifica se a integração existe antes de processar
                const secretExists = await secretManager.whatsAppSecretExists(companyId);
                if (!secretExists) {
                    functions.logger.error(`WhatsApp integration not found for company: ${companyId}`);
                    res.status(404).send('WhatsApp integration not configured');
                    return;
                }

                // Valida a assinatura do webhook
                const isValidSignature = await securityService.validateWebhookSignature(
                    companyId,
                    req.rawBody,
                    signature.replace('sha256=', '')
                );

                if (!isValidSignature) {
                    functions.logger.warn(`Invalid webhook signature for company: ${companyId}`);
                    res.status(401).send('Invalid signature');
                    return;
                }

                const payload: WebhookPayload = req.body;

                functions.logger.info(`Processing webhook events for company ${companyId}, entries: ${payload.entry?.length || 0}`);

                // Processa os eventos do webhook
                await processWebhookEvents(companyId, payload);

                res.status(200).send('EVENT_RECEIVED');
            } catch (error: any) {
                functions.logger.error('Error processing webhook:', error);

                if (error.message.includes('not found')) {
                    res.status(404).send('WhatsApp integration not configured');
                } else {
                    res.status(500).send('Internal server error');
                }
            }
            return;
        }

        res.status(405).send('Method not allowed');
    }
);

/**
 * 3. sendMessage - Utilitário Multi-Tenant
 */
// src/functions/whatsapp.ts - Corrija a tipagem e tratamento de erro
export const sendMessage = functions.https.onCall(
    async (request: CallableRequest<SendMessagePayload & { companyId: string }>): Promise<{
        success: boolean;
        messageId?: string;
        message: string;
        messageType?: 'conversation' | 'template';
        templateError?: TemplateErrorInfo;
    }> => {
        try {
            const validation = await securityService.validateCallableRequest(request);
            if (!validation.isValid) {
                throw new functions.https.HttpsError('unauthenticated', validation.error || 'Validation failed');
            }

            const { phoneNumber, companyId } = request.data;
            
            const result = await whatsAppService.sendMessage(companyId, request.data);


            if (result.success) {
                return {
                    success: true,
                    messageId: result.messageId,
                    message: 'Message sent successfully',
                    messageType: result.messageType,
                    templateError: result.templateError
                };
            } else {
                // Cria um objeto de erro com templateError
                const errorDetails: any = {
                    success: false,
                    message: result.error || 'Failed to send message'
                };

                // Inclui templateError se existir
                if (result.templateError) {
                    errorDetails.templateError = result.templateError;
                }

                // Lança erro com detalhes
                throw new functions.https.HttpsError('internal', result.error || 'Failed to send message', errorDetails);
            }
        } catch (error: any) {
            functions.logger.error('[sendMessage] Error:', error);

            if (error instanceof functions.https.HttpsError) {
                // Se já é um HttpsError, propaga com os detalhes originais
                throw error;
            }

            throw new functions.https.HttpsError('internal', 'Failed to send test message');
        }
    }
);

/**
 * 4. checkWhatsAppIntegration - Verifica o status da integração
 */
export const checkWhatsAppIntegration = functions.https.onCall(
    async (request: CallableRequest<{ companyId: string }>): Promise<{
        exists: boolean;
        status?: string;
        webhookUrl?: string;
    }> => {
        try {
            const validation = await securityService.validateCallableRequest(request);
            if (!validation.isValid) {
                throw new functions.https.HttpsError('unauthenticated', validation.error || 'Validation failed');
            }

            const { companyId } = request.data;

            // Verifica se os secrets existem
            const tokenExists = await secretManager.whatsAppSecretExists(companyId);
            const secretExists = await secretManager.whatsAppSecretExists(companyId);

            if (!tokenExists || !secretExists) {
                return { exists: false };
            }

            // Obtém os dados do Firestore
            const integrationDoc = await admin.firestore()
                .collection('companies')
                .doc(companyId)
                .collection('integrations')
                .doc('whatsapp')
                .get();

            if (!integrationDoc.exists) {
                return { exists: false };
            }

            const integrationData = integrationDoc.data() as WhatsAppIntegration;

            return {
                exists: true,
                status: integrationData.status,
                webhookUrl: integrationData.webhookUrl
            };
        } catch (error: any) {
            functions.logger.error('Error checking WhatsApp integration:', error);
            throw new functions.https.HttpsError('internal', 'Failed to check integration status');
        }
    }
);

/**
* 5. getWhatsAppIntegrationStatus - Obtém o status da integração
*/
export const getWhatsAppIntegrationStatus = functions.https.onCall(
    async (request: CallableRequest<{ companyId: string }>): Promise<{
        exists: boolean;
        status?: string;
        webhookUrl?: string;
        whatsAppId?: string;
        phoneNumberId?: string;
    }> => {
        try {
            const validation = await securityService.validateCallableRequest(request);
            if (!validation.isValid) {
                throw new functions.https.HttpsError('unauthenticated', validation.error || 'Validation failed');
            }

            const { companyId } = request.data;

            // Verifica se os secrets existem
            const secretManager = SecretManagerService.getInstance();
            const tokenExists = await secretManager.whatsAppSecretExists(companyId);
            const appSecretExists = await secretManager.whatsAppSecretExists(companyId);

            // Obtém os dados do Firestore
            const integrationDoc = await admin.firestore()
                .collection('companies')
                .doc(companyId)
                .collection('integrations')
                .doc('whatsapp')
                .get();

            if (!integrationDoc.exists || !tokenExists || !appSecretExists) {
                return { exists: false };
            }

            const integrationData = integrationDoc.data() as WhatsAppIntegration;

            return {
                exists: true,
                status: integrationData.status,
                webhookUrl: integrationData.webhookUrl,
                whatsAppId: integrationData.whatsAppId,
                phoneNumberId: integrationData.phoneNumberId
            };
        } catch (error: any) {
            functions.logger.error('Error getting WhatsApp integration status:', error);
            throw new functions.https.HttpsError('internal', 'Failed to get integration status');
        }
    }
);

export const apiSyncWhatsAppTemplates = functions.https.onCall(async (request: CallableRequest<{ companyId: string }>) => {
    const validation = await securityService.validateCallableRequest(request);
    if (!validation.isValid || !validation.companyId) {
        throw new functions.https.HttpsError('unauthenticated', validation.error || 'Validation failed');
    }

    const { companyId } = request.data;

    functions.logger.log('Test Sync WhatsApp templates - CompanyId: ', companyId);

    try {
        const accessToken = await secretManager.getWhatsAppToken(companyId);
        const integrationDoc = await admin.firestore().collection('companies').doc(companyId).collection('integrations').doc('whatsapp').get();

        if (!integrationDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Integração do WhatsApp não encontrada para esta empresa.');
        }

        functions.logger.log('Test Sync WhatsApp templates - IntegrationDoc Exists: ', JSON.stringify(integrationDoc.data()));

        const wabaId = integrationDoc.data()?.whatsAppId;
        if (!wabaId) {
            throw new functions.https.HttpsError('not-found', 'ID da Conta do WhatsApp Business não encontrado.');
        }

        functions.logger.log('Test Sync WhatsApp templates - WABA ID: ', wabaId);

        // Fetch templates from Meta API
        const response = await fetch(`https://graph.facebook.com/v17.0/${wabaId}/message_templates`, {
            headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new functions.https.HttpsError('internal', `Erro ao buscar templates da Meta: ${errorData.error.message}`);
        }



        const { data: metaTemplates } = await response.json();

        functions.logger.log('Test Sync WhatsApp templates - Busca de Templetes na Meta: ', metaTemplates);

        // Fetch existing templates from Firestore
        const firestoreTemplatesRef = admin.firestore().collection('companies').doc(companyId).collection('messageTemplates');
        const firestoreSnapshot = await firestoreTemplatesRef.get();
        const firestoreTemplates = firestoreSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (MessageTemplate & { id: string })[];

        let addedCount = 0;
        let updatedCount = 0;

        const batch = admin.firestore().batch();

        for (const metaTemplate of metaTemplates) {
            const existingTemplate = firestoreTemplates.find(ft => ft.name === metaTemplate.name && ft.language === metaTemplate.language);


            // Sanitiza os componentes antes de salvar
            const sanitizedComponents = sanitizeMetaTemplateComponents(metaTemplate.components);

            const templatePayload: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
                name: metaTemplate.name,
                category: metaTemplate.category.toLowerCase(),
                language: metaTemplate.language,
                status: metaTemplate.status.toLowerCase(),
                components: sanitizedComponents, // Usa os componentes sanitizados
            };

            if (existingTemplate) {
                // Update if status is different
                if (existingTemplate.status !== metaTemplate.status.toLowerCase()) {
                    const docRef = firestoreTemplatesRef.doc(existingTemplate.id);
                    batch.update(docRef, { status: metaTemplate.status.toLowerCase(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                    updatedCount++;
                }
            } else {
                // Add new template
                const docRef = firestoreTemplatesRef.doc();
                functions.logger.log('Test Sync WhatsApp templates - Novo Templete adicionado: ', templatePayload);
                batch.set(docRef, { ...templatePayload, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
                addedCount++;
            }
        }

        functions.logger.log('Test Sync WhatsApp templates - Resumo: ', addedCount, updatedCount);
        await batch.commit();

        return { success: true, added: addedCount, updated: updatedCount };

    } catch (error: any) {
        functions.logger.error('Error syncing WhatsApp templates:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Falha ao sincronizar templates do WhatsApp.');
    }
});



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
                    subscribed_fields: ['messages', 'message_template_status_update', 'message_deliveries', 'message_reads'],
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
async function processWebhookEvents(companyId: string, payload: WebhookPayload): Promise<void> {
    try {
        if (!payload.entry) {
            functions.logger.warn(`Webhook payload for company ${companyId} has no 'entry' field.`, { payload });
            return;
        }

        for (const entry of payload.entry) {
            if (!entry.changes) continue;

            for (const change of entry.changes) {
                const value = change.value;
                if (!value) continue;

                // Processa mensagens recebidas
                if (value.messages && value.metadata) {
                    for (const message of value.messages) {
                        await processIncomingMessage(companyId, message, value.metadata, value.contacts || []);
                    }
                }

                // Processa status de mensagens
                if (value.statuses) {
                    for (const status of value.statuses) {
                        await processMessageStatus(companyId, status);
                    }
                }

                // ✅ NOVO: Processa atualização de status do template
                if (value.message_template_status_update) {
                    await processTemplateStatusUpdate(companyId, value.message_template_status_update);
                }
            }
        }
    } catch (error) {
        functions.logger.error(`Error processing webhook events for company ${companyId}:`, { error, payload });
        // Não relança o erro para que a Meta não desative o webhook por falhas consecutivas.
    }
}


/**
 * Processa mensagens recebidas
 */
async function processIncomingMessage(
    companyId: string,
    message: IncomingMessage,
    metadata: MessageMetadata,
    contacts: MessageContact[]
): Promise<void> {
    try {
        const db = admin.firestore();
        const phoneNumber = message.from;

        // Find contact name from the webhook payload
        const contactProfile = contacts.find(c => c.wa_id === phoneNumber);
        const contactName = contactProfile?.profile?.name || 'Unknown';

        // CORREÇÃO: Processa a URL da mídia ANTES de qualquer operação de escrita
        if (message.video?.id) {
            message.video.url = await Promise.race([
                whatsAppService.fetchMediaUrl(message.video.id, companyId),
                new Promise<null>((resolve) =>
                    setTimeout(() => {
                        functions.logger.warn(`Timeout processing video ${message.video.id}`);
                        resolve(null);
                    }, 50000) // 50 segundos timeout
                )
            ]);
        } else if (message.image?.id) {
            message.image.url = await whatsAppService.fetchMediaUrl(message.image.id, companyId);
        } else if (message.audio?.id) {
            message.audio.url = await whatsAppService.fetchMediaUrl(message.audio.id, companyId);
        } else if (message.document?.id) {
            message.document.url = await whatsAppService.fetchMediaUrl(message.document.id, companyId);
        }


        // Busca ou cria o consumer
        const consumerQuery = await db.collection('companies')
            .doc(companyId)
            .collection('consumers')
            .where('phone', '==', phoneNumber)
            .limit(1)
            .get();

        let consumerId: string;
        let consumerRef: admin.firestore.DocumentReference;

        if (consumerQuery.empty) {
            // Cria novo consumer
            consumerRef = db.collection('companies')
                .doc(companyId)
                .collection('consumers')
                .doc();
            await consumerRef.set({
                name: contactName,
                phone: phoneNumber,
                type: 'lead',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            consumerId = consumerRef.id;
        } else {
            consumerRef = consumerQuery.docs[0].ref;
            consumerId = consumerRef.id;
            // Update name if it was 'Unknown' before
            if (consumerQuery.docs[0].data().name === 'Unknown' && contactName !== 'Unknown') {
                await consumerRef.update({ name: contactName });
            }
        }

        // Busca ou cria a conversa
        const conversationQuery = await db.collection('companies')
            .doc(companyId)
            .collection('conversations')
            .where('consumerId', '==', consumerId)
            .where('status', 'in', ['open', 'pending'])
            .limit(1)
            .get();

        let conversationRef: admin.firestore.DocumentReference;
        if (conversationQuery.empty) {
            // Cria nova conversa
            conversationRef = db.collection('companies').doc(companyId).collection('conversations').doc();
        } else {
            conversationRef = conversationQuery.docs[0].ref;
        }

        // START: Lógica de Fluxo de Automação
        const conversationDoc = await conversationRef.get();
        const conversationData = conversationDoc.data() as Conversation | undefined;
        let activeFlowId = conversationData?.activeFlowId;
        let currentStepId = conversationData?.currentStepId;
        let activeFlow: Flow | null = null;
        let flowTriggered = false; // Flag para saber se um novo fluxo foi iniciado nesta execução


        // Se NÃO há fluxo ativo, verifica se a mensagem aciona um novo fluxo
        if (!activeFlowId && message.type === 'text' && message.text?.body) {
            const userMessage = message.text.body.toLowerCase().trim();
            const flowsSnapshot = await db.collection('flows')
                .where('companyId', '==', companyId)
                .where('status', '==', 'published')
                .get();
            
            for (const doc of flowsSnapshot.docs) {
                const flow = { id: doc.id, ...doc.data() } as Flow;
                const triggerNode = flow.nodes.find(n => n.id === '1' && n.data.type === 'keywordTrigger');
                const keywords = triggerNode?.data.triggerKeywords || [];
                
                const isMatch = keywords.some((kw: { value: string, matchType: string }) => {
                    const keyword = kw.value.toLowerCase().trim();
                    if (kw.matchType === 'exact') return userMessage === keyword;
                    if (kw.matchType === 'contains') return userMessage.includes(keyword);
                    // Adicionar mais lógicas de match se necessário
                    return false;
                });

                if (isMatch) {
                    functions.logger.info(`[Flow] Matched flow "${flow.name}" (ID: ${doc.id}) for conversation ${conversationRef.id}`);
                    
                    const isSingleStepFlow = flow.nodes.length <= 2 && flow.edges.length <= 1;

                    activeFlow = flow;
                    flowTriggered = true;

                    const firstStep = await processFlowStep(companyId, consumerRef, activeFlow, '1', null);
                    
                    // Se o fluxo tem mais de um passo, rastreamos o estado
                    if (!isSingleStepFlow) {
                        activeFlowId = doc.id;
                        currentStepId = firstStep?.id || null;
                    } else {
                         // É um fluxo de execução única, não rastreia estado
                         activeFlowId = null;
                         currentStepId = null;
                    }
                    break;
                }
            }
        } else if (activeFlowId && currentStepId) {
             // Carrega o fluxo se ele ainda não foi carregado (caso de um fluxo já ativo)
            if (!activeFlow) {
                const flowDoc = await db.collection('flows').doc(activeFlowId).get();
                if (flowDoc.exists) {
                    activeFlow = { id: flowDoc.id, ...flowDoc.data() } as Flow;
                }
            }

            if (activeFlow) {
                // Processa a etapa atual e obtém a próxima
                const nextStep = await processFlowStep(
                    companyId,
                    consumerRef,
                    activeFlow,
                    currentStepId,
                    message // Passa a mensagem do usuário para processamento
                );
                currentStepId = nextStep?.id || null; // Atualiza o stepId para a próxima etapa
                 // Se não houver próxima etapa, o fluxo terminou.
                if (!currentStepId) {
                    activeFlowId = null;
                    functions.logger.info(`[Flow] Flow ${activeFlow.id} finished for conversation ${conversationRef.id}.`);
                }
            }
        }
        // END: Lógica de Fluxo de Automação

        // Determine a friendly last message summary based on message type
        let lastMessageText = '[Mensagem desconhecida]';
        switch (message.type) {
            case 'text':
                lastMessageText = message.text?.body || '[Mensagem de texto vazia]';
                break;
            case 'image':
                lastMessageText = message.image?.caption || '[Imagem]';
                break;
            case 'video':
                lastMessageText = message.video?.caption || '[Vídeo]';
                break;
            case 'audio':
                lastMessageText = '[Áudio]';
                break;
            case 'document':
                lastMessageText = message.document?.caption || '[Documento]';
                break;
            case 'location':
                lastMessageText = message.location?.name || '[Localização]';
                break;
            case 'interactive':
                if (message.interactive?.type === 'button_reply') {
                    lastMessageText = message.interactive.button_reply.title;
                } else if (message.interactive?.type === 'list_reply') {
                    lastMessageText = message.interactive.list_reply.title;
                } else {
                    lastMessageText = '[Resposta interativa]';
                }
                break;
            default:
                lastMessageText = `[${message.type}]`;
        }

        const messageTimestamp = admin.firestore.Timestamp.fromMillis(parseInt(message.timestamp) * 1000);

        // Cria ou atualiza a conversa
        await conversationRef.set({
            consumerId,
            status: 'open',
            unreadMessagesCount: admin.firestore.FieldValue.increment(1),
            lastMessage: lastMessageText,
            lastMessageTimestamp: messageTimestamp,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            activeFlowId: activeFlowId || null, 
            currentStepId: currentStepId || null, 
            ...(conversationQuery.empty && { createdAt: admin.firestore.FieldValue.serverTimestamp() }) 
        }, { merge: true });


        functions.logger.info('Salvando a Mensagem: ', JSON.stringify(message));

        // Salva a mensagem completa
        await db.collection('companies')
            .doc(companyId)
            .collection('conversations')
            .doc(conversationRef.id)
            .collection('messages')
            .add({
                id: message.id,
                direction: 'inbound',
                type: message.type,
                content: message, // O objeto message agora contém a URL
                timestamp: messageTimestamp,
                status: 'delivered',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

        functions.logger.info(`Message processed for company ${companyId}, conversation ${conversationRef.id}`);
    } catch (error) {
        functions.logger.error('Error processing incoming message:', error);
        throw error;
    }
}

/**
 * Processa a etapa atual de um fluxo e executa a próxima ação.
 * @returns O ID do próximo nó no fluxo, ou null se o fluxo terminar.
 */
async function processFlowStep(
    companyId: string,
    consumerRef: admin.firestore.DocumentReference,
    flow: Flow,
    currentStepId: string,
    userMessage: IncomingMessage | null
): Promise<FlowNode | null> {
    const currentNode = flow.nodes.find(n => n.id === currentStepId);
    if (!currentNode) {
        functions.logger.warn(`[Flow] Node ${currentStepId} not found in flow ${flow.id}. Ending flow.`);
        return null;
    }

    functions.logger.info(`[Flow] Processing step ${currentStepId} of type ${currentNode.data.type}`);

    // Se o nó atual é para capturar dados, salve a resposta do usuário
    if (currentNode.data.type === 'captureData' && userMessage?.text?.body) {
        const variableName = currentNode.data.captureVariable;
        if (variableName) {
            await consumerRef.update({
                [`flowData.${variableName}`]: userMessage.text.body,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            functions.logger.info(`[Flow] Captured data for variable "${variableName}"`);
        }
    }

    // --- LÓGICA DE DECISÃO DE PRÓXIMO NÓ ---
    let nextNode: FlowNode | null = null;
    if (currentNode.data.type === 'conditional') {
        const conditions = currentNode.data.conditions || [];
        const consumerDoc = await consumerRef.get();
        const consumerData = consumerDoc.data() || {};
        const userText = userMessage?.text?.body.toLowerCase().trim();

        let satisfiedEdgeId: string | null = null;

        for (const cond of conditions) {
            const variableValue = consumerData.flowData?.[cond.variable] || userText;
            const comparisonValue = cond.value?.toLowerCase().trim();
            if (!variableValue) continue;

            let isMatch = false;
            switch (cond.operator) {
                case '==': isMatch = variableValue === comparisonValue; break;
                case '!=': isMatch = variableValue !== comparisonValue; break;
                case '>': isMatch = Number(variableValue) > Number(comparisonValue); break;
                case '<': isMatch = Number(variableValue) < Number(comparisonValue); break;
                case 'contains': isMatch = variableValue.includes(comparisonValue); break;
                default: isMatch = false;
            }

            if (isMatch) {
                satisfiedEdgeId = flow.edges.find(e => e.source === currentNode.id && e.sourceHandle === cond.id)?.target || null;
                break; // Use a primeira condição satisfeita
            }
        }
        
        if (satisfiedEdgeId) {
            nextNode = flow.nodes.find(n => n.id === satisfiedEdgeId) || null;
        } else {
            // Se nenhuma condição for satisfeita, usa a saída "else"
            const elseTargetId = flow.edges.find(e => e.source === currentNode.id && e.sourceHandle === 'else')?.target;
            if (elseTargetId) {
                nextNode = flow.nodes.find(n => n.id === elseTargetId) || null;
            }
        }
    } else {
        // Para nós não condicionais, há apenas uma saída
        const nextEdge = flow.edges.find(e => e.source === currentNode.id);
        if (nextEdge) {
            nextNode = flow.nodes.find(n => n.id === nextEdge.target) || null;
        }
    }
    // --- FIM DA LÓGICA DE DECISÃO ---

    if (!nextNode) {
        functions.logger.info(`[Flow] No outgoing edge from node ${currentStepId}. Ending flow.`);
        return null; // Fim do fluxo
    }

    functions.logger.info(`[Flow] Next node is ${nextNode.id} of type ${nextNode.data.type}`);

    // Executa a ação do próximo nó
    switch (nextNode.data.type) {
        case 'message':
            const messageId = nextNode.data.messageId;
            if (messageId) {
                const libraryMessageDoc = await db.collection('companies').doc(companyId).collection('libraryMessages').doc(messageId).get();
                if (libraryMessageDoc.exists) {
                    const libraryMessage = libraryMessageDoc.data() as LibraryMessage;
                    const consumerDoc = await consumerRef.get();
                    const phoneNumber = consumerDoc.data()?.phone;

                    if (phoneNumber && libraryMessage) {
                        const payload: SendMessagePayload = {
                            phoneNumber: phoneNumber,
                            type: libraryMessage.type,
                            content: libraryMessage.content
                        };
                        await whatsAppService.sendMessage(companyId, payload);

                        functions.logger.info(`[Flow] Executed message node ${nextNode.id}.`);
                    }
                }
            }
            break;

        case 'captureData':
            const captureMessage = nextNode.data.captureMessage;
            if (captureMessage) {
                 const consumerDoc = await consumerRef.get();
                 const phoneNumber = consumerDoc.data()?.phone;
                 if (phoneNumber) {
                     await whatsAppService.sendMessage(companyId, {
                         phoneNumber: phoneNumber,
                         type: 'text',
                         content: { text: { body: captureMessage }}
                     });
                     functions.logger.info(`[Flow] Sent capture data prompt from node ${nextNode.id}.`);
                 }
            }
            break;

        case 'internalAction':
            const actionType = nextNode.data.actionType;
            const actionValue = nextNode.data.actionValue;
            if (actionType && actionValue) {
                if (actionType === 'addTag') {
                    await consumerRef.update({ tags: FieldValue.arrayUnion(actionValue) });
                    functions.logger.info(`[Flow] Added tag "${actionValue}" to consumer ${consumerRef.id}`);
                }
                if (actionType === 'removeTag') {
                    await consumerRef.update({ tags: FieldValue.arrayRemove(actionValue) });
                     functions.logger.info(`[Flow] Removed tag "${actionValue}" from consumer ${consumerRef.id}`);
                }
                if (actionType === 'moveCrmStage') {
                    await consumerRef.update({ status: actionValue }); // 'status' in consumer is the stageId
                    functions.logger.info(`[Flow] Moved consumer ${consumerRef.id} to stage "${actionValue}"`);
                }
            }
            break;
            
        case 'conditional':
             // A lógica condicional já foi tratada acima para encontrar este nó.
             // Agora, precisamos encontrar o PRÓXIMO nó a partir daqui, que será a próxima ação.
             return await processFlowStep(companyId, consumerRef, flow, nextNode.id, userMessage);


        default:
            functions.logger.info(`[Flow] Node type ${nextNode.data.type} not implemented yet.`);
            break;
    }

    // Retorna o nó que foi executado, para que o chamador saiba qual é o novo `currentStepId`
    return nextNode;
}


/**
 * Processa status de mensagens
 */
async function processMessageStatus(companyId: string, status: MessageStatus): Promise<void> {
    try {
        const db = admin.firestore();

        // Encontra a conversa que contém a mensagem com base no ID da mensagem
        const messagesQuery = await db.collectionGroup('messages')
            .where('id', '==', status.id)
            .get();

        if (messagesQuery.empty) {
            functions.logger.warn(`Message status update received for non-existent message ID: ${status.id} in company ${companyId}`);
            return;
        }

        for (const doc of messagesQuery.docs) {
            // Garante que estamos atualizando a mensagem da empresa correta
            const conversationRef = doc.ref.parent.parent;
            if (conversationRef?.parent?.id === 'companies' && conversationRef?.parent?.parent?.id === companyId) {
                await doc.ref.update({
                    status: status.status,
                    statusTimestamp: admin.firestore.Timestamp.fromMillis(parseInt(status.timestamp) * 1000),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                functions.logger.info(`Message status updated for company ${companyId}, message ${status.id} to ${status.status}`);
            }
        }
    } catch (error) {
        functions.logger.error('Error processing message status:', { companyId, status, error });
        // Não relança o erro para evitar falhas no webhook
    }
}



/**
 * ✅ NOVO: Processa atualizações de status de template
 */
async function processTemplateStatusUpdate(companyId: string, update: TemplateStatusUpdate): Promise<void> {
    try {
        const { message_template_name: templateName, event } = update;

        if (!templateName || !event) {
            functions.logger.warn(`Template status update missing data for company ${companyId}`, update);
            return;
        }

        functions.logger.info(`Template status update for ${templateName}: ${event}`, { companyId, update });

        await templateService.updateTemplateStatusInFirestore(companyId, templateName, event);

    } catch (error) {
        functions.logger.error('Error processing template status update:', error);
        // Não relança o erro para não parar o processamento de outros webhooks
    }
}


function sanitizeMetaTemplateComponents(components: any[]): any[] {
    if (!Array.isArray(components)) return [];

    return components.map(component => {
        const sanitizedComponent = { ...component };

        // Sanitize 'text' field if it's a string
        if (sanitizedComponent.text && typeof sanitizedComponent.text === 'string') {
            sanitizedComponent.text = sanitizeMetaPatterns(sanitizedComponent.text);
        }

        // Sanitize 'example' field if it exists, but don't delete it
        if (sanitizedComponent.example) {
            const sanitizedExample: any = {};

            // Sanitize 'body_text' which can be an array of arrays of strings
            if (Array.isArray(sanitizedComponent.example.body_text)) {
                sanitizedExample.body_text = sanitizedComponent.example.body_text.map((innerArray: any[]) =>
                    Array.isArray(innerArray)
                        ? innerArray.map(item => sanitizeMetaPatterns(String(item)))
                        : [sanitizeMetaPatterns(String(innerArray))]
                );
            }

            // Sanitize 'header_text' which is an array of strings
            if (Array.isArray(sanitizedComponent.example.header_text)) {
                sanitizedExample.header_text = sanitizedComponent.example.header_text.map((item: any) =>
                    sanitizeMetaPatterns(String(item))
                );
            }

            // Sanitize 'header_handle' which is an array of strings
            if (Array.isArray(sanitizedComponent.example.header_handle)) {
                sanitizedExample.header_handle = sanitizedComponent.example.header_handle.map((item: any) =>
                    sanitizeMetaPatterns(String(item))
                );
            }

            // Assign the sanitized example back to the component
            sanitizedComponent.example = sanitizedExample;
        }

        // Sanitize 'buttons' if they exist
        if (Array.isArray(sanitizedComponent.buttons)) {
            sanitizedComponent.buttons = sanitizedComponent.buttons.map((button: any) => {
                const sanitizedButton = { ...button };
                if (sanitizedButton.text && typeof sanitizedButton.text === 'string') {
                    sanitizedButton.text = sanitizeMetaPatterns(sanitizedButton.text);
                }
                // The 'example' in buttons is an array of strings
                if (Array.isArray(sanitizedButton.example)) {
                    sanitizedButton.example = sanitizedButton.example.map((item: any) =>
                        sanitizeMetaPatterns(String(item))
                    );
                }
                return sanitizedButton;
            });
        }

        return sanitizedComponent;
    });
}

function sanitizeMetaPatterns(text: string): string {
    if (typeof text !== 'string') return text;
    // Replace problematic patterns like [[...]] but keep valid template variables like {{1}}
    return text.replace(/\[\[.*?\]\]/g, '').trim();
}
