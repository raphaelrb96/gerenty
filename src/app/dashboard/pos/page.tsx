

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getProductsByUser } from "@/services/product-service";
import type { Product, OrderItem } from "@/lib/types";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useCompany } from "@/context/company-context";
import { EmptyState } from "@/components/common/empty-state";
import { Package, Building, ChevronsUpDown, Shield } from "lucide-react";
import { PosFormStepper } from "@/components/pos/pos-form-stepper";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/context/i18n-context";
import { usePermissions } from "@/context/permissions-context";


function CompanySelector() {
    const { t } = useTranslation();
    const { companies, activeCompany, setActiveCompany } = useCompany();
    const { userData } = useAuth();
    const isCompanyOwner = userData?.role === 'empresa';

    const getDisplayName = () => {
        if (!activeCompany) {
            return "Selecione uma empresa";
        }
        return activeCompany.name;
    };

    return (
        <Card>
            <CardContent className="p-4 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-md bg-muted">
                        <Building className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.activeCompany')}</p>
                        <h2 className="text-lg font-bold">{getDisplayName()}</h2>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            {t('dashboard.switchCompany')}
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {companies.map((company) => (
                            <DropdownMenuItem key={company.id} onSelect={() => setActiveCompany(company)}>
                                {company.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardContent>
        </Card>
    );
}


export default function PosPage() {
  const { user, userData, effectiveOwnerId } = useAuth();
  const { activeCompany } = useCompany();
  const { hasAccess } = usePermissions();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isCompanyOwner = userData?.role === 'empresa';

  // Specific business rule: Access to POS products is granted if the user can manage orders.
  const canAccessPosProducts = hasAccess('orders');

  useEffect(() => {
    async function fetchProducts() {
        if (!effectiveOwnerId || !activeCompany || !canAccessPosProducts) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const userProducts = await getProductsByUser(effectiveOwnerId);
            setProducts(userProducts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
    
    if (user) {
        fetchProducts();
    } else {
        setLoading(false);
    }
  }, [user, activeCompany, effectiveOwnerId, canAccessPosProducts]);

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
          commissionRate: product.commission || 0,
          isDigital: false,
          imageUrl: product.images?.mainImage,
          costPrice: product.costPrice || 0,
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

  const handleUpdatePrice = (productId: string, newPrice: number) => {
      setCart(
          cart.map((item) =>
              item.productId === productId
              ? { ...item, unitPrice: newPrice, totalPrice: newPrice * item.quantity }
              : item
          )
      )
  }

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };


  if (loading) {
    return <LoadingSpinner />;
  }

  if (!activeCompany) {
    return (
       <div className="container mx-auto p-6 md:p-8">
            <CompanySelector />
            <div className="flex items-center justify-center h-[calc(100vh-20rem)] p-6">
                <EmptyState
                icon={<Package className="h-16 w-16" />}
                title="Nenhuma Empresa Selecionada"
                description="Por favor, selecione uma empresa ativa para começar a vender."
                action={ isCompanyOwner ?
                    (<Button asChild>
                        <Link href="/dashboard/companies/create">Criar uma Empresa</Link>
                    </Button>) : undefined
                }
                />
            </div>
       </div>
    );
  }

  if (!canAccessPosProducts) {
       return (
         <div className="container mx-auto p-6 md:p-8">
            <CompanySelector />
            <div className="flex items-center justify-center h-[calc(100vh-20rem)] p-6">
                 <EmptyState
                    icon={<Shield className="h-16 w-16" />}
                    title="Acesso Negado ao PDV"
                    description="Você não tem permissão para criar pedidos ou visualizar produtos. Por favor, contate o administrador da conta."
                />
            </div>
         </div>
       );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
        <CompanySelector />
        <PosFormStepper
            products={products}
            cart={cart}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateQuantity}
            onUpdateCartPrice={handleUpdatePrice}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={() => setCart([])}
        />
    </div>
  );
}

    
