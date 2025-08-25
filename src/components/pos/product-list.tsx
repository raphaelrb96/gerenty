
"use client";

import type { Product } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState } from "react";
import { useCurrency } from "@/context/currency-context";
import { Button } from "../ui/button";
import { PlusCircle } from "lucide-react";

type ProductGridProps = {
  products: Product[];
  onAddToCart: (product: Product) => void;
};

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const { formatCurrency } = useCurrency();

    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-4">
      <Input 
        placeholder="Buscar produto por nome..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredProducts.length > 0 ? filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden group cursor-pointer" onClick={() => onAddToCart(product)}>
            <CardContent className="p-2 flex items-center gap-3">
                <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                        src={product.images?.mainImage || "https://placehold.co/100x100.png"}
                        alt={product.name}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
                    />
                </div>
                <div className="flex-grow space-y-1">
                  <p className="font-semibold text-sm leading-tight line-clamp-2" title={product.name}>{product.name}</p>
                   <div className="flex items-center justify-between">
                     <p className="text-sm font-bold text-primary">{formatCurrency(product.pricing[0]?.price)}</p>
                     <Button className="h-7 w-7" variant="ghost" size="icon">
                       <PlusCircle className="h-5 w-5" />
                     </Button>
                   </div>
                </div>
            </CardContent>
          </Card>
        )) : (
            <div className="col-span-full text-center text-muted-foreground py-8">
                <p>Nenhum produto encontrado.</p>
            </div>
        )}
      </div>
    </div>
  );
}
