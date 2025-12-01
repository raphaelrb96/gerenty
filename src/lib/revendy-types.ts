
// Estrutura de dados do Revendy
import type { DocumentData, DocumentReference, Timestamp } from "firebase/firestore";

export interface Product extends DocumentData {
  id: string;
  storeId: string;
  ownerUid: string;
  name: string;
  description: string;
  isAvailable?: boolean; // New field
  category: string;
  price: number;
  cmv?: number; // Custo da Mercadoria Vendida
  impostosNacionais?: number;
  logisticaEntrega?: number;
  custosFixos?: number;
  commission: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  productType: "physical" | "digital" | "service";
  visibility: "public" | "private" | "both";
  status?: 'pending' | 'approved' | 'rejected';
  warranty: string;
  imageUrls?: string[];
  stock?: number;
  createdAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  isBoosted?: boolean;
  boostExpiresAt?: Timestamp;
  sku?: string; // Adicionado para servir como identificador único
}
