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

// HTTP function para teste de envio (pode ser convertida para callable também se preferir)
export const whatsappSendTest = sendTestMessage;
