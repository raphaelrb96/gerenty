
"use client";

import type { Product } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState } from "react";
import { useCurrency } from "@/context/currency-context";

type ProductListProps = {
  products: Product[];
};

export function ProductList({ products }: ProductListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const { formatCurrency } = useCurrency();

    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Lista de Produtos</CardTitle>
        <Input 
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <div className="space-y-4">
            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50">
                    <Image
                        src={product.images?.mainImage || "https://placehold.co/64x64.png"}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="rounded-md aspect-square object-cover"
                    />
                    <div className="flex-grow">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(product.pricing[0]?.price)}</p>
                    </div>
                </div>
            )) : (
                <p className="text-center text-muted-foreground py-8">Nenhum produto encontrado.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
