
"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

type CrmFilterBarProps = {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    searchField: string;
    setSearchField: (value: string) => void;
};

export function CrmFilterBar({ searchTerm, setSearchTerm, searchField, setSearchField }: CrmFilterBarProps) {
    return (
        <Card className="mt-4">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar clientes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <Select value={searchField} onValueChange={setSearchField}>
                            <SelectTrigger>
                                <SelectValue placeholder="Buscar por..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Nome</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="phone">Telefone</SelectItem>
                                <SelectItem value="document">Documento</SelectItem>
                                <SelectItem value="tags">Tags</SelectItem>
                                <SelectItem value="id">ID</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
