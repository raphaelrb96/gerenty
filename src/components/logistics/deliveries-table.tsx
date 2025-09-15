
"use client";

import type { Order } from "@/lib/types";
import {
  Card,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/context/currency-context";
import { EmptyState } from "../common/empty-state";
import { Package, User, MapPin, Truck } from "lucide-react";
import { Separator } from "../ui/separator";

type DeliveriesTableProps = {
  orders: (Order & { driverName?: string })[];
};

export function DeliveriesTable({ orders }: DeliveriesTableProps) {
    const { formatCurrency } = useCurrency();

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
                <Card key={order.id}>
                    <CardContent className="p-4 space-y-3 text-sm">
                        <div className="flex items-center gap-2 font-semibold">
                           <User className="h-4 w-4 text-muted-foreground" />
                           <span>{order.customer.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                           <MapPin className="h-4 w-4" />
                           <span>{order.shipping?.address?.city || 'N/A'}</span>
                        </div>
                        {order.driverName && (
                             <div className="flex items-center gap-2 text-muted-foreground">
                               <Truck className="h-4 w-4" />
                               <Badge variant="outline">{order.driverName}</Badge>
                            </div>
                        )}
                    </CardContent>
                    <Separator />
                    <CardFooter className="p-4 flex justify-end">
                        <p className="font-bold text-lg">{formatCurrency(order.total)}</p>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
