// functions/src/functions/credentialFunctions.ts
import * as functions from 'firebase-functions';
import { ValidationService } from '../services/validationService';
import { WhatsAppService } from '../services/whatsappService';
import { SecretManagerService } from '../services/secretManager';
import { FirestoreService } from '../services/firestoreService';
import { WhatsAppCredentials } from '../types/whatsapp';

export const validateAndSaveCredentials = functions.https.onRequest(async (req, res) => {
  // CORS
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
    const { companyId } = await ValidationService.authenticateRequest(req.headers.authorization);
    
    const credentials = req.body;
    ValidationService.validateWhatsAppCredentials(credentials);

    const isConnectionValid = await WhatsAppService.testConnection(
      credentials.accessToken,
      credentials.phoneNumberId
    );

    if (!isConnectionValid) {
      await FirestoreService.updateIntegrationStatus(companyId, 'error', 'Falha na validação da API');
      res.status(400).json({ error: 'Credenciais inválidas ou sem permissões necessárias' });
      return;
    }
    
    await SecretManagerService.saveWhatsAppCredentials(companyId, {
      accessToken: credentials.accessToken,
      metaAppSecret: credentials.metaAppSecret,
    });
    
    const region = process.env.FUNCTION_REGION || 'us-central1';
    const projectId = process.env.GCLOUD_PROJECT;
    const webhookUrl = `https://${region}-${projectId}.cloudfunctions.net/whatsappWebhook/${companyId}`;
    
    const webhookSetupSuccess = await WhatsAppService.setupWebhook(
      credentials.accessToken,
      credentials.whatsAppBusinessAccountId,
      webhookUrl
    );

    if (!webhookSetupSuccess) {
      functions.logger.warn('Webhook não pôde ser configurado automaticamente para a empresa:', companyId);
    }
    
    await FirestoreService.saveCompanyIntegration(companyId, {
      whatsAppBusinessAccountId: credentials.whatsAppBusinessAccountId,
      phoneNumberId: credentials.phoneNumberId,
      webhookUrl,
      status: 'connected',
      lastVerifiedAt: new Date(),
    });
    
    res.status(200).json({
      success: true,
      message: 'Credenciais validadas e salvas com sucesso',
      webhookUrl,
    });

  } catch (error: any) {
    functions.logger.error('Erro na validação de credenciais:', error);
    if (error.message.includes("Token de autenticação")) {
        res.status(401).json({ error: error.message });
    } else {
        res.status(500).json({ error: error.message || 'Erro interno do servidor' });
    }
  }
});
