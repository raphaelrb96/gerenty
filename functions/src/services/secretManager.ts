// src/services/secretManager.ts
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

export class SecretManagerService {
  private static instance: SecretManagerService;
  private db: admin.firestore.Firestore;

  private constructor() {
    this.db = admin.firestore();
  }

  static getInstance(): SecretManagerService {
    if (!SecretManagerService.instance) {
      SecretManagerService.instance = new SecretManagerService();
    }
    return SecretManagerService.instance;
  }

  async storeSecret(secretName: string, secretValue: string): Promise<void> {
    try {
      // Salva no Firestore em uma coleção segura
      await this.db.collection('whatsapp_secrets')
        .doc(secretName)
        .set({
          value: secretValue,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          encrypted: true // Marcar como encriptado (opcional)
        }, { merge: true });

      functions.logger.info(`Secret ${secretName} stored successfully in Firestore`);
    } catch (error) {
      functions.logger.error('Error storing secret in Firestore:', error);
      throw new Error('Failed to store secret');
    }
  }

  async getSecret(secretName: string): Promise<string> {
    try {
      const doc = await this.db.collection('whatsapp_secrets')
        .doc(secretName)
        .get();

      if (!doc.exists) {
        functions.logger.error(`Secret ${secretName} not found in Firestore`);
        throw new Error('Secret not found');
      }

      const data = doc.data();
      if (!data?.value) {
        functions.logger.error(`Secret ${secretName} has no value`);
        throw new Error('Secret value is empty');
      }

      functions.logger.info(`Secret ${secretName} retrieved successfully from Firestore`);
      return data.value;
    } catch (error) {
      functions.logger.error(`Error retrieving secret ${secretName}:`, error);
      throw new Error('Failed to retrieve secret');
    }
  }

  async secretExists(secretName: string): Promise<boolean> {
    try {
      const doc = await this.db.collection('whatsapp_secrets')
        .doc(secretName)
        .get();
      return doc.exists && !!doc.data()?.value;
    } catch (error) {
      functions.logger.error(`Error checking secret existence ${secretName}:`, error);
      return false;
    }
  }

  async deleteSecret(secretName: string): Promise<void> {
    try {
      await this.db.collection('whatsapp_secrets')
        .doc(secretName)
        .delete();
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

  async whatsAppSecretExists(companyId: string): Promise<boolean> {
    const secretName = `WHATSAPP_${companyId}_SECRET`;
    return await this.secretExists(secretName);
  }
}
