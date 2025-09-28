// functions/src/functions/credentialFunctions.ts
import * as functions from 'firebase-functions';
import { ValidationService } from '../services/validationService';
import { WhatsAppService } from '../services/whatsappService';
import { SecretManagerService } from '../services/secretManager';
import { FirestoreService } from '../services/firestoreService';
import { WhatsAppCredentials } from '../types/whatsapp';

export const validateAndSaveCredentials = functions.https.onCall(async (data: any, context: any) => {
  // Autenticação (onCall já verifica o token, mas precisamos do companyId)
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'A requisição precisa ser autenticada.');
  }
  const companyId = context.auth.token.companyId;
  if (!companyId) {
    throw new functions.https.HttpsError('failed-precondition', 'Company ID não encontrado no token de autenticação.');
  }

  try {
    // Validação dos dados
    const credentials = data;
    ValidationService.validateWhatsAppCredentials(credentials);

    // Teste de conexão com a API do WhatsApp
    const isConnectionValid = await WhatsAppService.testConnection(
      credentials.accessToken,
      credentials.phoneNumberId
    );

    if (!isConnectionValid) {
      await FirestoreService.updateIntegrationStatus(companyId, 'error', 'Falha na validação da API');
      throw new functions.https.HttpsError('invalid-argument', 'Credenciais inválidas ou sem permissões necessárias');
    }

    // Salvar credenciais no Secret Manager
    await SecretManagerService.saveWhatsAppCredentials(companyId, {
      accessToken: credentials.accessToken,
      metaAppSecret: credentials.metaAppSecret,
    });

    // Gerar URL do webhook (precisa do nome da função e região)
    const region = process.env.FUNCTION_REGION || 'us-central1';
    const projectId = process.env.GCLOUD_PROJECT;
    const webhookUrl = `https://${region}-${projectId}.cloudfunctions.net/whatsappWebhook/${companyId}`;

    // Configurar webhook
    const webhookSetupSuccess = await WhatsAppService.setupWebhook(
      credentials.accessToken,
      credentials.whatsAppBusinessAccountId,
      webhookUrl
    );

    if (!webhookSetupSuccess) {
      functions.logger.warn('Webhook não pôde ser configurado automaticamente para a empresa:', companyId);
    }

    // Salvar dados não sensíveis no Firestore
    await FirestoreService.saveCompanyIntegration(companyId, {
      whatsAppBusinessAccountId: credentials.whatsAppBusinessAccountId,
      phoneNumberId: credentials.phoneNumberId,
      webhookUrl,
      status: 'connected',
      lastVerifiedAt: new Date(),
    });

    return {
      success: true,
      message: 'Credenciais validadas e salvas com sucesso',
      webhookUrl,
    };

  } catch (error: any) {
    functions.logger.error('Erro na validação de credenciais:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Erro interno do servidor');
  }
});
