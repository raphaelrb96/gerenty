

import type { FieldValue, Timestamp } from "firebase/firestore";
import type { Node, Edge } from "reactflow";

export type User = {
  //dados pessoais
  uid: string;
  email: string;
  name: string;
  profileImage?: string;
  phoneNumber?: string;
  authProvider: 'email' | 'google' | 'facebook';
  //endereço privado
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  //regras de autenticação
  role: 'admin' | 'empresa';
  //plano de assinatura
  plan: Plan | null;
  statusPlan: 'ativo' | 'inativo' | 'pendente';
  validityDate?:  string | Date | Timestamp | FieldValue;
  assignedDate?:  string | Date | Timestamp | FieldValue;
  //datas e horarios
  createdAt:  string | Date | Timestamp | FieldValue;
  lastLogin?:  string | Date | Timestamp | FieldValue;
  updatedAt?:  string | Date | Timestamp | FieldValue;

  onboardingCompleted?: boolean;

};

// Tipo do Produto
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
  pricing: ProductPriceTier[];

  // Quantidade disponível em estoque
  // Pode ser um número ou um booleano indicando se devera ser gerenciado automaticamente o estoque
  availableStock?: number | boolean;

  // Atributos personalizados do produto (ex: Cor, Tamanho)
  attributes?: ProductAttribute[];

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

/**
 * Define uma faixa de preço com regras condicionais.
 */
export type ProductPriceTier = {
  label: string; // Ex: "Varejo", "Atacado"
  price: number; // Preço a ser aplicado
  rule?: {
    type: 'none' | 'minQuantity' | 'minCartValue' | 'paymentMethod' | 'purchaseType';
    value?: any; // Pode ser número (para quantidade/valor) ou string (para método)
  };
  commission?: {
    type: 'fixed' | 'percentage';
    value: number;
  };
};

// variantes
export type ProductAttribute = {
  name: string; // Nome do atributo visível ao usuário, ex: "Cor", "Tamanho", "Peso"
  options: string[]; // Lista de opções possíveis
  imageUrls?: { option: string; imageUrl: string }[]; // Array de objetos, onde cada objeto tem a opção e a URL da imagem correspondente
};

// Tipo auxiliar para categorizar produtos com estrutura de ID e nome
export type ProductCategory = {
  id: string;     // ID único da categoria
  ownerId: string; // ID do usuário dono da categoria
  name: string;   // Nome visível da categoria (ex: "Roupas", "Calçados")
  slug: string;   // Slug gerado para URL (ex: "roupas-masculinas", "calçados-femininos")
  emoji?: string;  // Emoji ou ícone representativo da categoria
};


export type Plan = {
  // Informações básicas
  id?: string;
  name: string;
  description?: string;
  type: 'free' | 'simples' | 'profissional' | 'premium' | 'personalizado';
  // Preço e cobrança
  price: number;
  currency?: 'BRL' | 'USD' | 'EUR';
  billingCycle?: 'monthly' | 'yearly';
  // Recursos oferecidos
  features?: string[];
  // Limites do plano
  limits?: {
    catalogs?: number;
    products?: number;
    users?: number;
    companies?: number; // Limite de empresas
    storageMB?: number;
    ordersPerMonth?: number;
    customDomains?: boolean;
    supportLevel?: 'nenhum' | 'email' | 'prioritário' | 'dedicado';
  };
  // Flags e controle
  isActive?: boolean;
  isCustom?: boolean;
  highlight?: boolean;
  // Metadados
  createdAt?: string | Date | Timestamp | FieldValue;
  updatedAt?: string | Date | Timestamp | FieldValue;
};

/**
 * Representa um pedido realizado na plataforma Vitriny
 */
