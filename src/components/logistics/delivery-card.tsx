
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, GripVertical, MoreHorizontal, DollarSign, Home } from "lucide-react";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/currency-context";
import { Badge } from "@/components/ui/badge";

type DeliveryCardProps = {
    order: Order & { driverName?: string };
    isOverlay?: boolean;
}

export function DeliveryCard({ order, isOverlay }: DeliveryCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: order.id, data: { type: 'Delivery', order } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const { formatCurrency } = useCurrency();
    
    const getPaymentBadgeColor = (status: string) => {
        switch (status) {
            case 'aprovado': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'aguardando': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            default: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        }
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
             <Card 
                className={cn(
                    "group hover:shadow-md transition-shadow", 
                    isDragging && "opacity-50 shadow-lg z-50",
                    isOverlay && "shadow-lg"
                )}
            >
                <CardContent className="p-3 flex items-start gap-2">
                     <div {...listeners} className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground">
                        <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                             <p className="font-semibold text-sm leading-tight">{order.customer.name}</p>
                             <p className="font-bold text-sm">{formatCurrency(order.total)}</p>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Home className="h-3 w-3"/>
                            {order.shipping?.address?.neighborhood || 'Endereço não informado'}
                        </p>
                         {order.driverName && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <User className="h-3 w-3"/>
                                {order.driverName}
                            </p>
                         )}
                         <div className="flex gap-2 pt-1">
                            <Badge variant="secondary" className={cn("text-xs", getPaymentBadgeColor(order.payment.status))}>{order.payment.status}</Badge>
                            <Badge variant="outline" className="capitalize text-xs">{order.payment.method}</Badge>
                         </div>
                    </div>
                </CardContent>
             </Card>
        </div>
    )
}
