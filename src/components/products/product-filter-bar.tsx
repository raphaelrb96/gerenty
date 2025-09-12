
"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { MultiSelect } from "../ui/multi-select";
import type { Product, ProductCategory } from "@/lib/types";

type ProductFilterBarProps = {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    statusFilter: "all" | Product['status'];
    setStatusFilter: (value: "all" | Product['status']) => void;
    stockFilter: "all" | "in-stock" | "out-of-stock";
    setStockFilter: (value: "all" | "in-stock" | "out-of-stock") => void;
    categoryFilter: string[];
    setCategoryFilter: (value: string[]) => void;
    sortOrder: string;
    setSortOrder: (value: string) => void;
    categories: ProductCategory[];
};

export function ProductFilterBar({
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    stockFilter, setStockFilter,
    categoryFilter, setCategoryFilter,
    sortOrder, setSortOrder,
    categories
}: ProductFilterBarProps) {

    const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }));

    return (
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="relative sm:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome do produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                     <MultiSelect
                        options={categoryOptions}
                        selected={categoryFilter}
                        onChange={setCategoryFilter}
                        placeholder="Filtrar categorias..."
                        className="w-full"
                     />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger><SelectValue placeholder="Filtrar por status..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            <SelectItem value="available">Disponível</SelectItem>
                            <SelectItem value="out-of-stock">Esgotado</SelectItem>
                            <SelectItem value="discontinued">Descontinuado</SelectItem>
                        </SelectContent>
                    </Select>
                     <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger><SelectValue placeholder="Ordenar por..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Mais Recentes</SelectItem>
                            <SelectItem value="oldest">Mais Antigos</SelectItem>
                            <SelectItem value="price-desc">Maior Preço</SelectItem>
                            <SelectItem value="price-asc">Menor Preço</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}
