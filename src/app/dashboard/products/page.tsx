"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ProductForm } from "@/components/products/product-form";
import { PlusCircle, Search, Filter } from "lucide-react";
import Image from "next/image";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

const products = [
  { id: 1, name: "Ergonomic Chair", price: "$299.99", stock: 25, image: "https://placehold.co/400x300.png", hint: "office chair" },
  { id: 2, name: "Wireless Mouse", price: "$49.99", stock: 150, image: "https://placehold.co/400x300.png", hint: "computer mouse" },
  { id: 3, name: "Mechanical Keyboard", price: "$129.99", stock: 75, image: "https://placehold.co/400x300.png", hint: "keyboard" },
  { id: 4, name: "4K Monitor", price: "$499.99", stock: 15, image: "https://placehold.co/400x300.png", hint: "computer monitor" },
  { id: 5, name: "Standing Desk", price: "$399.99", stock: 30, image: "https://placehold.co/400x300.png", hint: "office desk" },
  { id: 6, name: "Webcam", price: "$89.99", stock: 90, image: "https://placehold.co/400x300.png", hint: "webcam" },
];

export default function ProductsPage() {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleAddProduct = () => {
        setSelectedProduct(null);
        setIsSheetOpen(true);
    }
    
    const handleEditProduct = (product: any) => {
        setSelectedProduct(product);
        setIsSheetOpen(true);
    }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog.</p>
        </div>
        <Button onClick={handleAddProduct} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-8" />
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>In Stock</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Out of Stock</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selectedProduct ? 'Edit Product' : 'Add New Product'}</SheetTitle>
          </SheetHeader>
          <ProductForm product={selectedProduct} onFinished={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader className="p-0">
                <Image
                    src={product.image}
                    alt={product.name}
                    width={400}
                    height={300}
                    className="rounded-t-lg"
                    data-ai-hint={product.hint}
                />
            </CardHeader>
            <CardContent className="p-4">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <p className="font-semibold text-primary">{product.price}</p>
                <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button variant="outline" className="w-full" onClick={() => handleEditProduct(product as any)}>Edit</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
