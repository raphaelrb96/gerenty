// src/services/integration-service.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { WhatsAppCredentials, TestMessageResponse } from '@/lib/types';

// Referências para as Cloud Functions
const validateAndSaveCredentialsCallable = httpsCallable<WhatsAppCredentials, {
  success: boolean;
  message: string;
  webhookUrl: string;
  companyId: string;
}>(functions, 'validateAndSaveCredentials');

const sendTestMessageCallable = httpsCallable<{ 
  phoneNumber: string; 
  message?: string; 
  type?: 'text' | 'template';
  templateName?: string;
}, TestMessageResponse>(functions, 'sendTestMessage');

export const integrationService = {
  async saveWhatsAppCredentials(credentials: WhatsAppCredentials) {
    try {
      const result = await validateAndSaveCredentialsCallable(credentials);
      return result.data;
    } catch (error: any) {
      console.error('Error saving WhatsApp credentials:', error);
      
      // Tratamento específico de erros do Firebase
      if (error.code === 'unauthenticated') {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      } else if (error.code === 'invalid-argument') {
        throw new Error('Dados inválidos. Verifique se todos os campos estão preenchidos corretamente.');
      } else if (error.code === 'failed-precondition') {
        throw new Error('Credenciais inválidas. Verifique se os dados estão corretos.');
      } else if (error.code === 'internal') {
        throw new Error('Erro interno do servidor. Tente novamente mais tarde.');
      } else {
        throw new Error(error.message || 'Erro ao salvar credenciais.');
      }
    }
  },

  async sendTestMessage(phoneNumber: string, message: string = 'Mensagem de teste do Gerenty') {
    try {
      const result = await sendTestMessageCallable({
        phoneNumber,
        message,
        type: 'text'
      });
      return result.data;
    } catch (error: any) {
      console.error('Error sending test message:', error);
      
      if (error.code === 'unauthenticated') {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      } else if (error.code === 'invalid-argument') {
        throw new Error('Número de telefone inválido.');
      } else if (error.code === 'internal') {
        throw new Error('Erro ao enviar mensagem de teste. Verifique se a integração está configurada corretamente.');
      } else {
        throw new Error(error.message || 'Erro ao enviar mensagem de teste.');
      }
    }
  },

  async sendTemplateMessage(phoneNumber: string, templateName: string = 'hello_world') {
    try {
      const result = await sendTestMessageCallable({
        phoneNumber,
        type: 'template',
        templateName
      });
      return result.data;
    } catch (error: any) {
      console.error('Error sending template message:', error);
      throw new Error(error.message || 'Erro ao enviar mensagem de template.');
    }
  }
};

// Aliases para compatibilidade com o código existente
export const saveWhatsAppCredentials = integrationService.saveWhatsAppCredentials;
export const sendTestMessage = integrationService.sendTestMessage;
