// functions/src/index.ts
//import * as functions from 'firebase-functions';
import { validateAndSaveCredentials } from './functions/credentialFunctions';
import { whatsappWebhookListener } from './functions/webhookFunctions';
import { sendWhatsAppMessage, sendTestMessage } from './functions/messageFunctions';

// Configuração multi-tenant das credenciais
export const whatsappValidateCredentials = validateAndSaveCredentials;

// Webhook para recebimento de mensagens (URL inclui companyId)
export const whatsappWebhook = whatsappWebhookListener;

// Função callable para envio de mensagens
export const sendMessage = sendWhatsAppMessage;

// Função utilitária para teste
export const whatsappSendTest = sendTestMessage;