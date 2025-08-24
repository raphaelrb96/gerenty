
"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrency } from "@/context/currency-context"
import { useToast } from "@/hooks/use-toast"
import { deleteProduct } from "@/services/product-service"
import type { Product } from "@/lib/types"

type ProductsGridProps = {
  data: Product[];
  onProductDeleted: () => void;
};

export function ProductsGrid({ data, onProductDeleted }: ProductsGridProps) {
    const { formatCurrency } = useCurrency();
    const router = useRouter();
    const { toast } = useToast();

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm("Tem certeza que deseja deletar este produto? Esta ação não pode ser desfeita.")) {
            return;
        }

        try {
            await deleteProduct(productId);
            toast({
                title: "Produto Deletado",
                description: "O produto foi removido com sucesso.",
            });
            onProductDeleted();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao Deletar",
                description: "Não foi possível remover o produto. Tente novamente.",
            });
        }
    };

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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {data.map((product) => (
        <Card key={product.id} className="overflow-hidden flex flex-col">
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
                        <Button variant="secondary" size="icon" className="absolute top-2 right-2 h-8 w-8 rounded-full">
                        <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}>
                        Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteProduct(product.id)} className="text-red-600">
                        Deletar
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="p-3 flex-grow">
                <CardTitle className="text-base font-semibold truncate" title={product.name}>{product.name}</CardTitle>
                <div className="flex items-center justify-between mt-2">
                    <p className="text-lg font-bold text-primary">{formatCurrency(product.pricing?.[0]?.price ?? 0)}</p>
                    <Badge variant="outline" className={getStatusVariant(product.status)}>{product.status}</Badge>
                </div>
            </CardContent>
            <CardFooter className="p-3 pt-0 text-xs text-muted-foreground">
               Estoque: {typeof product.availableStock === 'number' ? product.availableStock : 'Ilimitado'}
            </CardFooter>
        </Card>
      ))}
    </div>
  )
}