export type Order = {
  id: string; // ID único do pedido

  companyId: string; // Empresa responsável por este pedido
  catalogId?: string; // Catálogo relacionado, se aplicável
  employeeId?: string; // ID do funcionário (vendedor) que realizou a venda
  
  type?: 'sale' | 'exchange' | 'return'; // Tipo do pedido

  customer: OrderCustomer; // Dados do cliente no momento do pedido
  items: OrderItem[]; // Lista de itens comprados

  status: OrderStatus; // Status atual do pedido
  payment: PaymentDetails; // Informações de pagamento

  shipping?: ShippingDetails; // Informações de entrega (caso não seja digital)

  subtotal: number; // Soma dos preços dos produtos (sem descontos ou frete)
  discount?: number; // Valor de desconto aplicado
  shippingCost?: number; // Custo do frete
  taxas?: number;
  total: number; // Valor total final do pedido

  commission?: number; // Valor total da comissão para o vendedor
  
  notes?: string; // Notas internas ou observações do comprador

  createdAt: string | Date | Timestamp | FieldValue; // Data de criação do pedido
  updatedAt: string | Date | Timestamp | FieldValue; // Última atualização do pedido
  completedAt?: string | Date | Timestamp | FieldValue; // Data de conclusão (entrega ou finalização)
  cancelledAt?: string | Date | Timestamp | FieldValue; // Data de cancelamento (se houver)
};


/**
 * Representa um item individual dentro de um pedido
 */
export type OrderItem = {
  productId: string; // ID do produto original no catálogo
  productName: string; // Nome do produto capturado no momento do pedido
  productSlug?: string; // Slug do produto (para referência de URL)

  quantity: number; // Quantidade comprada
  unitPrice: number; // Preço unitário no momento da compra
  totalPrice: number; // Preço total (unitPrice * quantity)
  costPrice?: number; // Preço de custo do produto
  
  commission?: { // Comissão específica para este item no momento da venda
      type: 'fixed' | 'percentage';
      value: number;
  };

  variant?: {
    name: string; // Nome da variação (ex: "Cor", "Tamanho")
    value: string; // Valor escolhido (ex: "Azul", "M")
    imageUrl?: string; // Imagem específica da variação (ex: camisa azul)
  };

  imageUrl?: string; // Imagem principal do produto no momento da compra

  isDigital: boolean; // Define se o produto é digital (não requer entrega)
  downloadLink?: string; // Link de download se for produto digital

  externalLink?: string; // Link externo (caso o produto só redirecione para outro site)
  notes?: string; // Observações específicas do item

};



// Status padrão de um pedido
export type OrderStatus =
  | 'pending'           // Aguardando ações iniciais, como pagamento.
  | 'confirmed'         // Pagamento recebido, pedido confirmado.
  | 'processing'        // Em preparação/separação para envio.
  | 'out_for_delivery'  // Em rota de entrega.
  | 'delivered'         // Entregue ao cliente.
  | 'completed'         // Pedido finalizado (pós-entrega, sem pendências).
  | 'cancelled'         // Pedido cancelado.
  | 'refunded'          // Pedido reembolsado.
  | 'returned'          // Pedido devolvido pelo cliente.
  | 'exchange'          // Pedido de troca.
  | 'return';           // Pedido de devolução.


// Meios de pagamento disponíveis
export type PaymentMethod =
  | 'credito'
  | 'debito'
  | 'pix'
  | 'dinheiro'
  | 'boleto'
  | 'link'
  | 'outros';


// Detalhes sobre o pagamento do pedido
export type PaymentDetails = {
  method: PaymentMethod; // Método selecionado
  type: 'presencial' | 'online';
  status: 'aguardando' | 'aprovado' | 'recusado' | 'estornado' | 'parcial';
  transactionId?: string; // ID da transação no gateway
  paidAt?: Date; // Data de pagamento (se aprovado)
  installments?: number; // Número de parcelas (se aplicável)
  amountPaid?: number; // Valor efetivamente pago
  notes?: string; // Observações sobre o pagamento
};


// Métodos de entrega disponíveis
export type DeliveryMethod =
  | 'retirada_loja'
  | 'entrega_padrao'
  | 'correios'
  | 'logistica_propria'
  | 'digital';


// Detalhes da entrega
export type ShippingDetails = {
  method: DeliveryMethod; // Método de entrega escolhido
  routeId?: string; // ID da rota de entrega (se aplicável)
  trackingCode?: string; // Código de rastreio
  cost: number; // Valor do frete
  estimatedDelivery: {
    type: 'dias' | 'horas'; // Tipo de prazo
    value: number; // Valor do prazo
  };
  deliveredAt?: Date; // Data de entrega efetiva (caso entregue)
  address?: {
    street: string;
    number?: string;
    complement?: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
};

// Dados do cliente no momento da compra
export type OrderCustomer = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  document?: string; // CPF ou CNPJ
};

