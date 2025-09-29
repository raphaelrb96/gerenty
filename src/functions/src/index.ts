// src/index.ts
import { validateAndSaveCredentials, whatsappWebhookListener, sendTestMessage, getWhatsAppIntegrationStatus } from './functions/whatsapp';

// Renomeia as exportações para clareza e para evitar conflitos, prefixando com 'api'.
export const apiValidateAndSaveCredentials = validateAndSaveCredentials;
export const apiWhatsappWebhookListener = whatsappWebhookListener;
export const apiSendTestMessage = sendTestMessage;
export const apiGetWhatsAppIntegrationStatus = getWhatsAppIntegrationStatus;
