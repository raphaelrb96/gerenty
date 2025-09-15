
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { Search } from "lucide-react";
import { EmptyState } from "../common/empty-state";
import { RouteInfoCard } from "./route-info-card";
import type { Route } from "@/lib/types";

type RouteManagementProps = {
    routes: Route[];
    onDataRefresh: () => void;
};

export function RouteManagement({ routes, onDataRefresh }: RouteManagementProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | Route['status']>("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 29), to: new Date() });

    const filteredRoutes = routes.filter(route => {
        const matchesSearch = route.driverName.toLowerCase().includes(searchTerm.toLowerCase()) || route.id.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
        
        const routeDate = new Date(route.createdAt as string);
        const matchesDate = dateRange?.from && dateRange?.to 
            ? routeDate >= dateRange.from && routeDate <= dateRange.to
            : true;
        
        return matchesSearch && matchesStatus && matchesDate;
    });

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar por entregador ou ID da rota..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                        <Select value={statusFilter} onValueChange={setStatusFilter as (value: string) => void}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por status..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                <SelectItem value="finalizada">Finalizada</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {filteredRoutes.length === 0 ? (
                <EmptyState 
                    icon={<Search className="h-16 w-16" />}
                    title="Nenhuma rota encontrada"
                    description="Tente ajustar seus filtros ou crie uma nova rota."
                />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredRoutes.map(route => (
                        <RouteInfoCard key={route.id} route={route} onRouteFinalized={onDataRefresh} />
                    ))}
                </div>
            )}
        </div>
    );
}
