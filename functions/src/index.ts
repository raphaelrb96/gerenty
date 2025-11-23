// src/index.ts
import { 
    validateAndSaveCredentials, 
    whatsappWebhookListener, 
    sendMessage, 
    getWhatsAppIntegrationStatus, 
    checkWhatsAppIntegration,
    apiSyncWhatsAppTemplates 
} from './functions/whatsapp';
import { createTemplate, updateTemplate, deleteTemplate } from './functions/templateFunctions';

// Exporte as funções individualmente para melhor organização
export {
  validateAndSaveCredentials,
  whatsappWebhookListener,
  sendMessage,
  checkWhatsAppIntegration,
  getWhatsAppIntegrationStatus,
  apiSyncWhatsAppTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};

