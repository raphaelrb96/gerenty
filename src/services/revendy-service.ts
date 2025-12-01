
'use server';

// Este serviço é responsável por se comunicar com a API do Revendy.
// Ele estabelece as funções para uma integração mútua.

import type { OrderStatus } from '@/lib/types';
import type { RevendyProduct } from '@/lib/revendy-types';
import { mapRevendyToGerentyProduct } from '@/mappers/revendy-mapper';
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type { Product as GerentyProduct } from '@/lib/types';

const REVENDY_API_BASE_URL = 'https://www.revendy.com.br/api';

/**
 * Função interna que executa a chamada fetch no lado do servidor.
 */
async function serverFetch(apiKey: string, endpoint: string, options: RequestInit = {}) {
    const url = `${REVENDY_API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer revendy_live_${apiKey}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Chave de API do Revendy inválida ou não autorizada.");
        }
        const errorBody = await response.text();
        console.error(`Erro na API do Revendy (${response.status}): ${errorBody}`);
        throw new Error(`Erro na API do Revendy: ${response.statusText}`);
    }
    
    // Se a resposta não tiver corpo (ex: 204 No Content), retorna success
    if (response.status === 204) {
      return { success: true };
    }

    return response.json();
}

export async function saveRevendyConfig(companyId: string, apiKey: string): Promise<void> {
    const secretDocRef = doc(db, `companies/${companyId}/integrations_secrets`, 'revendy');
    await setDoc(secretDocRef, { apiKey });
}

export async function getRevendyApiKey(companyId: string): Promise<string | undefined> {
    const secretDocRef = doc(db, `companies/${companyId}/integrations_secrets`, 'revendy');
    const docSnap = await getDoc(secretDocRef);
    if (docSnap.exists()) {
        return docSnap.data().apiKey;
    }
    return undefined;
}

export async function testRevendyConnection(apiKey: string): Promise<void> {
    await serverFetch(apiKey, '/test', { method: 'GET' });
}

export async function getRevendyProducts(apiKey: string): Promise<GerentyProduct[]> {
    const revendyProducts: RevendyProduct[] = await serverFetch(apiKey, '/products', { method: 'GET' });
    return revendyProducts.map(mapRevendyToGerentyProduct);
}

export async function pushStockLevelToRevendy(apiKey: string, productSku: string, stockLevel: number): Promise<{ success: boolean }> {
    return serverFetch(apiKey, `/products/${productSku}/stock`, {
        method: 'POST',
        body: JSON.stringify({ stock: stockLevel }),
    });
}

export async function pushOrderStatusToRevendy(apiKey: string, orderId: string, status: OrderStatus): Promise<{ success: boolean }> {
    return serverFetch(apiKey, `/orders/${orderId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: status }),
    });
}

export async function createProductOnRevendy(apiKey: string, productData: Partial<GerentyProduct>): Promise<any> {
    return serverFetch(apiKey, '/products', {
        method: 'POST',
        body: JSON.stringify(productData),
    });
}

export async function updateProductOnRevendy(apiKey: string, productId: string, productData: Partial<GerentyProduct>): Promise<any> {
    return serverFetch(apiKey, `/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
    });
}

export async function createOrderOnRevendy(apiKey: string, orderData: any): Promise<any> {
    return serverFetch(apiKey, '/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
    });
}
