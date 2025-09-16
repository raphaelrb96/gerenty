
import type { OrderStatus } from './types';

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  "pending", 
  "confirmed", 
  "processing", 
  "out_for_delivery", 
  "delivered", 
  "completed", 
  "cancelled", 
  "refunded", 
  "returned"
];

export const DELIVERY_KANBAN_STATUSES: OrderStatus[] = [
  "pending", 
  "confirmed", 
  "processing", 
  "out_for_delivery", 
  "delivered"
];