export type DaySchedule = {
  open: boolean;             // Indica se está aberto nesse dia
  startTime?: string;        // Hora de início (formato HH:mm)
  endTime?: string;          // Hora de término (formato HH:mm)
};

type AcceptedRegion = {
  state: string; // Sigla do estado (ex: "SP", "RJ")
  cities: string[]; // Nomes das cidades atendidas
  neighborhoods?: string[]; // Bairros específicos (opcional)
  excludedNeighborhoods?: string[]; // Bairros a serem excluídos (opcional)
};

export type Company = {
  // ID único da empresa
  id: string;

  // ID do usuário dono da empresa (vinculado ao modelo de User)
  ownerId: string;

  // Informações institucionais
  name: string; // Nome da empresa (ex: "Loja da Moda")
  slug: string; // URL amigável, utilizada em links públicos (ex: "loja-da-moda")
  description?: string; // Descrição breve da empresa (opcional)
  logoUrl?: string; // URL do logo da empresa
  bannerUrl?: string; // URL da imagem/banner que será exibido no perfil da loja

  // Documento fiscal da empresa
  document?: string; // Número do documento da empresa (ex: CNPJ)
  documentType?: 'CNPJ' | 'CPF' | 'Outro'; // Tipo do documento

  // Informações de contato
  email: string; // E-mail de contato da empresa
  phone?: string; // Número de telefone para contato
  whatsapp?: string; // Número de WhatsApp para atendimento
  website?: string; // URL do site oficial da empresa
  socialMedia?: {
    instagram?: string; // Instagram da empresa
    facebook?: string;  // Facebook da empresa
    tiktok?: string;    // TikTok da empresa
    linkedin?: string;  // LinkedIn da empresa
    youtube?: string;   // Canal no YouTube
    twitter?: string;   // Twitter da empresa
  };

  // Endereço físico da empresa
  address?: {
    street?: string;   // Rua ou avenida onde a empresa está localizada
    number?: string;   // Número do local
    complement?: string; // Complemento do endereço, se necessário
    neighborhood?: string; // Bairro
    city?: string;        // Cidade
    state?: string;       // Estado
    zipCode?: string;     // Código postal
    country?: string;     // País
    location?: null | {         // Coordenadas geográficas para mapas, caso necessário
      lat?: number;       // Latitude
      lng?: number;       // Longitude
    };
  };

  // 🛒 Regras públicas de negócios e vendas
  businessPolicy?: {
    // Se a empresa oferece serviço de entrega para os produtos
    deliveryEnabled?: boolean;

    // Se a empresa permite retirada dos produtos no local
    pickupEnabled?: boolean;

    // Detalhes das opções de entrega (Ex: "Correios", "Motoboy", etc.)
    shippingDetails?: {
      methods: {
        id: string;       // ID único do método de envio
        name: string;     // Nome do método de envio (ex: "Correios", "Motoboy")
        type: 'fixed' | 'free' | 'per_km' | 'per_region'; // Tipo de taxa (fixa, por km, por região, etc.)
        fee?: number;     // Taxa fixa de envio
        perKmRate?: number; // Taxa por quilômetro (se aplicável)
        freeShippingThreshold?: number; // Valor mínimo para frete grátis
        regionsServed?: string[]; // Regiões atendidas (ex: ['SP', 'RJ'])

        // Prazo de entrega, podendo ser em horas ou dias
        deliveryTime?: {
          unit: 'hours' | 'days';  // Unidade de tempo (horas ou dias)
          min: number;             // Mínimo de tempo
          max: number;             // Máximo de tempo
        };

        isDefault?: boolean;  // Se esse método de envio é o padrão
        notes?: string;       // Notas adicionais sobre o envio
      }[];
    };

    // 💳 Formas de pagamento aceitas
    acceptedPayments?: {
      method: 'pix' | 'credito' | 'debito' | 'boleto' | 'dinheiro' | 'transferencia' | 'mercado_pago' | 'pagseguro' | 'outros';
      provider?: string; // Nome do provedor, por exemplo: 'Visa', 'PicPay', 'Itaú', etc.
      requiresConfirmation?: boolean; // Se precisa de confirmação manual (ex: transferência bancária)
      visibleToUser?: boolean; // Se será visível para o usuário nas opções de pagamento
      instructions?: string;   // Instruções específicas para esse pagamento
    }[];

    // Limites de pedido (Ex: valor mínimo ou máximo para poder realizar um pedido)
    minimumOrderValue?: number;
    maximumOrderValue?: number;

    // Regiões aceitas para entrega (ex: ['SP', 'RJ'])
    acceptedRegions?: AcceptedRegion[];
    deliveryAreas?: string[];

    // 📃 Políticas públicas de vendas
    policies?: {
      // Política de devolução dos produtos
      returnPolicy?: {
        allowed: boolean; // Se aceita devolução
        deadlineDays?: number; // Prazo para devolução em dias
        conditions?: string; // Condições para a devolução
      };

      // Política de troca de produtos
      exchangePolicy?: {
        allowed: boolean; // Se aceita troca
        deadlineDays?: number; // Prazo para troca em dias
        conditions?: string; // Condições para a troca
      };

      // Garantia dos produtos
      warrantyPolicy?: {
        description?: string; // Descrição da garantia
        periodDays?: number; // Prazo da garantia em dias
        covers?: string[]; // O que está coberto pela garantia (ex: "Defeito de fabricação", "Problema de uso", etc.)
      };

      // Termos gerais de uso (link para os termos completos)
      generalTerms?: {
        url?: string; // URL para os termos de uso da loja
        text?: string; // Texto dos termos de uso, caso não tenha um link
      };
    };

    // Horários de atendimento ao cliente por dia da semana
    customerSupportHours?: {
      monday: DaySchedule;
      tuesday: DaySchedule;
      wednesday: DaySchedule;
      thursday: DaySchedule;
      friday: DaySchedule;
      saturday: DaySchedule;
      sunday: DaySchedule;
    };

    // Estimativa de tempo de resposta ao cliente
    estimatedResponseTime?: string; // Ex: "Em até 1 hora", "Resposta até 24h"

    // Canais de atendimento ao cliente (WhatsApp, chat, e-mail, etc.)
    supportChannels?: ('email' | 'whatsapp' | 'chat' | 'telefone' | string)[];
  };

  // Preferências visuais para o catálogo de produtos
  catalogSettings?: {
    themeColor?: string; // Cor tema da loja (ex: "#FF5733")
    layout?: 'grid' | 'list' | 'carousel'; // Layout de exibição do catálogo de produtos
    showFeaturedProducts?: boolean; // Mostrar produtos em destaque?
    featuredProducts?: string[]; // IDs dos produtos em destaque
  };

  // Status da empresa
  isVerified: boolean; // Se a empresa foi verificada pela plataforma
  isActive: boolean; // Se a empresa está ativa na plataforma

  // Datas de criação e atualização da empresa
  createdAt:  string | Date | Timestamp | FieldValue;
  updatedAt?:  string | Date | Timestamp | FieldValue; // Data da última atualização
};

