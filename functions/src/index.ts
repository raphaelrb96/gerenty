

// src/index.ts
import { validateAndSaveCredentials, whatsappWebhookListener, sendTestMessage, getWhatsAppIntegrationStatus, apiSyncWhatsAppTemplates } from './functions/whatsapp';

// Exporte as funções individualmente
export {
  validateAndSaveCredentials,
  whatsappWebhookListener,
  sendTestMessage,
  getWhatsAppIntegrationStatus,
  apiSyncWhatsAppTemplates
};
