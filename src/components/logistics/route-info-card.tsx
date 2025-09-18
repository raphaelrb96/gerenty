
"use client";

import { useState } from "react";
import type { Route } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/context/currency-context";
import { Truck, CheckCircle, Package, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { RouteDetailsModal } from "./route-details-modal";
import { cn } from "@/lib/utils";

type RouteInfoCardProps = {
    route: Route;
    onRouteFinalized: () => void;
};

export function RouteInfoCard({ route, onRouteFinalized }: RouteInfoCardProps) {
    const { formatCurrency } = useCurrency();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getStatusVariant = (status: Route['status']) => {
        return status === 'finalizada' ? 'bg-green-600/20 text-green-700' : 'bg-yellow-600/20 text-yellow-700';
    }

    const deliveriesDone = route.orders.filter(o => o.status === 'delivered').length;
    const isFinalized = route.status === 'finalizada';

    return (
        <>
            <Card className="flex flex-col">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>{getInitials(route.driverName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-lg">{route.driverName}</CardTitle>
                                <p className="text-xs text-muted-foreground">Rota #{route.id.substring(0, 7)}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className={getStatusVariant(route.status)}>
                            {isFinalized ? <CheckCircle className="mr-1 h-3 w-3" /> : <Truck className="mr-1 h-3 w-3" />}
                            {isFinalized ? 'Finalizada' : 'Em Andamento'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                     <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{deliveriesDone} / {route.orders.length}</p>
                                <p className="text-xs text-muted-foreground">Entregas</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                             <div>
                                <p className="font-semibold">{formatCurrency(route.totalValue || 0)}</p>
                                <p className="text-xs text-muted-foreground">Valor Total</p>
                            </div>
                        </div>
                        {isFinalized && route.finalizationDetails ? (
                             <>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">{formatCurrency(route.finalizationDetails.driverFinalPayment)}</p>
                                        <p className="text-xs text-muted-foreground">Pgto. Motorista</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="font-semibold">{formatCurrency(route.finalizationDetails.settlementAmount)}</p>
                                        <p className="text-xs text-muted-foreground">Prestado Contas</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="font-semibold">{formatCurrency(route.cashTotal || 0)}</p>
                                    <p className="text-xs text-muted-foreground">Em Dinheiro</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDetailsOpen(true)}>Ver Detalhes</Button>
                    {!isFinalized && (
                         <Button onClick={() => setIsDetailsOpen(true)}>Finalizar</Button>
                    )}
                </CardFooter>
            </Card>
            {isDetailsOpen && (
                <RouteDetailsModal 
                    isOpen={isDetailsOpen} 
                    onClose={() => setIsDetailsOpen(false)} 
                    route={route} 
                    onRouteFinalized={onRouteFinalized} 
                />
            )}
        </>
    );
}
