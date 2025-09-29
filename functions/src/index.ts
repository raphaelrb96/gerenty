

// src/index.ts
import * as functions from 'firebase-functions';
import { validateAndSaveCredentials } from './functions/whatsapp';
import { whatsappWebhookListener } from './functions/whatsapp';
import { sendTestMessage } from './functions/whatsapp';
import { getWhatsAppIntegrationStatus } from './functions/whatsapp';

// Exporte as funções individualmente
export {
  validateAndSaveCredentials,
  whatsappWebhookListener,
  sendTestMessage,
  getWhatsAppIntegrationStatus,
};