// CRM Types
export type Customer = {
  id: string;
  ownerId: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  profileImageUrl?: string;
  status: string; // Stage ID
  tags?: string[];
  globalOrder?: number;
  stageOrder?: number;
  address?: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
  };
  lastInteraction?: string | Date | Timestamp | FieldValue;
  createdAt: string | Date | Timestamp | FieldValue;
  updatedAt: string | Date | Timestamp | FieldValue;
};

// Team Management Types
export type Role = 'admin' | 'empresa' | 'salesperson' | 'entregador' | 'manager' | 'stockist' | 'accountant' | 'affiliate';

export type EmployeePermissions = {
    modules: {
        dashboard?: boolean;
        products?: boolean;
        orders?: boolean;
        crm?: boolean;
        financials?: boolean;
        logistics?: boolean;
        reports?: boolean;
        team?: boolean;
        settings?: boolean;
        integrations?: boolean;
        companies?: boolean;
        billing?: boolean;
        inbox?: boolean;
        automation?: boolean;
    };
    companies: Record<string, boolean>; // key is companyId
}

export type Employee = {
    id: string;
    ownerId: string;
    userId?: string; // Link to a Firebase Auth user if they have an account
    name: string;
    email: string;
    phone?: string;
    document?: string;
    type: 'Fixo' | 'Freelancer';
    role: Role;
    isActive: boolean;
    permissions?: EmployeePermissions;
    address?: {
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    };
    performanceMetrics?: {
        totalSalesValue?: number;
        totalOrders?: number;
        totalCommission?: number;
    };
    createdAt: string | Date | Timestamp | FieldValue;
    updatedAt: string | Date | Timestamp | FieldValue;
};


