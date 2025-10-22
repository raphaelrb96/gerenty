// src/types/whatsapp.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import type { Node as FlowNode, Edge as FlowEdge } from 'reactflow';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';


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
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export type WebhookChangeValue = {
  messaging_product: string;
  metadata: MessageMetadata;
  contacts?: MessageContact[];
  messages?: IncomingMessage[];
  statuses?: MessageStatus[];
  errors?: any[];
  message_template_status_update?: TemplateStatusUpdate;
};

export type WebhookChange = {
  value: WebhookChangeValue;
  field: 'messages';
};

export type WebhookEntry = {
  id: string; // WhatsApp Business Account ID
  changes: WebhookChange[];
};

export type WebhookPayload = {
  object: 'whatsapp_business_account';
  entry: WebhookEntry[];
};


export interface MessageMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

export interface MessageContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'interactive' | 'sticker' | 'unknown' | 'reaction' | 'button' | 'product';

export interface IncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: MessageType;
  text?: { body: string; };
  image?: { caption?: string; id: string; mime_type: string; url?: string; };
  video?: { caption?: string; id: string; mime_type: string; url?: string; };
  audio?: { id: string; mime_type: string; url?: string; };
  document?: { caption?: string; filename: string; id: string; mime_type: string; url?: string; };
  location?: { latitude: number; longitude: number; name?: string; address?: string; };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply: { id: string; title: string };
    list_reply: { id: string; title: string; description: string };
  };
}

export type MessageStatus = {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'warning';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    origin: { type: 'user_initiated' | 'business_initiated' };
  };
  pricing?: {
    billable: boolean;
    pricing_model: 'CBP';
    category: 'user_initiated' | 'business_initiated';
  };
};


