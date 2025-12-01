
import type { DocumentData, Timestamp } from "firebase/firestore";

export interface RevendyProduct extends DocumentData {
  id: string;
  storeId: string;
  ownerUid: string;
  name: string;
  description: string;
  isAvailable?: boolean;
  category: string;
  price: number;
  cmv?: number;
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
  sku?: string;
}