export interface Route {
  id: string;
  ownerId: string;
  companyId?: string;
  driverId: string;
  driverName: string;
  title: string;
  notes?: string;
  status: 'em_andamento' | 'finalizada';
  orders: Order[];
  orderIds?: string[];
  
  // Finanças da Rota
  totalValue: number;
  cashTotal?: number;
  cardTotal?: number;
  pixTotal?: number;
  onlineTotal?: number;
  cashAccounted?: number;

  earnings?: {
      type: 'fixed' | 'per_delivery';
      value: number;
  };
  
  finalizationDetails?: {
      settlementAmount: number;
      settlementDirection: 'to_driver' | 'to_company';
      driverFinalPayment: number;
      deliveredCount: number;
      returnedCount: number;
      duration: string;
      notes?: string;
  };

  createdAt: string | Date | Timestamp | FieldValue;
  startedAt?: string | Date | Timestamp | FieldValue;
  finishedAt?: string | Date | Timestamp | FieldValue;
}

export type ApiKey = {
  id: string;
  ownerId: string;
  companyId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  status: 'active' | 'revoked';
  expiresAt: string | Date | Timestamp | FieldValue | null;
  createdAt: string | Date | Timestamp | FieldValue;
  lastUsedAt?: string | Date | Timestamp | FieldValue;
}

export type WebhookEvent = 
  | 'order.created' 
  | 'order.updated' 
  | 'order.paid'
  | 'order.shipped'
  | 'order.cancelled'
  | 'customer.created'
  | 'customer.updated'
  | 'product.created'
  | 'product.updated'
  | 'stock.low'
  | 'stock.out_of_stock';

export type Webhook = {
  id: string;
  ownerId: string;
  companyId: string;
  url: string;
  events: WebhookEvent[];
  authentication?: 'none' | 'header';
  secret?: string; // Only stored if auth type is header
  createdAt: string | Date | Timestamp | FieldValue;
}

export type FinancialData = {
    revenue: number;
    grossProfit: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    averageTicket: number;
    performanceByPeriod: { period: string; Receita: number; Custos: number; Lucro: number }[];
    expenseDistribution: { name: string; value: number }[];
    topProductsByProfit: { name: string; profit: number }[];
};

// V4 - Communication & Leads
export type Consumer = {
  id: string; // Document ID, same as whatsappId
  whatsappId: string; // e.g., 5511999999999@c.us
  name: string;
  phone: string;
  email?: string;
  type: 'lead' | 'buyer' | 'contact' | 'other';
  isCustomer: boolean;
  source: string; // e.g., 'WhatsApp', 'Website Form'
  totalSpent: number;
  ordersCount: number;
  lastPurchaseAt?: Timestamp;
  createdAt: Timestamp;
};

export type Conversation = {
  id: string; // Document ID
  consumerId: string; // Reference to the consumer
  lastMessageTimestamp: Timestamp;
  status: 'open' | 'closed' | 'pending';
  unreadMessagesCount: number;
  lastMessage: string;
  activeFlowId?: string | null;
  currentStepId?: string | null;
};

export type MessageType = 
  | 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' 
  | 'location' | 'contact' | 'interactive' | 'template' | 'reaction' 
  | 'system' | 'product_message' | 'address_message' | 'flow_interactive' 
  | 'list_interactive' | 'cta_interactive' | 'location_interactive' 
  | 'reply_buttons_interactive';

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

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

export type Message = {
  id: string; // WhatsApp Message ID
  direction: 'inbound' | 'outbound';
  type: MessageType;
  from?: string; // Not always present on outbound
  to?: string; // Not always present on inbound
  timestamp: Timestamp | string | Date;
  status: MessageStatus;
  content: {
    text?: TextMessage;
    image?: MediaMessage;
    audio?: MediaMessage;
    video?: MediaMessage;
    document?: MediaMessage;
    location?: LocationMessage;
    contact?: ContactMessage;
    product_message?: ProductMessage;
    interactive?: InteractiveMessage;
    template?: TemplateMessage;
    reaction?: ReactionMessage;
    system?: SystemMessage;
  };
  context?: Record<string, any>;
  error?: Record<string, any>;
};

