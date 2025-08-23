
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getProducts } from "@/services/product-service";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { PlusCircle, Package } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ProductsTable } from "@/components/products/products-table";

export default function ProductsPage() {
    const { t } = useTranslation();
    const { user, userData } = useAuth();
    const { activeCompany } = useCompany();
    const { toast } = useToast();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && activeCompany) {
            fetchProducts();
        } else {
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

    const handleAddProduct = () => {
        const productLimit = userData?.plan?.limits?.products ?? 0;
        if (products.length >= productLimit) {
            toast({
                variant: "destructive",
                title: "Limite de Produtos Atingido",
                description: "Você atingiu o limite de produtos para o seu plano atual. Considere fazer um upgrade.",
            });
            return;
        }
        router.push('/dashboard/products/new');
    }

    if (loading) {
        return <LoadingSpinner />;
    }

    const isProductLimitReached = (userData?.plan?.limits?.products ?? 0) <= products.length;

    return (
        <div className="space-y-4">
            <PageHeader
                title={t('productsPage.title')}
                description={t('productsPage.description')}
                action={
                    <Button onClick={handleAddProduct} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={!activeCompany || isProductLimitReached}>
                        <PlusCircle className="mr-2 h-4 w-4" /> {t('productsPage.addProduct')}
                    </Button>
                }
            />

            {products.length === 0 ? (
                <EmptyState
                    icon={<Package className="h-16 w-16" />}
                    title={t('productsPage.empty.title')}
                    description={!activeCompany ? "Selecione uma empresa para ver os produtos." : t('productsPage.empty.description')}
                    action={
                        <Button onClick={handleAddProduct} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={!activeCompany || isProductLimitReached}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {t('productsPage.empty.action')}
                        </Button>
                    }
                />
            ) : (
                <ProductsTable data={products} onProductDeleted={fetchProducts} />
            )}
        </div>
    );
}
