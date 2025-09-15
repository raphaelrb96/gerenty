
"use client";

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from '@dnd-kit/core';
import type { Route, Order, DeliveryStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { updateDeliveryStatus } from '@/services/logistics-service';
import { DeliveryColumn } from './delivery-column';
import { DeliveryCard } from './delivery-card';
import { RouteContainerCard } from './route-container-card';


type DeliveriesKanbanBoardProps = {
    routes: Route[];
    unassignedOrders: Order[];
    onDataRefresh: () => void;
}

const statuses: DeliveryStatus[] = ['a_processar', 'em_transito', 'entregue', 'devolvida', 'cancelada'];

export function DeliveriesKanbanBoard({ routes, unassignedOrders, onDataRefresh }: DeliveriesKanbanBoardProps) {
    const { toast } = useToast();
    const [activeOrder, setActiveOrder] = useState<Order | null>(null);

    const ordersInTransit = routes.flatMap(r => r.orders.map(o => ({...o, driverName: r.driverName})));

    const getOrdersForStatus = (status: DeliveryStatus) => {
        if (status === 'a_processar') {
            return unassignedOrders;
        }
        return ordersInTransit.filter(o => o.delivery.status === status);
    }
    
    const handleDragStart = (event: any) => {
        if (event.active.data.current?.type === 'Delivery') {
            setActiveOrder(event.active.data.current.order);
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        setActiveOrder(null);
        const { active, over } = event;

        if (!over || active.id === over.id) return;
        
        const isDelivery = active.data.current?.type === 'Delivery';
        const order = active.data.current?.order as Order;

        if (isDelivery && order) {
            const targetStatus = over.data.current?.status as DeliveryStatus;
            const targetRouteId = over.data.current?.routeId as string;

            if (targetStatus && targetStatus !== order.delivery.status) {
                 try {
                    await updateDeliveryStatus(order.id, targetStatus, targetRouteId);
                    toast({ title: `Entrega #${order.id.substring(0,5)} movida para ${targetStatus}` });
                    onDataRefresh();
                 } catch (error) {
                    toast({ variant: 'destructive', title: 'Erro ao mover entrega' });
                 }
            }
        }
    };

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
                {statuses.map(status => (
                    <DeliveryColumn
                        key={status}
                        status={status}
                        orders={getOrdersForStatus(status)}
                        routes={routes.filter(r => r.status === 'em_andamento')}
                        onDataRefresh={onDataRefresh}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeOrder ? <DeliveryCard order={activeOrder} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}
