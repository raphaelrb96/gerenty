
"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrency } from "@/context/currency-context"
import { useToast } from "@/hooks/use-toast"
import { deleteProduct } from "@/services/product-service"
import type { Product, ProductCategory } from "@/lib/types"
import { useTranslation } from "@/context/i18n-context"
import { ProductDetails } from "./product-details"
import { useAuth } from "@/context/auth-context"
import { useCompany } from "@/context/company-context"
import { getCategoriesByUser } from "@/services/category-service"
import { getCollectionsByUser } from "@/services/collection-service"
import type { ProductCollection } from "@/services/collection-service"


type ProductsGridProps = {
  data: Product[];
  onProductDeleted: () => void;
};

export function ProductsGrid({ data, onProductDeleted }: ProductsGridProps) {
    const { formatCurrency } = useCurrency();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const { user } = useAuth();
    const { companies } = useCompany();

    const [productToDelete, setProductToDelete] = React.useState<Product | null>(null);
    const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    
    const [categories, setCategories] = React.useState<ProductCategory[]>([]);
    const [collections, setCollections] = React.useState<ProductCollection[]>([]);

    React.useEffect(() => {
        if (user) {
            getCategoriesByUser(user.uid).then(setCategories);
            getCollectionsByUser(user.uid).then(setCollections);
        }
    }, [user]);

    const handleDeleteProduct = async (productId: string) => {
        try {
            await deleteProduct(productId);
            toast({
                title: t('productsPage.deleteConfirm.successTitle'),
                description: t('productsPage.deleteConfirm.successDescription'),
            });
            onProductDeleted();
        } catch (error) {
            console.error("Failed to delete product:", error);
            toast({
                variant: "destructive",
                title: t('productsPage.deleteConfirm.errorTitle'),
                description: t('productsPage.deleteConfirm.errorDescription'),
            });
        } finally {
            setProductToDelete(null);
        }
    };
    
    const handleViewDetails = (product: Product) => {
        setSelectedProduct(product);
        setIsSheetOpen(true);
    }

    const getStatusVariant = (status: Product['status']) => {
        switch (status) {
            case 'available':
                return 'bg-green-600/20 text-green-700 hover:bg-green-600/30';
            case 'out-of-stock':
                return 'bg-yellow-600/20 text-yellow-700 hover:bg-yellow-600/30';
            case 'discontinued':
            default:
                return 'bg-red-600/20 text-red-700 hover:bg-red-600/30';
        }
    }


  return (
    <>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {data.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col cursor-pointer" onClick={() => handleViewDetails(product)}>
                <CardHeader className="p-0 relative aspect-square">
                    <Image
                        src={product.images?.mainImage || "https://placehold.co/400x400.png"}
                        alt={product.name}
                        layout="fill"
                        objectFit="cover"
                        className="w-full h-full"
                    />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuLabel>{t('productsPage.actionsLabel')}</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => router.push(`/dashboard/products/${product.id}/edit`)}>
                            {t('productsPage.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                onSelect={(e) => {
                                    e.preventDefault();
                                    setProductToDelete(product);
                                }} 
                                className="text-red-600"
                            >
                                {t('productsPage.delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="p-3 flex-grow">
                    <CardTitle className="text-base font-semibold truncate" title={product.name}>{product.name}</CardTitle>
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-lg font-bold text-primary">{formatCurrency(product.pricing?.[0]?.price ?? 0)}</p>
                        <Badge variant="outline" className={getStatusVariant(product.status)}>{t(`productStatus.${product.status}`)}</Badge>
                    </div>
                </CardContent>
                <CardFooter className="p-3 pt-0 text-xs text-muted-foreground">
                {t('productsPage.stockLabel')}: {typeof product.availableStock === 'number' ? product.availableStock : 'Ilimitado'}
                </CardFooter>
            </Card>
        ))}
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="sm:max-w-xl flex flex-col p-0">
                <SheetHeader className="p-6 pb-0 flex-shrink-0">
                    <SheetTitle>Detalhes do Produto</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-6">
                    {selectedProduct && (
                        <ProductDetails
                            product={selectedProduct}
                            allCompanies={companies}
                            allCategories={categories}
                            allCollections={collections}
                        />
                    )}
                </div>
                 <SheetFooter className="border-t p-6 flex-shrink-0">
                    <Button variant="outline" onClick={() => setIsSheetOpen(false)}>Fechar</Button>
                    <Button onClick={() => {
                        setIsSheetOpen(false);
                        router.push(`/dashboard/products/${selectedProduct?.id}/edit`);
                    }}>Editar Produto</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>

        <AlertDialog open={!!productToDelete} onOpenChange={(isOpen) => !isOpen && setProductToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    {t('productsPage.deleteConfirm.message')}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { if(productToDelete) handleDeleteProduct(productToDelete.id)}}>
                    Confirmar
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  )
}
