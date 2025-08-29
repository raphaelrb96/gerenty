

import type { FieldValue, Timestamp } from "firebase/firestore";

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
  | 'pending'        // Aguardando pagamento ou aprovação
  | 'confirmed'      // Pedido confirmado
  | 'processing'     // Em separação ou produção
  | 'shipped'        // Enviado para o cliente
  | 'delivered'      // Entregue com sucesso
  | 'completed'      // Pedido finalizado
  | 'cancelled'      // Pedido cancelado
  | 'refunded';      // Reembolso realizado


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
  status: 'aguardando' | 'aprovado' | 'recusado' | 'estornado';
  transactionId?: string; // ID da transação no gateway
  paidAt?: Date; // Data de pagamento (se aprovado)
  installments?: number; // Número de parcelas (se aplicável)
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
  routeId?: string; // ID da rota de logística
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
    status: string;
    tags?: string[];
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
export type Employee = {
    id: string;
    ownerId: string;
    userId?: string; // Link to a Firebase Auth user if they have an account
    name: string;
    email: string;
    phone?: string;
    document?: string;
    type: 'Fixo' | 'Freelancer';
    role: 'Vendedor' | 'Entregador' | 'Afiliado' | 'Outro';
    isActive: boolean;
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
        totalSales?: number;
        ordersDelivered?: number;
        commission?: number;
    };
    createdAt: string | Date | Timestamp | FieldValue;
    updatedAt: string | Date | Timestamp | FieldValue;
};

// Logistics Types
export type Route = {
    id: string;
    ownerId: string;
    driverId: string; // Employee ID of the driver
    driverName: string;
    orders: Order[]; // The orders included in this route
    status: 'A Processar' | 'Em Trânsito' | 'Entregue' | 'Outro';
    totalValue: number;
    totalFee: number;
    createdAt: string | Date | Timestamp | FieldValue;
    startedAt?: string | Date | Timestamp | FieldValue;
    finishedAt?: string | Date | Timestamp | FieldValue;
};
