
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getProducts } from "@/services/product-service";
import type { Product, OrderItem } from "@/lib/types";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useTranslation } from "@/context/i18n-context";
import { useCompany } from "@/context/company-context";
import { EmptyState } from "@/components/common/empty-state";
import { Package } from "lucide-react";
import { PosFormStepper } from "@/components/pos/pos-form-stepper";

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
    } else if (!activeCompany) {
      setProducts([]);
      setCart([]);
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
      const existingItem = prevCart.find(
        (item) => item.productId === product.id
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      } else {
        const newItem: OrderItem = {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.pricing[0].price,
          totalPrice: product.pricing[0].price,
          isDigital: false,
          imageUrl: product.images?.mainImage,
        };
        return [...prevCart, newItem];
      }
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
          : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  if (!activeCompany) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <EmptyState
          icon={<Package className="h-16 w-16" />}
          title="Nenhuma Empresa Selecionada"
          description="Por favor, selecione uma empresa ativa no seu dashboard para começar a vender."
        />
      </div>
    );
  }

  return (
    <PosFormStepper
      products={products}
      cart={cart}
      onAddToCart={handleAddToCart}
      onUpdateCartQuantity={handleUpdateQuantity}
      onRemoveFromCart={handleRemoveFromCart}
      onClearCart={() => setCart([])}
    />
  );
}
