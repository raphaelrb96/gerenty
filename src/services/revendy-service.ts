
'use server';

// Este serviço é responsável por se comunicar com a API do Revendy.
// Ele estabelece as funções para uma integração mútua.

import type { Product as GerentyProduct, OrderStatus } from '@/lib/types';
import type { Product as RevendyProduct } from '@/lib/revendy-types';
import { mapRevendyToGerentyProduct } from '@/mappers/revendy-mapper';
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";


/**
 * Salva a chave de API do Revendy de forma segura para uma empresa.
 * @param companyId - O ID da empresa no Gerenty.
 * @param apiKey - A chave de API do Revendy a ser salva.
 */
export async function saveRevendyConfig(companyId: string, apiKey: string): Promise<void> {
    console.log(`Salvando chave de API do Revendy para a empresa ${companyId}`);
    // Em um app real, isso poderia usar o Secret Manager do Google Cloud.
    // Para este protótipo, salvaremos em uma subcoleção "integrations_secrets".
    const secretDocRef = doc(db, `companies/${companyId}/integrations_secrets`, 'revendy');
    await setDoc(secretDocRef, { apiKey });
}

/**
 * Recupera a chave de API do Revendy para uma empresa.
 * @param companyId - O ID da empresa no Gerenty.
 */
export async function getRevendyApiKey(companyId: string): Promise<string | undefined> {
    const secretDocRef = doc(db, `companies/${companyId}/integrations_secrets`, 'revendy');
    const docSnap = await getDoc(secretDocRef);
    if (docSnap.exists()) {
        return docSnap.data().apiKey;
    }
    return undefined;
}


// --- Funções de PUXAR dados do Revendy (Revendy -> Gerenty) ---

/**
 * Busca a lista completa de produtos da API do Revendy e os mapeia para o formato do Gerenty.
 * @param apiKey - A chave de API para autenticação no Revendy.
 * @returns Uma promessa que resolve para uma lista de produtos no formato do Gerenty.
 */
export async function getRevendyProducts(apiKey: string): Promise<GerentyProduct[]> {
  console.log('Buscando produtos do Revendy com a chave:', apiKey ? 'CHAVE_FORNECIDA' : 'SEM_CHAVE');
  
  if (!apiKey) {
    throw new Error("API Key do Revendy não fornecida.");
  }
  
  // Simula uma chamada de rede para a API do Revendy
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Exemplo de retorno da API do Revendy
  const MOCK_REVERY_PRODUCTS: RevendyProduct[] = [
    { id: 'rev-prod-001', storeId: 'revendy-store-1', ownerUid: 'revendy-owner-1', name: 'Camiseta Revendy Modelo A', description: 'Descrição da camiseta A vinda do Revendy.', category: 'Roupas', price: 120, commission: { type: 'percentage', value: 10 }, productType: 'physical', visibility: 'public', isAvailable: true, stock: 50, createdAt: new Date(), updatedAt: new Date() },
    { id: 'rev-prod-002', storeId: 'revendy-store-1', ownerUid: 'revendy-owner-1', name: 'Caneca Exclusiva Revendy', description: 'Descrição da caneca B vinda do Revendy.', category: 'Acessórios', price: 45, commission: { type: 'fixed', value: 5 }, productType: 'physical', visibility: 'public', isAvailable: true, stock: 100, createdAt: new Date(), updatedAt: new Date() },
  ];

  if (apiKey !== "revendy_api_key_valid") {
      throw new Error("Chave de API do Revendy inválida.");
  }

  // Mapeia os produtos do Revendy para o formato do Gerenty
  return MOCK_REVERY_PRODUCTS.map(mapRevendyToGerentyProduct);
}


// --- Funções de EMPURRAR dados para o Revendy (Gerenty -> Revendy) ---

/**
 * Envia uma atualização de nível de estoque do Gerenty para o Revendy.
 * @param apiKey A chave de API para autenticação no Revendy.
 * @param productSku O SKU do produto para identificar no Revendy.
 * @param stockLevel O novo nível de estoque.
 */
export async function pushStockLevelToRevendy(apiKey: string, productSku: string, stockLevel: number): Promise<{ success: boolean }> {
  console.log(`Enviando atualização de estoque para Revendy. Produto SKU ${productSku}: ${stockLevel}`);
  // Lógica da chamada `fetch` para a API do Revendy viria aqui
  // Ex: await fetch(`https://api.revendy.com/v1/products/${productSku}/stock`, { method: 'POST', body: JSON.stringify({ stock: stockLevel }), headers: {'Authorization': `Bearer ${apiKey}`} })
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log("Estoque atualizado no Revendy com sucesso.");
  return { success: true };
}

/**
 * Envia uma atualização de status de pedido do Gerenty para o Revendy.
 * @param apiKey A chave de API para autenticação no Revendy.
 * @param orderId O ID do pedido no Revendy.
 * @param status O novo status do pedido (ex: 'em_transito', 'entregue').
 */
export async function pushOrderStatusToRevendy(apiKey: string, orderId: string, status: OrderStatus): Promise<{ success: boolean }> {
  console.log(`Enviando atualização de status de pedido para Revendy. Pedido ${orderId}: ${status}`);
  // Lógica da chamada `fetch` para a API do Revendy viria aqui
  // Ex: await fetch(`https://api.revendy.com/v1/orders/${orderId}/status`, { method: 'POST', body: JSON.stringify({ status }), headers: {'Authorization': `Bearer ${apiKey}`} })
  await new Promise(resolve => setTimeout(resolve, 300));
  console.log("Status do pedido atualizado no Revendy com sucesso.");
  return { success: true };
}