export interface TemplateStatusUpdate {
  message_template_id: string;
  message_template_name: string;
  message_template_language: string;
  event: 'APPROVED' | 'REJECTED' | 'PENDING' | 'DISABLED';
  reason?: string;
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
    type: LibraryMessage['type'] | 'template';
    content?: LibraryMessage['content'];
    // For legacy text messages or simple template calls
    message?: string; 
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

export type Stage = {
  id: string;
  ownerId: string;
  name: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Flow = {
  id: string;
  name: string;
  companyId: string;
  status: 'draft' | 'published';
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export type Conversation = {
  id: string;
  consumerId: string;
  status: 'open' | 'pending' | 'closed';
  unreadMessagesCount: number;
  lastMessage: string;
  lastMessageTimestamp: admin.firestore.Timestamp;
  activeFlowId?: string | null;
  currentStepId?: string | null;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
};
    
export type LibraryMessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'interactive' | 'product';

export type TextMessage = { body: string; preview_url?: boolean };
export type MediaMessage = { id: string; mime_type: string; url?: string; caption?: string; filename?: string };
export type LocationMessage = { latitude: number; longitude: number; name?: string; address?: string; };
export type ContactMessage = { contacts: Array<{ name: { first_name: string }; phones: Array<{ phone: string; type: string }> }> };
export type ProductMessage = { body?: string; catalog_id?: string; section_id?: string; product_retailer_id: string };
export type InteractiveMessage = {
  type: 'button' | 'list' | 'product' | 'product_list';
  header?: { type: 'text' | 'video' | 'image' | 'document'; text?: string, media_id?: string };
  body: { text: string };
  footer?: { text: string };
  action: {
    buttons?: Array<{ type: 'reply'; reply: { id: string; title: string; } }>;
    catalog_id?: string;
    sections?: Array<{
      title?: string;
      product_items?: Array<{ product_retailer_id: string }>;
      rows?: Array<{ id: string, title: string, description?: string }>;
    }>;
    button?: string;
  };
  button_reply?: {
      id: string;
      title: string;
  };
   list_reply?: {
      id: string;
      title: string;
      description: string;
  };
};

export type TemplateMessage = { name: string; language: string; components: Array<{ type: 'body' | 'header'; parameters: Array<{ type: string; text?: string }> }> };
export type ReactionMessage = { message_id: string; emoji: string };
export type SystemMessage = { body: string; wa_id: string };


export type LibraryMessage = {
  id: string;
  ownerId: string;
  companyId: string;
  name: string;
  type: LibraryMessageType;
  content: {
    text?: TextMessage;
    media?: MediaMessage;
    location?: LocationMessage;
    contact?: ContactMessage;
    product_message?: ProductMessage;
    interactive?: InteractiveMessage;
    template?: TemplateMessage;
    reaction?: ReactionMessage;
    system?: SystemMessage;
  };
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
};

export type Product = {
  // Identificador único do produto (por exemplo, SKU, ID interno)
  id: string;
  
  // ID do usuário dono do produto
  ownerId: string;

  // IDs das empresas às quais o produto pertence (opcional)
  companyIds?: string[];

  // Nome do produto, ex: "Camiseta Preta Básica"
  name: string;

  // Slug do produto usado na URL (ex: "camiseta-preta-basica")
  slug: string;

  // Descrição detalhada do produto
  description: string;

  // Código único de estoque (SKU)
  sku?: string;

  // Status se o produto está ativo ou não
  isActive: boolean;
  
  // Preço de custo do produto
  costPrice?: number;
  
  extraCosts?: number;
  
  // Preço do produto em diferentes faixas (ex: Varejo, Atacado)
  pricing: any[];

  // Quantidade disponível em estoque
  // Pode ser um número ou um booleano indicando se devera ser gerenciado automaticamente o estoque
  availableStock?: number | boolean;

  // Atributos personalizados do produto (ex: Cor, Tamanho)
  attributes?: any[];

  // Categorias globais do produto (ex: "Roupas", "Acessórios")
  categoryIds?: string[]; // Categorias globais do produto

  // Coleções privadas associadas ao produto (ex: "Coleção Verão 2023")
  collectionIds?: string[];

  // Tags que ajudam a categorizar ou filtrar o produto (ex: "camisa", "promoção")
  tags?: string[];

  // Imagens do produto (imagem principal e galeria de imagens)
  images?: {
    mainImage: string; // URL da imagem principal do produto
    gallery: string[]; // Galeria de imagens do produto
  };

  // Referência ao template do produto (se aplicável)
  templateId?: string;

  // Datas de publicação e atualização do produto
  publishedAt?: string | Date | Timestamp | FieldValue;
  updatedAt: string | Date | Timestamp | FieldValue;
  createdAt: string | Date | Timestamp | FieldValue;

  // Status do produto (disponível, fora de estoque ou descontinuado)
  status: 'available' | 'out-of-stock' | 'discontinued';

  // Visibilidade do produto (público ou privado)
  visibility: 'public' | 'private';

  // Promoção associada ao produto (desconto, data de início e fim)
  promotion?: {
    startDate: Date; // Data de início da promoção
    endDate: Date; // Data de término da promoção
    discountPercentage: number; // Porcentagem de desconto
  };

  // Flag que indica se o produto foi verificado (por exemplo, por admins)
  isVerified: boolean;

  // Permissões relacionadas ao produto (quem pode editar ou excluir)
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
    allowedRoles: ('admin' | 'empresa' | 'user')[]; // Papéis que têm permissão sobre o produto
  };

  // Informações adicionais sobre o produto, como peso, dimensões, fabricante
  additionalInfo?: {
    weight?: string; // Peso do produto
    dimensions?: string; // Dimensões do produto
    manufacturer?: string; // Fabricante do produto
    warranty?: string; // Garantia do produto
    shippingInfo?: string; // Informações sobre envio (tempo, preço, etc.)
  };

  // Avaliações do produto
  reviews?: {
    averageRating: number; // Média de avaliações (0 a 5)
    totalReviews: number; // Quantidade total de avaliações
    ratings: number[]; // Array de avaliações (ex: [5, 4, 3, 2, 1])
  };

  // Histórico de versões do produto
  versionHistory?: {
    version: string; // Número da versão do produto
    updatedAt: Date; // Data da última atualização
    changes: string[]; // Descrição das mudanças realizadas
  };

  // Customizações do template para exibição do produto
  templateCustomization?: {
    layoutSettings: {
      displayType: 'card' | 'grid' | 'list'; // Tipo de layout de exibição
      cardSize: 'small' | 'medium' | 'large'; // Tamanho do cartão do produto
      showPrice: boolean; // Se o preço será exibido
    };
  };

  // Estratégias de vendas relacionadas ao produto
  salesStrategies?: {
    crossSell?: string[]; // Produtos recomendados para vender juntos
    upsell?: string[]; // Produtos para venda adicional
    bundles?: string[]; // Produtos vendidos em pacote
  };
};
  
