
"use client";

import type { Order } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/context/currency-context";
import { EmptyState } from "../common/empty-state";
import { Package, User, MapPin, Truck, DollarSign, Clock } from "lucide-react";
import { Separator } from "../ui/separator";

type DeliveriesTableProps = {
  orders: (Order & { driverName?: string })[];
};

export function DeliveriesTable({ orders }: DeliveriesTableProps) {
    const { formatCurrency } = useCurrency();

    const getPaymentStatusVariant = (status: Order['payment']['status']) => {
        switch (status) {
            case 'aprovado': return 'bg-green-600/20 text-green-700';
            case 'aguardando': return 'bg-yellow-600/20 text-yellow-700';
            case 'recusado': default: return 'bg-red-600/20 text-red-700';
        }
    }

    if (orders.length === 0) {
        return (
            <div className="py-12">
                <EmptyState 
                    icon={<Package className="h-12 w-12" />}
                    title="Nenhuma entrega aqui"
                    description="Não há entregas com este status no momento."
                />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
                <Card key={order.id} className="flex flex-col">
                    <CardHeader className="p-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-base">Pedido #{order.id.substring(0, 7)}</CardTitle>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                    <Clock className="h-3 w-3"/>
                                    {new Date(order.createdAt as string).toLocaleString()}
                                </p>
                            </div>
                            <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3 text-sm flex-grow">
                        <div className="flex items-center gap-2 font-semibold">
                           <User className="h-4 w-4 text-muted-foreground" />
                           <span>{order.customer.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                           <MapPin className="h-4 w-4" />
                           <span>{order.shipping?.address?.street}, {order.shipping?.address?.number} - {order.shipping?.address?.city || 'N/A'}</span>
                        </div>
                        {order.driverName && (
                             <div className="flex items-center gap-2 text-muted-foreground">
                               <Truck className="h-4 w-4" />
                               <Badge variant="outline">{order.driverName}</Badge>
                            </div>
                        )}
                    </CardContent>
                    <Separator />
                    <CardFooter className="p-3 flex justify-between items-center text-xs">
                        <Badge variant="secondary" className="capitalize">{order.payment.method}</Badge>
                        <Badge variant="outline" className={getPaymentStatusVariant(order.payment.status)}>{order.payment.status}</Badge>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
