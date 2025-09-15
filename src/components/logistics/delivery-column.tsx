
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DeliveryCard } from "./delivery-card";
import { RouteContainerCard } from "./route-container-card";
import type { Route, Order, DeliveryStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type DeliveryColumnProps = {
    status: DeliveryStatus;
    orders: (Order & { driverName?: string })[];
    routes: Route[];
    onDataRefresh: () => void;
};

const statusConfig: Record<DeliveryStatus, { label: string, color: string }> = {
    'a_processar': { label: 'A Processar', color: 'border-blue-500' },
    'em_transito': { label: 'Em Trânsito', color: 'border-yellow-500' },
    'entregue': { label: 'Entregue', color: 'border-green-500' },
    'devolvida': { label: 'Devolvida', color: 'border-orange-500' },
    'cancelada': { label: 'Cancelada', color: 'border-red-500' },
}

export function DeliveryColumn({ status, orders, routes, onDataRefresh }: DeliveryColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: status, data: { status } });
    const config = statusConfig[status];

    return (
        <div 
            className="flex flex-col gap-4"
        >
            <h3 className={cn('font-semibold text-lg border-l-4 pl-2', config.color)}>
                {config.label} ({orders.length})
            </h3>
             <div 
                ref={setNodeRef}
                className={cn(
                    "bg-muted/50 rounded-lg p-2 space-y-4 min-h-[400px] transition-colors flex-1 flex flex-col",
                    isOver && "bg-muted"
                )}
            >
                <SortableContext items={orders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                    {status === 'em_transito' ? (
                        routes.map(route => (
                            <RouteContainerCard 
                                key={route.id} 
                                route={route}
                                onDataRefresh={onDataRefresh}
                            >
                                {orders.filter(o => o.delivery.routeId === route.id).map(order => (
                                    <DeliveryCard key={order.id} order={order} />
                                ))}
                            </RouteContainerCard>
                        ))
                    ) : (
                        <div className="space-y-3">
                            {orders.map(order => (
                                <DeliveryCard key={order.id} order={order} />
                            ))}
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
}
