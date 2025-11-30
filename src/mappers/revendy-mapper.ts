
import type { Product as GerentyProduct } from '@/lib/types';
import type { Product as RevendyProduct } from '@/lib/revendy-types';

/**
 * Converte um objeto de produto da estrutura do Revendy para a estrutura do Gerenty.
 * @param revendyProduct O produto vindo da API do Revendy.
 * @returns O produto no formato esperado pelo Gerenty.
 */
export function mapRevendyToGerentyProduct(revendyProduct: RevendyProduct): GerentyProduct {
    
    // Constrói o objeto base no formato do Gerenty
    const gerentyProduct: GerentyProduct = {
        id: revendyProduct.id, // Manter o ID para referência
        ownerId: revendyProduct.ownerUid,
        companyIds: [revendyProduct.storeId],
        name: revendyProduct.name,
        slug: revendyProduct.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''),
        description: revendyProduct.description,
        sku: revendyProduct.sku || revendyProduct.id,
        isActive: revendyProduct.isAvailable ?? true,
        costPrice: revendyProduct.cmv || 0,
        extraCosts: (revendyProduct.impostosNacionais || 0) + (revendyProduct.logisticaEntrega || 0) + (revendyProduct.custosFixos || 0),
        
        // Mapeia a primeira faixa de preço
        pricing: [{
            label: 'Padrão',
            price: revendyProduct.price,
            rule: { type: 'none' },
            commission: {
                type: revendyProduct.commission.type,
                value: revendyProduct.commission.value,
            },
        }],
        
        availableStock: revendyProduct.stock ?? true, // Se stock não for definido, o Gerenty não gerencia
        
        categoryIds: [revendyProduct.category], // Assume que a categoria é um ID ou um nome que pode ser mapeado
        
        images: {
            mainImage: revendyProduct.imageUrls?.[0] || '',
            gallery: revendyProduct.imageUrls?.slice(1) || [],
        },

        status: 'available', // Status padrão no Gerenty
        visibility: 'public', // Visibilidade padrão no Gerenty
        isVerified: revendyProduct.status === 'approved',

        createdAt: revendyProduct.createdAt || new Date(),
        updatedAt: revendyProduct.updatedAt || new Date(),
    };

    return gerentyProduct;
}
