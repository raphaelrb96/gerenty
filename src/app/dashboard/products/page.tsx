
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getProductsByUser } from "@/services/product-service";
import type { Product, ProductCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { PlusCircle, Package } from "lucide-react";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ProductsGrid } from "@/components/products/products-grid";
import { ProductFilterBar } from "@/components/products/product-filter-bar";
import { getCategoriesByUser } from "@/services/category-service";

export default function ProductsPage() {
    const { t } = useTranslation();
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | Product['status']>("all");
    const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "out-of-stock">("all");
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [sortOrder, setSortOrder] = useState<string>("newest");


    const fetchProductsAndCategories = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [userProducts, userCategories] = await Promise.all([
                getProductsByUser(user.uid),
                getCategoriesByUser(user.uid)
            ]);
            setAllProducts(userProducts);
            setCategories(userCategories);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Erro ao buscar dados", description: "Não foi possível carregar produtos e categorias."});
            setAllProducts([]);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProductsAndCategories();
        } else {
            setLoading(false);
        }
    }, [user]);


    const handleAddProduct = () => {
        const productLimit = userData?.plan?.limits?.products ?? Infinity;
        if (allProducts.length >= productLimit) {
            toast({
                variant: "destructive",
                title: "Limite de Produtos Atingido",
                description: "Você atingiu o limite de produtos para o seu plano atual. Considere fazer um upgrade.",
            });
            return;
        }
        router.push('/dashboard/products/new');
    }

    const filteredAndSortedProducts = React.useMemo(() => {
        let filtered = [...allProducts];

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }
        // Stock filter
        if (stockFilter !== 'all') {
            if (stockFilter === 'in-stock') {
                filtered = filtered.filter(p => typeof p.availableStock !== 'number' || p.availableStock > 0);
            } else { // out-of-stock
                filtered = filtered.filter(p => typeof p.availableStock === 'number' && p.availableStock <= 0);
            }
        }
        // Category filter
        if (categoryFilter.length > 0) {
            filtered = filtered.filter(p => p.categoryIds?.some(catId => categoryFilter.includes(catId)));
        }

        // Sorting
        switch (sortOrder) {
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt as string).getTime() - new Date(b.createdAt as string).getTime());
                break;
            case 'price-asc':
                filtered.sort((a,b) => (a.pricing?.[0]?.price ?? 0) - (b.pricing?.[0]?.price ?? 0));
                break;
            case 'price-desc':
                 filtered.sort((a,b) => (b.pricing?.[0]?.price ?? 0) - (a.pricing?.[0]?.price ?? 0));
                break;
            case 'newest':
            default:
                filtered.sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime());
                break;
        }

        return filtered;
    }, [allProducts, searchTerm, statusFilter, stockFilter, categoryFilter, sortOrder]);


    if (loading) {
        return <LoadingSpinner />;
    }

    const isProductLimitReached = (userData?.plan?.limits?.products ?? Infinity) <= allProducts.length;

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

            <ProductFilterBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                stockFilter={stockFilter}
                setStockFilter={setStockFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                categories={categories}
            />


            {filteredAndSortedProducts.length === 0 && !loading ? (
                <EmptyState
                    icon={<Package className="h-16 w-16" />}
                    title={t('productsPage.empty.title')}
                    description={allProducts.length > 0 ? "Nenhum produto corresponde aos filtros selecionados." : t('productsPage.empty.description')}
                    action={ allProducts.length === 0 ? (
                        <Button onClick={handleAddProduct} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={isProductLimitReached}>
                            <PlusCircle className="mr-2 h-4 w-4" /> {t('productsPage.empty.action')}
                        </Button>
                    ) : undefined }
                />
            ) : (
                <ProductsGrid data={filteredAndSortedProducts} onProductDeleted={fetchProductsAndCategories} />
            )}
        </div>
    );
}
