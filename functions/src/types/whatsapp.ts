// functions/src/types/whatsapp.ts
export interface WhatsAppCredentials {
    accessToken: string;
    whatsAppBusinessAccountId: string;
    phoneNumberId: string;
    metaAppSecret: string;
  }
  
  export interface WebhookPayload {
    object: string;
    entry: WebhookEntry[];
  }
  
  export interface WebhookEntry {
    id: string;
    changes: WebhookChange[];
  }
  
  export interface WebhookChange {
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Contact[];
      messages?: Message[];
      statuses?: Status[];
    };
    field: string;
  }
  
  export interface Contact {
    profile: {
      name: string;
    };
    wa_id: string;
  }
  
  export interface Message {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: {
      body: string;
    };
    image?: {
      caption?: string;
      mime_type: string;
      sha256: string;
      id: string;
    };
    context?: {
      from: string;
      id: string;
    };
  }
  
  export interface Status {
    id: string;
    status: 'sent' | 'delivered' | 'read';
    timestamp: string;
    recipient_id: string;
  }
  
  export interface SendMessagePayload {
    messaging_product: string;
    to: string;
    type: 'text' | 'template';
    text?: {
      body: string;
    };
    template?: {
      name: string;
      language: {
        code: string;
      };
      components?: any[];
    };
  }
  
  export interface CompanyIntegration {
    whatsAppBusinessAccountId: string;
    phoneNumberId: string;
    webhookUrl: string;
    status: 'connected' | 'disconnected' | 'error';
    lastVerifiedAt: Date;
    companyId: string;
  }