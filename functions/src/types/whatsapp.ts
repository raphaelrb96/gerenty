// src/types/whatsapp.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Remove a definição customizada e usa a do Firebase
export type CallableRequest<T = any> = functions.https.CallableRequest<T>;

export interface WhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
  whatsAppBusinessId: string;
  metaAppSecret: string;
}

export interface WhatsAppIntegration {
  whatsAppId: string;
  phoneNumberId: string;
  webhookUrl: string;
  status: 'connected' | 'error' | 'disconnected';
  companyId: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface WebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: {
            body: string;
          };
          image?: any;
          document?: any;
          video?: any;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export interface SendMessagePayload {
  phoneNumber: string;
  message: string;
  type?: 'text' | 'template';
  templateName?: string;
}

export interface ValidationResult {
  isValid: boolean;
  companyId?: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  messageType?: 'conversation' | 'template';
}

export interface TestMessageResponse {
  success: boolean;
  messageId?: string;
  message: string;
  messageType?: 'conversation' | 'template';
}

