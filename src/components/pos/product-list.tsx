
"use client";

import type { Product } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.length > 0 ? filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden flex flex-col group cursor-pointer" onClick={() => onAddToCart(product)}>
            <CardHeader className="p-0 relative aspect-square">
              <Image
                  src={product.images?.mainImage || "https://placehold.co/400x400.png"}
                  alt={product.name}
                  layout="fill"
                  objectFit="cover"
                  className="w-full h-full"
              />
            </CardHeader>
            <CardContent className="p-3 flex-grow">
              <p className="font-semibold text-sm leading-tight truncate" title={product.name}>{product.name}</p>
              <p className="text-sm font-bold text-primary mt-1">{formatCurrency(product.pricing[0]?.price)}</p>
            </CardContent>
             <CardFooter className="p-2 pt-0">
               <Button className="w-full" variant="outline" size="sm" >
                 <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
               </Button>
            </CardFooter>
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
