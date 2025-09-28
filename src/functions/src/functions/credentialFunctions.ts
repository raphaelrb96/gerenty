
// functions/src/functions/credentialFunctions.ts
import * as functions from 'firebase-functions';
import { ValidationService } from '../services/validationService';
import { WhatsAppService } from '../services/whatsappService';
import { SecretManagerService } from '../services/secretManager';
import { FirestoreService } from '../services/firestoreService';
import { WhatsAppCredentials } from '../types/whatsapp';

export const validateAndSaveCredentials = functions.https.onRequest(async (req, res) => {
  // Handle CORS
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }
  
  let companyId;
  try {
    // 1. Authenticate the request
    const authData = await ValidationService.authenticateRequest(req.headers.authorization);
    companyId = authData.companyId;

    // 2. Extract and validate data
    const credentials = req.body.data as WhatsAppCredentials;
    ValidationService.validateWhatsAppCredentials(credentials);

    // 3. Test Connection
    const isConnectionValid = await WhatsAppService.testConnection(
      credentials.accessToken,
      credentials.phoneNumberId
    );
    if (!isConnectionValid) {
      await FirestoreService.updateIntegrationStatus(companyId, 'error', 'Falha na validação da API');
      throw new functions.https.HttpsError('invalid-argument', 'Credenciais inválidas ou sem permissões necessárias');
    }

    // 4. Save Secrets
    await SecretManagerService.saveWhatsAppCredentials(companyId, {
      accessToken: credentials.accessToken,
      metaAppSecret: credentials.metaAppSecret,
    });

    // 5. Generate Webhook URL
    const region = process.env.FUNCTION_REGION || 'us-central1';
    const projectId = process.env.GCLOUD_PROJECT;
    const webhookUrl = `https://${region}-${projectId}.cloudfunctions.net/whatsappWebhook/${companyId}`;

    // 6. Setup Webhook (Best-effort)
    const webhookSetupSuccess = await WhatsAppService.setupWebhook(
      credentials.accessToken,
      credentials.whatsAppBusinessAccountId,
      webhookUrl
    );
    if (!webhookSetupSuccess) {
      functions.logger.warn('Webhook não pôde ser configurado automaticamente para a empresa:', companyId);
    }

    // 7. Save public data to Firestore
    await FirestoreService.saveCompanyIntegration(companyId, {
      whatsAppBusinessAccountId: credentials.whatsAppBusinessAccountId,
      phoneNumberId: credentials.phoneNumberId,
      webhookUrl,
      status: 'connected',
      lastVerifiedAt: new Date(),
    });
    
    // 8. Send Success Response
    res.status(200).send({
      result: {
        success: true,
        message: 'Credenciais validadas e salvas com sucesso',
        webhookUrl,
      }
    });

  } catch (error: any) {
    functions.logger.error('Erro na validação de credenciais:', { companyId: companyId || 'N/A', error: error.message });
    if (error instanceof functions.https.HttpsError) {
        res.status(error.httpErrorCode.status).send({ error: { message: error.message, code: error.code } });
    } else {
        res.status(500).send({ error: { message: error.message || 'Erro interno do servidor' } });
    }
  }
});
