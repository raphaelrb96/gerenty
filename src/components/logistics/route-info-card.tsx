
"use client";

import { useState, useMemo } from "react";
import type { Route } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/context/currency-context";
import { Truck, CheckCircle, Package, DollarSign, TrendingUp, Wallet, PackageCheck, PackageX, CreditCard } from "lucide-react";
import { RouteDetailsModal } from "./route-details-modal";
import { cn } from "@/lib/utils";

type RouteInfoCardProps = {
    route: Route;
    onRouteFinalized: () => void;
};

export function RouteInfoCard({ route, onRouteFinalized }: RouteInfoCardProps) {
    const { formatCurrency } = useCurrency();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const metrics = useMemo(() => {
        const successfulDeliveries = route.orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
        const cancelledDeliveries = route.orders.filter(o => o.status === 'cancelled' || o.status === 'returned').length;
        
        const successfulOrders = route.orders.filter(o => o.status === 'delivered' || o.status === 'completed');

        const totalCashValue = successfulOrders.filter(o => o.payment.method === 'dinheiro').reduce((sum, o) => sum + o.total, 0);
        const totalAccountValue = successfulOrders.filter(o => o.payment.method !== 'dinheiro').reduce((sum, o) => sum + o.total, 0);
        const totalValue = totalCashValue + totalAccountValue;

        const totalCancelledValue = route.orders.filter(o => o.status === 'cancelled' || o.status === 'returned').reduce((sum, o) => sum + o.total, 0);

        return {
            successfulDeliveries,
            cancelledDeliveries,
            totalOrders: route.orders.length,
            totalCashValue,
            totalAccountValue,
            totalValue,
            totalCancelledValue,
        };
    }, [route.orders]);

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
                        <div className="flex items-start gap-2">
                           <PackageCheck className="h-4 w-4 text-green-500 mt-0.5" />
                           <div>
                                <p className="font-semibold">{metrics.successfulDeliveries} / {metrics.totalOrders}</p>
                                <p className="text-xs text-muted-foreground">Entregues</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-2">
                           <PackageX className="h-4 w-4 text-red-500 mt-0.5" />
                           <div>
                                <p className="font-semibold">{metrics.cancelledDeliveries} / {metrics.totalOrders}</p>
                                <p className="text-xs text-muted-foreground">Canceladas</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-2">
                           <Wallet className="h-4 w-4 text-muted-foreground mt-0.5" />
                           <div>
                                <p className="font-semibold">{formatCurrency(metrics.totalValue)}</p>
                                <p className="text-xs text-muted-foreground">Total Arrecadado</p>
                           </div>
                        </div>
                         <div className="flex items-start gap-2">
                           <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                           <div>
                                <p className="font-semibold">{formatCurrency(metrics.totalCashValue)}</p>
                                <p className="text-xs text-muted-foreground">Em Dinheiro</p>
                           </div>
                        </div>
                         <div className="flex items-start gap-2">
                           <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                           <div>
                                <p className="font-semibold">{formatCurrency(metrics.totalAccountValue)}</p>
                                <p className="text-xs text-muted-foreground">Na Conta</p>
                           </div>
                        </div>
                         <div className="flex items-start gap-2">
                           <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5" />
                           <div>
                                <p className="font-semibold">{formatCurrency(metrics.totalCancelledValue)}</p>
                                <p className="text-xs text-muted-foreground">Valor Cancelado</p>
                           </div>
                        </div>

                         {isFinalized && route.finalizationDetails && (
                             <div className="flex items-start gap-2 col-span-2">
                                <DollarSign className="h-4 w-4 text-primary mt-0.5" />
                                <div>
                                    <p className="font-semibold">{formatCurrency(route.finalizationDetails.driverFinalPayment)}</p>
                                    <p className="text-xs text-muted-foreground">Pagamento Motorista</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDetailsOpen(true)}>Ver Detalhes</Button>
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
