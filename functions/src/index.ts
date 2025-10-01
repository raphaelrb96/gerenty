
// src/index.ts
import { validateAndSaveCredentials, whatsappWebhookListener, sendMessage, getWhatsAppIntegrationStatus, apiSyncWhatsAppTemplates } from './functions/whatsapp';
import { createTemplate, updateTemplate, deleteTemplate } from './functions/templateFunctions';

// Exporte as funções individualmente
export {
  validateAndSaveCredentials,
  whatsappWebhookListener,
  sendMessage,
  getWhatsAppIntegrationStatus,
  apiSyncWhatsAppTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
