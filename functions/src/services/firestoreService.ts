// functions/src/services/firestoreService.ts
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { CompanyIntegration } from '../types/whatsapp';

admin.initializeApp();

export class FirestoreService {
  private static db = admin.firestore();

  static async saveCompanyIntegration(companyId: string, integrationData: Partial<CompanyIntegration>): Promise<void> {
    try {
      const integrationRef = this.db.collection('companies').doc(companyId).collection('integrations').doc('whatsapp');
      
      await integrationRef.set({
        ...integrationData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      functions.logger.info(`Integração salva para empresa: ${companyId}`);
    } catch (error) {
      functions.logger.error('Erro ao salvar integração:', error);
      throw new Error('Falha ao salvar dados de integração');
    }
  }

  static async getCompanyIntegration(companyId: string): Promise<CompanyIntegration | null> {
    try {
      const integrationRef = this.db.collection('companies').doc(companyId).collection('integrations').doc('whatsapp');
      const doc = await integrationRef.get();
      
      return doc.exists ? { companyId, ...doc.data() } as CompanyIntegration : null;
    } catch (error) {
      functions.logger.error('Erro ao obter integração:', error);
      throw new Error('Falha ao obter dados de integração');
    }
  }

  static async updateIntegrationStatus(companyId: string, status: CompanyIntegration['status'], error?: string): Promise<void> {
    try {
      const integrationRef = this.db.collection('companies').doc(companyId).collection('integrations').doc('whatsapp');
      
      await integrationRef.set({
        status,
        error: error || null,
        lastVerifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      functions.logger.error('Erro ao atualizar status:', error);
      throw new Error('Falha ao atualizar status da integração');
    }
  }

  static async findCompanyByWhatsAppId(whatsAppBusinessAccountId: string): Promise<string | null> {
    try {
      const integrationsRef = this.db.collectionGroup('integrations');
      const snapshot = await integrationsRef
        .where('whatsAppBusinessAccountId', '==', whatsAppBusinessAccountId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      // Extrair companyId do path do documento
      const pathParts = doc.ref.path.split('/');
      return pathParts[1]; // companies/{companyId}
    } catch (error) {
      functions.logger.error('Erro ao buscar empresa por WhatsApp ID:', error);
      throw new Error('Falha ao identificar empresa');
    }
  }

  static async saveMessage(companyId: string, conversationId: string, messageData: any): Promise<void> {
    try {
      const messageRef = this.db
        .collection('companies')
        .doc(companyId)
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .doc(messageData.id);

      await messageRef.set({
        ...messageData,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Atualizar última mensagem da conversa
      const conversationRef = this.db
        .collection('companies')
        .doc(companyId)
        .collection('conversations')
        .doc(conversationId);

      await conversationRef.set({
        lastMessage: messageData.content?.text || 'Mídia',
        lastMessageTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        unreadMessagesCount: messageData.direction === 'inbound' ? 
          admin.firestore.FieldValue.increment(1) : 0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

    } catch (error) {
      functions.logger.error('Erro ao salvar mensagem:', error);
      throw new Error('Falha ao salvar mensagem');
    }
  }
}