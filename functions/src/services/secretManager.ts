// functions/src/services/secretManager.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as functions from 'firebase-functions';

const client = new SecretManagerServiceClient();

export class SecretManagerService {
  private static async getSecretName(companyId: string, secretType: 'token' | 'secret'): Promise<string> {
    return `projects/${process.env.GCLOUD_PROJECT}/secrets/WHATSAPP_${companyId}_${secretType.toUpperCase()}/versions/latest`;
  }

  static async saveWhatsAppCredentials(companyId: string, credentials: { accessToken: string; metaAppSecret: string }): Promise<void> {
    try {
      // Salvar Access Token
      const tokenSecretName = await this.getSecretName(companyId, 'token');
      await client.addSecretVersion({
        parent: `projects/${process.env.GCLOUD_PROJECT}/secrets/WHATSAPP_${companyId}_TOKEN`,
        payload: {
          data: Buffer.from(credentials.accessToken, 'utf8'),
        },
      });

      // Salvar App Secret
      const secretSecretName = await this.getSecretName(companyId, 'secret');
      await client.addSecretVersion({
        parent: `projects/${process.env.GCLOUD_PROJECT}/secrets/WHATSAPP_${companyId}_SECRET`,
        payload: {
          data: Buffer.from(credentials.metaAppSecret, 'utf8'),
        },
      });

      functions.logger.info(`Credenciais salvas para empresa: ${companyId}`);
    } catch (error) {
      functions.logger.error('Erro ao salvar credenciais:', error);
      throw new Error('Falha ao salvar credenciais no Secret Manager');
    }
  }

  static async getWhatsAppAccessToken(companyId: string): Promise<string> {
    try {
      const secretName = await this.getSecretName(companyId, 'token');
      const [version] = await client.accessSecretVersion({
        name: secretName,
      });
      
      return version.payload?.data?.toString() || '';
    } catch (error) {
      functions.logger.error(`Erro ao obter access token para empresa ${companyId}:`, error);
      throw new Error('Credenciais não encontradas para esta empresa');
    }
  }

  static async getWhatsAppAppSecret(companyId: string): Promise<string> {
    try {
      const secretName = await this.getSecretName(companyId, 'secret');
      const [version] = await client.accessSecretVersion({
        name: secretName,
      });
      
      return version.payload?.data?.toString() || '';
    } catch (error) {
      functions.logger.error(`Erro ao obter app secret para empresa ${companyId}:`, error);
      throw new Error('App Secret não encontrado para esta empresa');
    }
  }

  static async deleteWhatsAppCredentials(companyId: string): Promise<void> {
    try {
      const tokenSecretName = `projects/${process.env.GCLOUD_PROJECT}/secrets/WHATSAPP_${companyId}_TOKEN`;
      const secretSecretName = `projects/${process.env.GCLOUD_PROJECT}/secrets/WHATSAPP_${companyId}_SECRET`;

      await client.deleteSecret({ name: tokenSecretName });
      await client.deleteSecret({ name: secretSecretName });

      functions.logger.info(`Credenciais deletadas para empresa: ${companyId}`);
    } catch (error) {
      functions.logger.error('Erro ao deletar credenciais:', error);
      throw new Error('Falha ao deletar credenciais');
    }
  }
}