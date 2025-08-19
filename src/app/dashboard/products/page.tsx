
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getProducts } from "@/services/product-service";
import type { Product } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductForm } from "@/components/products/product-form";
import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { PlusCircle, Package } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/context/i18n-context";


export default function ProductsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

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

    const handleAddProduct = () => {
        setSelectedProduct(null);
        setIsSheetOpen(true);
    }
    
    const handleEditProduct = (product: Product) => {
        setSelectedProduct(product);
        setIsSheetOpen(true);
    }

    const handleFormFinished = () => {
        setIsSheetOpen(false);
        fetchProducts(); // Refresh product list
    }

    if (loading) {
        return <LoadingSpinner />;
    }

  return (
    <div className="space-y-4">
       <PageHeader 
        title={t('productsPage.title')}
        description={t('productsPage.description')}
        action={
            <Button onClick={handleAddProduct} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                <PlusCircle className="mr-2 h-4 w-4" /> {t('productsPage.addProduct')}
            </Button>
        }
       />
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedProduct ? t('productsPage.editProduct') : t('productsPage.newProduct')}</SheetTitle>
          </SheetHeader>
          <ProductForm product={selectedProduct} onFinished={handleFormFinished} />
        </SheetContent>
      </Sheet>

      {products.length === 0 ? (
         <EmptyState 
            icon={<Package className="h-16 w-16" />}
            title={t('productsPage.empty.title')}
            description={t('productsPage.empty.description')}
            action={
                <Button onClick={handleAddProduct} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> {t('productsPage.empty.action')}
                </Button>
            }
         />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
            <Card key={product.id}>
                <CardHeader className="p-0">
                    <Image
                        src={product.imageUrl || "https://placehold.co/400x300.png"}
                        alt={product.name}
                        width={400}
                        height={300}
                        className="rounded-t-lg aspect-[4/3] object-cover"
                        data-ai-hint={product.imageHint}
                    />
                </CardHeader>
                <CardContent className="p-4">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="font-semibold text-primary">R${product.price.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{t('productsPage.stock')}: {product.stock}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                    <Button variant="outline" className="w-full" onClick={() => handleEditProduct(product)}>
                        {t('productsPage.edit')}
                    </Button>
                </CardFooter>
            </Card>
            ))}
        </div>
      )}
    </div>
  );
}
