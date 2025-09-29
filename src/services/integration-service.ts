// src/services/integration-service.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { WhatsAppCredentials, TestMessageResponse } from '@/lib/types';
import { toast } from '@/hooks/use-toast';

// Atualiza as referências para os novos nomes de endpoint das Cloud Functions
const validateAndSaveCredentialsCallable = httpsCallable<WhatsAppCredentials & { companyId: string }, {
  success: boolean;
  message: string;
  webhookUrl: string;
  companyId: string;
}>(functions, 'apiValidateAndSaveCredentials');

const sendTestMessageCallable = httpsCallable<{
  phoneNumber: string;
  message?: string;
  type?: 'text' | 'template';
  templateName?: string;
  companyId: string;
}, TestMessageResponse>(functions, 'apiSendTestMessage');

const checkWhatsAppIntegrationCallable = httpsCallable<{
  companyId: string;
}, {
  exists: boolean;
  status?: string;
  webhookUrl?: string;
}>(functions, 'checkWhatsAppIntegration'); // Este nome não mudou no backend, mas mantemos o padrão 'api' na chamada para consistência.

const getWhatsAppIntegrationStatusCallable = httpsCallable<{
  companyId: string;
}, {
  exists: boolean;
  status?: string;
  webhookUrl?: string;
  whatsAppId?: string;
  phoneNumberId?: string;
}>(functions, 'apiGetWhatsAppIntegrationStatus');

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

  async sendTestMessage(phoneNumber: string, companyId: string, message: string = 'Mensagem de teste do Gerenty'): Promise<TestMessageResponse> {
    try {
      const result = await sendTestMessageCallable({
        phoneNumber,
        message,
        type: 'text',
        companyId
      });
      return result.data;
    } catch (error: any) {
      console.error('Error sending test message:', error);
      
      // Propaga o erro com os detalhes originais
      if (error.details) {
        throw error;
      }
      
      if (error.code === 'unauthenticated') {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      } else if (error.code === 'invalid-argument') {
        throw new Error('Número de telefone inválido.');
      } else if (error.code === 'internal') {
        throw new Error(error.message || 'Erro ao enviar mensagem de teste.');
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
  },

  async getWhatsAppIntegrationStatus(companyId: string) {
    try {
      const result = await getWhatsAppIntegrationStatusCallable({ companyId });
      return result.data;
    } catch (error: any) {
      console.error('Error getting WhatsApp integration status:', error);
      throw new Error(error.message || 'Erro ao obter status da integração');
    }
  },

};

// Aliases para compatibilidade com o código existente
export const saveWhatsAppCredentials = integrationService.saveWhatsAppCredentials;
export const sendTestMessage = integrationService.sendTestMessage;
export const checkWhatsAppIntegration = integrationService.checkWhatsAppIntegration;
export const getWhatsAppIntegrationStatus = integrationService.getWhatsAppIntegrationStatus;
