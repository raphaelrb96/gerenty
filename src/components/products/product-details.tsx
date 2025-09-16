
"use client";

import type { Product, Company, ProductCategory } from "@/lib/types";
import type { ProductCollection } from "@/services/collection-service";
import { useCurrency } from "@/context/currency-context";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useTranslation } from "@/context/i18n-context";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ProductDetailsProps = {
    product: Product;
    allCompanies: Company[];
    allCategories: ProductCategory[];
    allCollections: ProductCollection[];
};

export function ProductDetails({ product, allCompanies, allCategories, allCollections }: ProductDetailsProps) {
    const { formatCurrency } = useCurrency();
    const { t } = useTranslation();

    const getStatusVariant = (status: Product['status']) => {
        switch (status) {
            case 'available': return 'bg-green-600/20 text-green-700';
            case 'out-of-stock': return 'bg-yellow-600/20 text-yellow-700';
            case 'discontinued': default: return 'bg-red-600/20 text-red-700';
        }
    };
    
    const getVisibilityVariant = (visibility: Product['visibility']) => {
        return visibility === 'public' ? 'bg-blue-600/20 text-blue-700' : 'bg-gray-600/20 text-gray-700';
    };

    const productImages = [
        ...(product.images?.mainImage ? [product.images.mainImage] : []),
        ...(product.images?.gallery || [])
    ];

    const getCompanyNames = () => {
        if (!product.companyIds || product.companyIds.length === 0) return 'Nenhuma';
        return product.companyIds.map(id => allCompanies.find(c => c.id === id)?.name).filter(Boolean).join(', ');
    }
    
    const getCategoryNames = () => {
        if (!product.categoryIds || product.categoryIds.length === 0) return 'Nenhuma';
        return product.categoryIds.map(id => allCategories.find(c => c.id === id)?.name).filter(Boolean).join(', ');
    }

    const getCollectionNames = () => {
        if (!product.collectionIds || product.collectionIds.length === 0) return 'Nenhuma';
        return product.collectionIds.map(id => allCollections.find(c => c.id === id)?.name).filter(Boolean).join(', ');
    }

    const getFriendlyRuleName = (type: string, value: any) => {
        switch (type) {
            case 'minQuantity': return `A partir de ${value} un.`;
            case 'minCartValue': return `Compras acima de ${formatCurrency(value)}`;
            case 'paymentMethod': return `Pagando com ${t(`paymentMethods.${value}`)}`;
            case 'purchaseType': return `Tipo de compra: ${value}`;
            default: return 'N/A';
        }
    }

    const costPrice = product.costPrice || 0;
    const extraCosts = product.extraCosts || 0;

    return (
        <div className="space-y-6">
            {productImages.length > 0 && (
                <Carousel className="w-full">
                    <CarouselContent>
                        {productImages.map((img, index) => (
                            <CarouselItem key={index}>
                                <Card>
                                    <CardContent className="relative aspect-video flex items-center justify-center p-0">
                                        <Image src={img} alt={`${product.name} - Imagem ${index + 1}`} layout="fill" objectFit="cover" className="rounded-lg" />
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    {productImages.length > 1 && (
                        <>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                        </>
                    )}
                </Carousel>
            )}
            
            <div className="space-y-1">
                <h2 className="text-2xl font-bold font-headline">{product.name}</h2>
                <p className="text-muted-foreground text-sm">SKU: {product.sku || 'N/A'}</p>
            </div>
            
             <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={getStatusVariant(product.status)}>{t(`productStatus.${product.status}`)}</Badge>
                <Badge variant="outline" className={getVisibilityVariant(product.visibility)}>{product.visibility === 'public' ? 'Público' : 'Privado'}</Badge>
            </div>

            <Separator />
            
            <div className="space-y-4 text-sm">
                 <div>
                    <h3 className="font-semibold mb-2 text-base">Descrição</h3>
                    <p className="text-muted-foreground">{product.description || 'Nenhuma descrição fornecida.'}</p>
                </div>
                
                 <div className="grid grid-cols-2 gap-4">
                    <div><span className="font-medium">Empresas:</span> <span className="text-muted-foreground">{getCompanyNames()}</span></div>
                    <div><span className="font-medium">Categorias:</span> <span className="text-muted-foreground">{getCategoryNames()}</span></div>
                    <div><span className="font-medium">Coleções:</span> <span className="text-muted-foreground">{getCollectionNames()}</span></div>
                    <div><span className="font-medium">Tags:</span> <span className="text-muted-foreground">{product.tags?.join(', ') || 'Nenhuma'}</span></div>
                 </div>

                <Separator />
                
                <div>
                    <h3 className="font-semibold mb-2 text-base">Estoque e Custos</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><span className="font-medium">Gerenciar Estoque:</span> <span className="text-muted-foreground">{typeof product.availableStock === 'number' ? 'Sim' : 'Não'}</span></div>
                         {typeof product.availableStock === 'number' && (
                             <div><span className="font-medium">Estoque Atual:</span> <span className="text-muted-foreground">{product.availableStock}</span></div>
                         )}
                        <div><span className="font-medium">Preço de Custo:</span> <span className="text-muted-foreground">{formatCurrency(costPrice)}</span></div>
                        <div><span className="font-medium">Custos Extras (p/ un.):</span> <span className="text-muted-foreground">{formatCurrency(extraCosts)}</span></div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h3 className="font-semibold mb-2 text-base">Preços e Lucratividade</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {product.pricing.map((p, i) => {
                            const sellingPrice = p.price || 0;
                            const commissionType = p.commission?.type || 'fixed';
                            const commissionValue = p.commission?.value || 0;
                            const commissionAmount = commissionType === 'percentage' 
                                ? sellingPrice * (commissionValue / 100) 
                                : commissionValue;
                            
                            const totalCost = costPrice + extraCosts + commissionAmount;
                            const profit = sellingPrice - totalCost;
                            const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

                            return (
                                <Card key={i}>
                                    <CardHeader className="p-4">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base">{p.label}</CardTitle>
                                            <p className="font-bold text-lg">{formatCurrency(sellingPrice)}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Regra:</span>
                                            <span>{p.rule?.type && p.rule.type !== 'none' ? getFriendlyRuleName(p.rule.type, p.rule.value) : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Comissão:</span>
                                            <span>{commissionType === 'fixed' ? formatCurrency(commissionValue) : `${commissionValue.toFixed(2)}%`}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                            <span className="text-muted-foreground">Lucro:</span>
                                            <span className={profit > 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(profit)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                            <span className="text-muted-foreground">Margem:</span>
                                            <span className={margin > 0 ? "text-green-600" : "text-red-600"}>{margin.toFixed(2)}%</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>

                 <div>
                    <h3 className="font-semibold mb-2 text-base">Atributos</h3>
                    {product.attributes && product.attributes.length > 0 ? (
                        <div className="space-y-2">
                            {product.attributes.map((attr, i) => (
                                <p key={i}><span className="font-medium">{attr.name}:</span> <span className="text-muted-foreground">{attr.options.join(', ')}</span></p>
                            ))}
                        </div>
                    ) : (<p className="text-sm text-muted-foreground">Nenhum atributo.</p>)}
                </div>

            </div>
        </div>
    );
}
