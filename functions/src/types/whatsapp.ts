
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
          type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'interactive' | 'sticker' | 'unknown';
          text?: {
            body: string;
          };
          image?: {
            caption?: string;
            id: string;
            mime_type: string;
            url?: string;
          };
          video?: {
            caption?: string;
            id: string;
            mime_type: string;
            url?: string;
          };
          audio?: {
            id: string;
            mime_type: string;
            url?: string;
          };
          document?: {
            caption?: string;
            filename: string;
            id: string;
            mime_type: string;
            url?: string;
          };
          location?: {
            latitude: number;
            longitude: number;
            name?: string;
            address?: string;
          };
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

export interface TestMessageResponse {
  success: boolean;
  messageId?: string;
  message: string;
  messageType?: 'conversation' | 'template';
}

// src/types/whatsapp.ts - Corrija e complete as interfaces
export interface TemplateErrorInfo {
  needsTemplateSetup: boolean;
  errorCode?: number;
  errorMessage?: string;
  wabaId?: string;
  phoneNumberId?: string;
  templateName?: string;
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  messageType?: 'conversation' | 'template';
  templateError?: TemplateErrorInfo;
}

export interface TestMessageResponse {
  success: boolean;
  messageId?: string;
  message: string;
  messageType?: 'conversation' | 'template';
  templateError?: TemplateErrorInfo;
}

export interface SendMessagePayload {
  phoneNumber: string;
  message: string;
  type?: 'text' | 'template';
  templateName?: string;
}

// Adicione também o tipo para a resposta da API do WhatsApp
export interface WhatsAppApiError {
  code: number;
  message: string;
  error_data?: {
    details?: string;
  };
}

export interface WhatsAppApiResponse {
  messages?: Array<{ id: string }>;
  error?: WhatsAppApiError;
}


export interface MessageTemplate {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  status: 'approved' | 'pending' | 'rejected' | 'disabled';
  components?: MessageTemplateComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface MetaTemplate {
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED';
  components: MessageTemplateComponent[];
}

export interface MessageTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  text?: string;
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  example?: {
      body_text?: string[][];
      header_text?: string[];
      header_handle?: string[];
  };
  buttons?: Array<{
      type: 'QUICK_REPLY' | 'URL';
      text: string;
      url?: string;
      example?: string[];
  }>;
}

    
