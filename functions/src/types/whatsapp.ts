// functions/src/types/whatsapp.ts

// Para a função validateAndSaveCredentials
export interface WhatsAppCredentials {
  accessToken: string;
  whatsAppBusinessAccountId: string;
  phoneNumberId: string;
  metaAppSecret: string;
}

// Para a função getCompanyIntegration e saveCompanyIntegration
export interface CompanyIntegration {
  companyId: string;
  whatsAppBusinessAccountId: string;
  phoneNumberId: string;
  webhookUrl: string;
  status: 'connected' | 'disconnected' | 'error';
  lastVerifiedAt: Date;
  error?: string;
}

// Para a função de webhook
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
  type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contacts' | 'interactive' | 'unsupported';
  text?: {
    body: string;
  };
  image?: { id: string, mime_type: string, sha256: string, caption?: string };
  // Adicionar outros tipos de mídia conforme necessário
}

export interface Status {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
      id: string;
      origin: { type: string };
  };
  pricing?: {
      billable: boolean;
      pricing_model: string;
      category: string;
  };
}

// Para a função de envio de mensagens
export interface SendMessagePayload {
  messaging_product: 'whatsapp';
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

export interface MessageData {
  id: string;
  direction: 'inbound' | 'outbound';
  type: string;
  content: {
    text?: { body: string };
    // Adicionar outros tipos de conteúdo conforme necessário
  };
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}
