
"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import type { Role } from "@/lib/types";

type UsersFilterBarProps = {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    roleFilter: "all" | Role;
    setRoleFilter: (value: "all" | Role) => void;
    statusFilter: "all" | "active" | "inactive";
    setStatusFilter: (value: "all" | "active" | "inactive") => void;
};

const roles: Role[] = ['admin', 'empresa', 'salesperson', 'entregador', 'manager', 'stockist', 'accountant', 'affiliate'];

export function UsersFilterBar({ 
    searchTerm, setSearchTerm, 
    roleFilter, setRoleFilter,
    statusFilter, setStatusFilter 
}: UsersFilterBarProps) {
    return (
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por nome..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                     <div className="md:col-span-1">
                        <Select value={roleFilter} onValueChange={setRoleFilter as any}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por função..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Funções</SelectItem>
                                {roles.map(role => (
                                    <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-1">
                         <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="inactive">Inativo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
