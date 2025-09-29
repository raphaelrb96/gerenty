// src/index.ts
import { validateAndSaveCredentials, whatsappWebhookListener, sendTestMessage, getWhatsAppIntegrationStatus, apiSyncWhatsAppTemplates } from './functions/whatsapp';
import { createTemplate, updateTemplate, deleteTemplate } from './functions/templateFunctions';

// Exporte as funções individualmente
export {
  validateAndSaveCredentials,
  whatsappWebhookListener,
  sendTestMessage,
  getWhatsAppIntegrationStatus,
  apiSyncWhatsAppTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
