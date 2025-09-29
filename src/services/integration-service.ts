// src/services/integration-service.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { WhatsAppCredentials, TestMessageResponse } from '@/lib/types';

// Referências para as Cloud Functions
const validateAndSaveCredentialsCallable = httpsCallable<WhatsAppCredentials & { companyId: string }, {
  success: boolean;
  message: string;
  webhookUrl: string;
  companyId: string;
}>(functions, 'validateAndSaveCredentials');

const sendTestMessageCallable = httpsCallable<{ 
  companyId: string;
  phoneNumber: string; 
  message?: string; 
  type?: 'text' | 'template';
  templateName?: string;
}, TestMessageResponse>(functions, 'sendTestMessage');

const checkWhatsAppIntegrationCallable = httpsCallable<{ 
  companyId: string;
}, {
  exists: boolean;
  status?: string;
  webhookUrl?: string;
}>(functions, 'checkWhatsAppIntegration');

export const integrationService = {
  async saveWhatsAppCredentials(companyId: string, credentials: WhatsAppCredentials) {
    try {
      const result = await validateAndSaveCredentialsCallable({ ...credentials, companyId });
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

  async sendTestMessage(companyId: string, phoneNumber: string, message: string = 'hello_world') {
    try {
      const result = await sendTestMessageCallable({
        companyId,
        phoneNumber,
        type: 'template',
        templateName: message,
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

  async checkWhatsAppIntegration(companyId: string) {
    try {
      const result = await checkWhatsAppIntegrationCallable({ companyId });
      return result.data;
    } catch (error: any) {
      console.error('Error checking WhatsApp integration:', error);
      throw new Error(error.message || 'Erro ao verificar integração');
    }
  }
};

// Aliases para compatibilidade com o código existente
export const saveWhatsAppCredentials = integrationService.saveWhatsAppCredentials;
export const sendTestMessage = integrationService.sendTestMessage;
export const checkWhatsAppIntegration = integrationService.checkWhatsAppIntegration;