export type MessageTemplate = {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  status: 'approved' | 'pending' | 'rejected' | 'disabled';
  components: MessageTemplateComponent[];
  createdAt: string | Date | Timestamp;
  updatedAt: string | Date | Timestamp;
};

export type MetaTemplate = {
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'DISABLED';
  components: MessageTemplateComponent[];
};

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

export type LibraryMessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'interactive' | 'product';

export type LibraryMessage = {
  id: string;
  ownerId: string;
  companyId: string;
  name: string;
  type: LibraryMessageType;
  content: {
    text?: TextMessage;
    media?: MediaMessage; // Combined for all media types
    location?: LocationMessage;
    contact?: ContactMessage;
    product_message?: ProductMessage;
    interactive?: InteractiveMessage;
    template?: TemplateMessage;
    reaction?: ReactionMessage;
    system?: SystemMessage;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
};
  

export type AutomationRule = {
  id: string;
  companyId: string;
  ownerId: string;
  name: string;
  trigger: string;
  conditions: {
    field: string;
    operator: '==' | '!=' | '>' | '<' | 'contains' | 'not-contains';
    value: any;
  }[];
  action: 'sendMessage' | 'updateContact';
  templateId?: string; // ID of the message template to send
  isActive: boolean;
};

export type Flow = {
    id: string;
    ownerId: string;
    companyId: string;
    name: string;
    nodes: Node[];
    edges: Edge[];
    status: 'draft' | 'published';
    sessionConfig: {
        timeoutMinutes: number;
        timeoutAction: 'end_flow' | 'send_message' | 'transfer' | 'forward_flow';
        timeoutMessageId?: string; 
        timeoutForwardFlowId?: string;
    };
    schedule: {
        timezone: string;
        isPerpetual: boolean;
        activationTime: string; // HH:mm format
        deactivationTime: string; // HH:mm format
        activeDays: ('sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat')[];
    };
    createdAt: Timestamp | Date | string;
    updatedAt: Timestamp | Date | string;
};

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

export interface WhatsAppCredentials {
  accessToken: string;
  phoneNumberId: string;
  whatsAppBusinessId: string;
  metaAppSecret: string;
}

export interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  messageType?: 'conversation' | 'template';
  templateError?: TemplateErrorInfo;
}

export interface TemplateErrorInfo {
  needsTemplateSetup: boolean;
  errorCode?: number;
  errorMessage?: string;
  wabaId?: string;
  phoneNumberId?: string;
  templateName?: string;
}

export interface TestMessageResponse {
  success: boolean;
  messageId?: string;
  message: string;
  messageType?: 'conversation' | 'template';
  templateError?: TemplateErrorInfo;
}

// Tipos para Webhook do WhatsApp adicionados
export type MessageContact = {
    profile: { name: string; };
    wa_id: string;
};

export type MessageMetadata = {
    display_phone_number: string;
    phone_number_id: string;
};

export type IncomingMessage = {
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
    interactive?: InteractiveMessage;
};

export type WebhookPayload = {
    object: string;
    entry: Array<{
        id: string;
        changes: Array<{
            value: {
                messaging_product: string;
                metadata: MessageMetadata;
                contacts?: MessageContact[];
                messages?: IncomingMessage[];
                statuses?: MessageStatus[];
                message_template_status_update?: TemplateStatusUpdate;
            };
            field: string;
        }>;
    }>;
};

export type TemplateStatusUpdate = {
    message_template_id: string;
    message_template_name: string;
    message_template_language: string;
    event: 'APPROVED' | 'REJECTED' | 'PENDING' | 'DISABLED';
    reason?: string;
};

export type SendMessagePayload = {
    phoneNumber: string;
    type: LibraryMessage['type'] | 'template';
    content?: LibraryMessage['content'];
    // For legacy text messages or simple template calls
    message?: string; 
    templateName?: string;
}


export interface WhatsAppApiError {
    code: number;
    message: string;
    error_data?: { details?: string; };
}

export interface WhatsAppApiResponse {
    messages?: Array<{ id: string; }>;
    error?: WhatsAppApiError;
}

export type CallableRequest<T = any> = {
    auth?: { uid: string; token: string; };
    data: T;
};

export type Reseller = {
    id: string;
    name: string;
    email: string;
    storeId: string;
    totalSales: number;
};
