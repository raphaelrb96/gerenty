
// functions/src/index.ts
import { validateAndSaveCredentials } from './functions/credentialFunctions';
import { whatsappWebhookListener } from './functions/webhookFunctions';
import { sendWhatsAppMessage, sendTestMessage } from './functions/messageFunctions';

// Callable function para validação e salvamento de credenciais
export const whatsappValidateCredentials = validateAndSaveCredentials;

// Webhook para recebimento de mensagens
export const whatsappWebhook = whatsappWebhookListener;

// Callable function para envio de mensagens
export const sendMessage = sendWhatsAppMessage;

// Callable function para teste de envio
export const whatsappSendTest = sendTestMessage;
