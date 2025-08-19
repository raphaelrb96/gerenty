
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getProducts } from "@/services/product-service";
import type { Product } from "@/lib/types";
import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { PosForm } from "@/components/pos/pos-form";
import { ProductList } from "@/components/pos/product-list";

export default function PosPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userProducts = await getProducts(user.uid);
      setProducts(userProducts);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Ponto de Venda (PDV)"
        description="Crie um novo pedido de forma rápida e manual."
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <PosForm allProducts={products} />
        </div>
        <div className="lg:col-span-1">
          <ProductList products={products} />
        </div>
      </div>
    </div>
  );
}
