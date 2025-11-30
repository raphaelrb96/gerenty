# Guia de Integração para Desenvolvedores Revendy & Gerenty

Este documento detalha a estrutura de dados e a organização do banco de dados Firestore do Gerenty, servindo como um guia técnico para a equipe de desenvolvimento do Revendy construir a integração entre as duas plataformas.

## Visão Geral da Integração

O objetivo é uma sincronização mútua:

1.  **Revendy -> Gerenty**: Novos produtos e pedidos criados no Revendy devem ser refletidos no Gerenty. Atualizações de produtos também devem ser sincronizadas.
2.  **Gerenty -> Revendy**: Atualizações de estoque e status de pedidos (logística) feitas no Gerenty devem ser enviadas de volta para o Revendy.

## Estrutura do Banco de Dados Firestore (Gerenty)

A seguir estão as principais coleções e seus caminhos no Firestore do Gerenty.

-   `/companies/{companyId}`: Armazena os dados de cada empresa/loja.
-   `/products/{productId}`: Catálogo de todos os produtos.
-   `/orders/{orderId}`: Registra todos os pedidos.
-   `/customers/{customerId}`: Armazena a base de clientes (CRM).
-   `/employees/{employeeId}`: Gerencia os membros da equipe (vendedores, entregadores).
-   `/routes/{routeId}`: Contém as rotas de entrega criadas no módulo de logística.

## Tipos de Dados Essenciais (TypeScript)

Estas são as interfaces TypeScript que definem a estrutura dos documentos no Firestore do Gerenty.

---

### `Product` (Produto)

Esta é a estrutura principal para produtos no Gerenty. Ao sincronizar, os produtos do Revendy devem ser mapeados para este formato.

```typescript
export type Product = {
  id: string;
  ownerId: string; // ID do usuário dono (deve corresponder ao dono no Gerenty)
  companyIds?: string[]; // IDs das empresas/lojas às quais o produto pertence

  name: string;
  slug: string;
  description: string;
  sku?: string;

  isActive: boolean;
  costPrice?: number;
  extraCosts?: number;
  
  // Mapeamento de preço
  pricing: {
    label: string; // Ex: "Varejo", "Atacado"
    price: number;
    rule?: {
      type: 'none' | 'minQuantity' | 'minCartValue' | 'paymentMethod' | 'purchaseType';
      value?: any;
    };
    commission?: {
      type: 'fixed' | 'percentage';
      value: number;
    };
  }[];

  // Controle de Estoque
  availableStock?: number | boolean; // `true` para estoque ilimitado, `number` para controle

  // Organização
  categoryIds?: string[];
  collectionIds?: string[];
  tags?: string[];

  images?: {
    mainImage: string;
    gallery: string[];
  };

  // Status e Visibilidade
  status: 'available' | 'out-of-stock' | 'discontinued';
  visibility: 'public' | 'private';

  // Metadados
  createdAt: string | Date | Timestamp | FieldValue;
  updatedAt: string | Date | Timestamp | FieldValue;
  
  // Campos adicionais...
};
```

---

### `Order` (Pedido)

Quando um pedido é criado no Revendy, ele deve ser enviado ao Gerenty seguindo esta estrutura.

```typescript
export type Order = {
  id: string;
  companyId: string; // ID da empresa no Gerenty
  employeeId?: string; // Vendedor (se aplicável)
  
  customer: { 
    id?: string; // ID do cliente no CRM do Gerenty (se já existir)
    name: string; 
    email: string; 
    phone: string; 
  };

  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    costPrice?: number; // Custo do produto no momento da venda
  }[];

  status: OrderStatus; // Veja a tabela de mapeamento de status abaixo

  payment: { 
    method: 'credito' | 'debito' | 'pix' | 'dinheiro' | 'boleto' | 'link' | 'outros';
    status: 'aguardando' | 'aprovado' | 'recusado' | 'estornado'; 
    type: 'presencial' | 'online';
  };

  shipping?: { 
    method: 'retirada_loja' | 'entrega_padrao' | 'logistica_propria' | 'digital'; 
    cost?: number;
    address?: {
        street: string;
        number?: string;
        city: string;
        state: string;
        zipCode: string;
    };
  };

  subtotal: number;
  discount?: number;
  shippingCost?: number;
  total: number; // Valor final pago pelo cliente

  notes?: string;

  createdAt: string | Date | Timestamp | FieldValue;
  updatedAt: string | Date | Timestamp | FieldValue;
};
```

---

### `Customer` (Cliente)

Representa um cliente no CRM do Gerenty.

```typescript
export type Customer = {
  id: string;
  ownerId: string; // ID do dono da conta
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  status: string; // ID do "Estágio" no CRM (ex: Lead, Ativo, VIP)
  tags?: string[];
  // ... outros campos de CRM
};
```

---

### Mapeamento de Status de Pedidos

Para manter a consistência, use a seguinte correspondência ao enviar atualizações de status entre as plataformas.

| Status no Revendy          | Status no Gerenty      | Direção da Sincronização |
| -------------------------- | ---------------------- | ------------------------ |
| `pending_payment`          | `pending`              | Revendy -> Gerenty       |
| `confirmed`                | `confirmed`            | Revendy -> Gerenty       |
| `ready_for_shipping`       | `processing`           | Revendy -> Gerenty       |
| `out_for_delivery`         | `out_for_delivery`     | Gerenty -> Revendy       |
| `delivered`                | `delivered`            | Gerenty -> Revendy       |
| `completed`                | `completed`            | Gerenty -> Revendy       |
| `cancelled`                | `cancelled`            | Mútua                    |

**Fluxo Sugerido:**
1.  Pedido criado no Revendy com status `pending_payment` ou `confirmed` é enviado ao Gerenty.
2.  Gerenty atualiza o status para `processing` quando o pedido está sendo preparado.
3.  Quando o pedido entra em uma rota no Gerenty, seu status muda para `out_for_delivery`. O Gerenty **notifica o Revendy** sobre essa mudança.
4.  Quando o entregador marca a entrega como concluída no Gerenty, o status muda para `delivered`. O Gerenty **notifica o Revendy**.
5.  O Gerenty pode então finalizar o pedido, mudando o status para `completed`.

Este guia deve fornecer a base técnica necessária para a equipe do Revendy iniciar o desenvolvimento dos endpoints de API e webhooks para a integração.