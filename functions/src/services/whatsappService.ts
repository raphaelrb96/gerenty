// functions/src/services/whatsappService.ts
import * as functions from 'firebase-functions';
import { SendMessagePayload } from '../types/whatsapp';

export class WhatsAppService {
  static async testConnection(accessToken: string, phoneNumberId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v17.0/${phoneNumberId}?fields=verified_name`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        functions.logger.error('Erro na validação da API:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      functions.logger.error('Erro ao testar conexão com WhatsApp API:', error);
      return false;
    }
  }

  static async sendMessage(accessToken: string, phoneNumberId: string, payload: SendMessagePayload): Promise<any> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        functions.logger.error('Erro ao enviar mensagem:', data);
        throw new Error(data.error?.message || 'Falha ao enviar mensagem');
      }

      return data;
    } catch (error) {
      functions.logger.error('Erro na chamada da API do WhatsApp:', error);
      throw error;
    }
  }

  static async setupWebhook(accessToken: string, whatsAppBusinessAccountId: string, webhookUrl: string): Promise<boolean> {
    try {
      // Configurar webhook para a conta business
      const response = await fetch(
        `https://graph.facebook.com/v17.0/${whatsAppBusinessAccountId}/subscribed_apps`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      functions.logger.error('Erro ao configurar webhook:', error);
      return false;
    }
  }
}