// src/services/secretManager.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import * as functions from 'firebase-functions';

const client = new SecretManagerServiceClient();

export class SecretManagerService {
  private static instance: SecretManagerService;

  private constructor() {}

  static getInstance(): SecretManagerService {
    if (!SecretManagerService.instance) {
      SecretManagerService.instance = new SecretManagerService();
    }
    return SecretManagerService.instance;
  }

  async storeSecret(secretName: string, secretValue: string): Promise<void> {
    try {
      const projectId = process.env.GCLOUD_PROJECT;
      const parent = `projects/${projectId}`;
      
      // Cria o secret se não existir
      try {
        await client.createSecret({
          parent,
          secretId: secretName,
          secret: {
            replication: {
              automatic: {},
            },
          },
        });
      } catch (error: any) {
        // Secret já existe, continua
        if (error.code !== 6) { // 6 = ALREADY_EXISTS
          throw error;
        }
      }

      // Adiciona a versão do secret
      await client.addSecretVersion({
        parent: `${parent}/secrets/${secretName}`,
        payload: {
          data: Buffer.from(secretValue, 'utf8'),
        },
      });

      functions.logger.info(`Secret ${secretName} stored successfully`);
    } catch (error) {
      functions.logger.error('Error storing secret:', error);
      throw new Error('Failed to store secret');
    }
  }

  async getSecret(secretName: string): Promise<string> {
    try {
      const projectId = process.env.GCLOUD_PROJECT;
      const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

      const [version] = await client.accessSecretVersion({ name });
      
      if (!version.payload?.data) {
        throw new Error('Secret not found or empty');
      }

      return version.payload.data.toString();
    } catch (error) {
      functions.logger.error('Error retrieving secret:', error);
      throw new Error('Failed to retrieve secret');
    }
  }

  async deleteSecret(secretName: string): Promise<void> {
    try {
      const projectId = process.env.GCLOUD_PROJECT;
      const name = `projects/${projectId}/secrets/${secretName}`;

      await client.deleteSecret({ name });
      functions.logger.info(`Secret ${secretName} deleted successfully`);
    } catch (error) {
      functions.logger.error('Error deleting secret:', error);
      throw new Error('Failed to delete secret');
    }
  }

  // Métodos específicos para WhatsApp
  async storeWhatsAppToken(companyId: string, accessToken: string): Promise<void> {
    const secretName = `WHATSAPP_${companyId}_TOKEN`;
    await this.storeSecret(secretName, accessToken);
  }

  async storeWhatsAppSecret(companyId: string, appSecret: string): Promise<void> {
    const secretName = `WHATSAPP_${companyId}_SECRET`;
    await this.storeSecret(secretName, appSecret);
  }

  async getWhatsAppToken(companyId: string): Promise<string> {
    const secretName = `WHATSAPP_${companyId}_TOKEN`;
    return await this.getSecret(secretName);
  }

  async getWhatsAppSecret(companyId: string): Promise<string> {
    const secretName = `WHATSAPP_${companyId}_SECRET`;
    return await this.getSecret(secretName);
  }
}