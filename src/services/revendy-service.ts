
'use server';

// Este serviço é responsável por se comunicar com a API do Revendy.
// Ele estabelece as funções para uma integração mútua.

import type { Product as GerentyProduct, OrderStatus } from '@/lib/types';
import type { Product as RevendyProduct } from '@/lib/revendy-types';
import { mapRevendyToGerentyProduct } from '@/mappers/revendy-mapper';
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

// URL base da API do Revendy. Em um cenário real, isso viria de uma variável de ambiente.
const REVENDY_API_BASE_URL = 'https://api.revendy.com/v1';

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
  console.log('Buscando produtos do Revendy...');
  
  if (!apiKey) {
    throw new Error("API Key do Revendy não fornecida.");
  }
  
  try {
    const response = await fetch(`${REVENDY_API_BASE_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
        throw new Error("Chave de API do Revendy inválida ou não autorizada.");
    }
    if (!response.ok) {
        throw new Error(`Erro na API do Revendy: ${response.statusText}`);
    }

    const revendyProducts: RevendyProduct[] = await response.json();
    
    // Mapeia os produtos do Revendy para o formato do Gerenty
    return revendyProducts.map(mapRevendyToGerentyProduct);

  } catch (error: any) {
      console.error("Erro ao buscar produtos do Revendy:", error);
      // Repassa o erro para ser tratado pela UI
      throw error;
  }
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
  
  const response = await fetch(`${REVENDY_API_BASE_URL}/products/${productSku}/stock`, {
      method: 'POST', // ou 'PUT' / 'PATCH' dependendo da API do Revendy
      headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stock: stockLevel }),
  });

  if (!response.ok) {
      console.error("Falha ao atualizar estoque no Revendy:", await response.text());
      return { success: false };
  }
  
  console.log("Estoque atualizado no Revendy com sucesso.");
  return { success: true };
}

/**
 * Envia uma atualização de status de pedido do Gerenty para o Revendy.
 * @param apiKey A chave de API para autenticação no Revendy.
 * @param orderId O ID do pedido no Revendy.
 * @param status O novo status do pedido (ex: 'out_for_delivery', 'delivered').
 */
export async function pushOrderStatusToRevendy(apiKey: string, orderId: string, status: OrderStatus): Promise<{ success: boolean }> {
  console.log(`Enviando atualização de status de pedido para Revendy. Pedido ${orderId}: ${status}`);

  const response = await fetch(`${REVENDY_API_BASE_URL}/orders/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: status }),
  });

   if (!response.ok) {
      console.error("Falha ao atualizar status do pedido no Revendy:", await response.text());
      return { success: false };
  }

  console.log("Status do pedido atualizado no Revendy com sucesso.");
  return { success: true };
}
