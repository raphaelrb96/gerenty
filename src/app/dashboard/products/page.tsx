
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getProductsByUser } from "@/services/product-service";
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
import { ProductsGrid } from "@/components/products/products-grid";
import { Input } from "@/components/ui/input";

export default function ProductsPage() {
    const { t } = useTranslation();
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");


    const fetchProducts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch all products for the user
            const userProducts = await getProductsByUser(user.uid);
            setProducts(userProducts);
        } catch (error) {
            console.error(error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProducts();
        } else {
            setLoading(false);
        }
    }, [user]);


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

    // Filter products based on search term and active company
    const filteredProducts = products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return nameMatch;
    });

    return (
        <div className="space-y-4">
            <PageHeader
                title={t('productsPage.title')}
                description={t('productsPage.description')}
                action={
                    <Button onClick={handleAddProduct} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={isProductLimitReached}>
                        <PlusCircle className="mr-2 h-4 w-4" /> {t('productsPage.addProduct')}
                    </Button>
                }
            />

            {products.length > 0 && (
                 <div className="flex items-center">
                    <Input
                        placeholder="Filtrar por nome..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="max-w-sm"
                    />
                </div>
            )}

            {filteredProducts.length === 0 && !loading ? (
                <EmptyState
                    icon={<Package className="h-16 w-16" />}
                    title={t('productsPage.empty.title')}
                    description={t('productsPage.empty.description')}
                    action={
                        <Button onClick={handleAddProduct} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={isProductLimitReached}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {t('productsPage.empty.action')}
                        </Button>
                    }
                />
            ) : (
                <ProductsGrid data={filteredProducts} onProductDeleted={fetchProducts} />
            )}
        </div>
    );
}
