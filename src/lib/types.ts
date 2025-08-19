import type { Timestamp, FieldValue } from "firebase/firestore";

export type Plan = {
  name: string;
  price: number;
  features: string[];
};

export type User = {
  uid: string;
  email: string;
  name: string;
  profileImage?: string;
  phoneNumber?: string;
  authProvider: 'email' | 'google' | 'facebook';
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  role: 'admin' | 'empresa';
  plan: Plan | null;
  statusPlan: 'ativo' | 'inativo' | 'pendente';
  validityDate?: Date | Timestamp | FieldValue;
  assignedDate?: Date | Timestamp | FieldValue;
  createdAt: Date | Timestamp | FieldValue;
  lastLogin?: Date | Timestamp | FieldValue;
  updatedAt?: Date | Timestamp | FieldValue;
  onboardingCompleted?: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku?: string;
  isActive: boolean;
  pricing: Array<{
    label: string;
    price: number;
    discountedPrice?: number;
    currency: 'BRL' | 'USD' | 'EUR' | 'GBP';
    minQuantity: number;
    quantityRule: 'perItem' | 'cartTotal';
    startDate?: Date | FieldValue;
    endDate?: Date | FieldValue;
  }>;
  availableStock?: number | boolean;
  attributes: Array<{
    name: string;
    options: string[];
    imageUrls: Array<{ option: string; imageUrl: string }>;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    emoji: string;
  }>;
  collections: string[];
  tags: string[];
  images: {
    mainImage: string;
    gallery: string[];
  };
  templateId?: string;
  publishedAt?: Date | Timestamp | FieldValue;
  updatedAt: Date | Timestamp | FieldValue;
  createdAt: Date | Timestamp | FieldValue;
  status: 'available' | 'out-of-stock' | 'discontinued';
  visibility: 'public' | 'private';
  promotion?: {
    startDate: Date;
    endDate: Date;
    discountPercentage: number;
  };
  vendorId: string;
  isVerified: boolean;
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    allowedRoles: ('admin' | 'empresa' | 'user')[];
  };
  additionalInfo?: {
    weight?: string;
    dimensions?: string;
    manufacturer?: string;
    warranty?: string;
    shippingInfo?: string;
  };
  reviews: {
    averageRating: number;
    totalReviews: number;
    ratings: number[];
  };
  versionHistory: {
    version: string;
    updatedAt: Date;
    changes: string[];
  }[];
  templateCustomization?: {
    layoutSettings: {
      displayType: 'card' | 'grid' | 'list';
      cardSize: 'small' | 'medium' | 'large';
      showPrice: boolean;
    };
  };
  salesStrategies?: {
    crossSell?: string[];
    upsell?: string[];
    bundles?: string[];
  };
};

export type Order = {
  id: string;
  companyId: string;
  catalogId?: string;
  customer: {
    userId?: string;
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    productSlug?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variant?: {
      name: string;
      value: string;
      imageUrl?: string;
    };
    imageUrl?: string;
    isDigital: boolean;
    downloadLink?: string;
    externalLink?: string;
    notes?: string;
  }>;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded';
  payment: {
    method: 'credito' | 'debito' | 'pix' | 'dinheiro' | 'boleto' | 'link' | 'outros';
    type: 'presencial' | 'online';
    status: 'aguardando' | 'aprovado' | 'recusado' | 'estornado';
    transactionId?: string;
    paidAt?: Date;
    installments?: number;
  };
  shipping?: {
    method: 'retirada_loja' | 'entrega_padrao' | 'correios' | 'logistica_propria' | 'digital';
    trackingCode?: string;
    cost: number;
    estimatedDelivery: {
      type: 'dias' | 'horas';
      value: number;
    };
    deliveredAt?: Date;
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
  subtotal: number;
  discount?: number;
  shippingCost?: number;
  taxas?: number;
  total: number;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  cancelledAt?: Timestamp;
};

export type Finance = {
    id: string;
    userId: string;
    type: 'income' | 'expense';
    amount: number;
    currency: 'BRL' | 'USD' | 'EUR';
    source: string;
    category: string;
    status: 'pending' | 'completed' | 'failed';
    description: string;
    referenceId?: string;
    notes?: string;
    transactionDate: Date | Timestamp | FieldValue;
    createdAt: Date | Timestamp | FieldValue;
}
