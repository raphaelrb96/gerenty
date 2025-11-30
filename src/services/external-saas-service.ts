
'use server';

// Este serviço será responsável por se comunicar com a API do seu outro SaaS.
// Por enquanto, ele contém funções de exemplo que retornam dados mocados.

import type { Product } from '@/lib/types';

// Exemplo de um novo tipo de dado para "Revendedor"
export type Reseller = {
  id: string;
  name: string;
  email: string;
  storeId: string;
  totalSales: number;
};

// --- Mock Data ---
const MOCK_PRODUCTS: Product[] = [
  { id: 'ext-prod-001', name: 'Produto Externo A', description: 'Descrição do produto A.', pricing: [{ label: 'Padrão', price: 100 }], ownerId: 'external', companyIds: ['company-1'], status: 'available', visibility: 'public', isVerified: true, isActive: true, slug: 'produto-a', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ext-prod-002', name: 'Produto Externo B', description: 'Descrição do produto B.', pricing: [{ label: 'Padrão', price: 150 }], ownerId: 'external', companyIds: ['company-1'], status: 'available', visibility: 'public', isVerified: true, isActive: true, slug: 'produto-b', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const MOCK_RESELLERS: Reseller[] = [
  { id: 'reseller-01', name: 'João Revendedor', email: 'joao@revenda.com', storeId: 'loja-1', totalSales: 1500 },
  { id: 'reseller-02', name: 'Maria Consultora', email: 'maria@consultora.com', storeId: 'loja-2', totalSales: 2200 },
];

// --- API Functions ---

/**
 * Busca produtos da API do SaaS externo.
 * TODO: Implementar a chamada de API real usando fetch().
 * @param apiKey - A chave de API para autenticação.
 * @returns Uma promessa que resolve para uma lista de produtos.
 */
export async function getExternalProducts(apiKey: string): Promise<Product[]> {
  console.log('Buscando produtos do SaaS externo com a chave:', apiKey ? 'CHAVE_FORNECIDA' : 'SEM_CHAVE');
  // Simula uma chamada de rede
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Por enquanto, retorna dados mocados
  return MOCK_PRODUCTS;
}

/**
 * Busca revendedores da API do SaaS externo.
 * TODO: Implementar a chamada de API real usando fetch().
 * @param apiKey - A chave de API para autenticação.
 * @returns Uma promessa que resolve para uma lista de revendedores.
 */
export async function getExternalResellers(apiKey: string): Promise<Reseller[]> {
  console.log('Buscando revendedores do SaaS externo com a chave:', apiKey ? 'CHAVE_FORNECIDA' : 'SEM_CHAVE');
  // Simula uma chamada de rede
  await new Promise(resolve => setTimeout(resolve, 500));

  // Por enquanto, retorna dados mocados
  return MOCK_RESELLERS;
}

/**
 * Salva as credenciais do SaaS externo de forma segura.
 * TODO: Implementar a lógica para salvar a chave de API no banco de dados ou secret manager.
 * @param companyId - O ID da empresa para associar a chave.
 * @param apiKey - A chave de API a ser salva.
 */
export async function saveExternalSaaSConfig(companyId: string, apiKey: string): Promise<void> {
    console.log(`Salvando chave de API para a empresa ${companyId}`);
    // Lógica para salvar a chave viria aqui.
    await new Promise(resolve => setTimeout(resolve, 300));
}
