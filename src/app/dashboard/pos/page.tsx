
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getProducts } from "@/services/product-service";
import type { Product, OrderItem } from "@/lib/types";
import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { PosForm } from "@/components/pos/pos-form";
import { ProductGrid } from "@/components/pos/product-list";
import { useTranslation } from "@/context/i18n-context";
import { useCompany } from "@/context/company-context";
import { EmptyState } from "@/components/common/empty-state";
import { Package } from "lucide-react";


export default function PosPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeCompany } = useCompany();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && activeCompany) {
      fetchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [user, activeCompany]);

  const fetchProducts = async () => {
    if (!user || !activeCompany) return;
    setLoading(true);
    try {
      const userProducts = await getProducts(activeCompany.id);
      setProducts(userProducts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        return prevCart.map(item => 
          item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
        );
      } else {
        const newItem: OrderItem = {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.pricing[0].price,
          totalPrice: product.pricing[0].price,
          isDigital: false, // Assume default, could be part of product data
          imageUrl: product.images?.mainImage,
        };
        return [...prevCart, newItem];
      }
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!activeCompany) {
     return (
        <div className="space-y-4">
            <PageHeader
                title={t('pos.title')}
                description="Crie um novo pedido de forma rápida e manual."
            />
            <EmptyState
                icon={<Package className="h-16 w-16" />}
                title="Nenhuma Empresa Selecionada"
                description="Por favor, selecione uma empresa ativa para começar a vender."
            />
        </div>
     )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-6">
        <PageHeader
            title={t('pos.title')}
            description="Selecione produtos para adicionar ao carrinho e finalize o pedido."
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 pb-6 flex-1 overflow-hidden">
        <div className="lg:col-span-2 h-full overflow-auto pr-2 no-scrollbar">
          <ProductGrid products={products} onAddToCart={handleAddToCart} />
        </div>
        <div className="lg:col-span-1 h-full flex flex-col">
          <PosForm cart={cart} setCart={setCart} />
        </div>
      </div>
    </div>
  );
}
