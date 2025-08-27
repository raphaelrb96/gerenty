
"use client";

import type { Product } from "@/lib/types";
import { useCurrency } from "@/context/currency-context";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { useTranslation } from "@/context/i18n-context";

type ProductDetailsProps = {
    product: Product;
};

export function ProductDetails({ product }: ProductDetailsProps) {
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
    }

    return (
        <div className="space-y-6">
            {product.images?.mainImage && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <Image
                        src={product.images.mainImage}
                        alt={product.name}
                        layout="fill"
                        objectFit="cover"
                    />
                </div>
            )}
            
            <div className="space-y-1">
                <h2 className="text-2xl font-bold font-headline">{product.name}</h2>
                <p className="text-muted-foreground text-sm">SKU: {product.sku || 'N/A'}</p>
            </div>
            
             <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={getStatusVariant(product.status)}>{t(`productStatus.${product.status}`)}</Badge>
                <Badge variant="outline" className={getVisibilityVariant(product.visibility)}>{product.visibility === 'public' ? 'Público' : 'Privado'}</Badge>
                <Badge variant="secondary">{typeof product.availableStock === 'number' ? `${product.availableStock} em estoque` : 'Estoque Ilimitado'}</Badge>
            </div>

            <Separator />
            
            <div className="space-y-4">
                 <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-sm text-muted-foreground">{product.description || 'Nenhuma descrição fornecida.'}</p>
                </div>

                <div>
                    <h3 className="font-semibold mb-2">Preços</h3>
                    <ul className="space-y-1 text-sm list-disc list-inside">
                        {product.pricing.map((p, i) => (
                             <li key={i}><span className="font-medium">{p.label}:</span> {formatCurrency(p.price)}</li>
                        ))}
                    </ul>
                </div>

                 <div>
                    <h3 className="font-semibold mb-2">Atributos</h3>
                    {product.attributes && product.attributes.length > 0 ? (
                        <div className="space-y-2 text-sm">
                            {product.attributes.map((attr, i) => (
                                <p key={i}><span className="font-medium">{attr.name}:</span> {attr.options.join(', ')}</p>
                            ))}
                        </div>
                    ) : (<p className="text-sm text-muted-foreground">Nenhum atributo.</p>)}
                </div>

                <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    {product.tags && product.tags.length > 0 ? (
                         <div className="flex flex-wrap gap-2">
                            {product.tags.map(tag => (
                                <Badge key={tag} variant="outline">{tag}</Badge>
                            ))}
                        </div>
                    ) : <p className="text-sm text-muted-foreground">Nenhuma tag.</p>}
                </div>
            </div>
        </div>
    );
}

