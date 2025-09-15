

"use client";

import type { Route, Order, OrderStatus } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DeliveriesTable } from './deliveries-table';
import { Badge } from '../ui/badge';
import { useMemo } from 'react';

type DeliveriesKanbanBoardProps = {
    routes: Route[];
    unassignedOrders: Order[];
    onDataRefresh: () => void;
}

const statuses: OrderStatus[] = ['processing', 'out_for_delivery', 'delivered', 'cancelled'];

const statusConfig: Record<OrderStatus, { label: string }> = {
    'processing': { label: 'A Processar' },
    'out_for_delivery': { label: 'Em Trânsito' },
    'delivered': { label: 'Entregue' },
    'cancelled': { label: 'Cancelada' },
    'pending': { label: 'Pendente'},
    'confirmed': { label: 'Confirmado' },
    'completed': { label: 'Completo' },
    'refunded': { label: 'Reembolsado' },
    'returned': { label: 'Devolvido'},
}


export function DeliveriesKanbanBoard({ routes, unassignedOrders, onDataRefresh }: DeliveriesKanbanBoardProps) {

    const ordersByStatus = useMemo(() => {
        const result: Record<OrderStatus, (Order & { driverName?: string })[]> = {
            'pending': [],
            'confirmed': [],
            'processing': [],
            'out_for_delivery': [],
            'delivered': [],
            'completed': [],
            'cancelled': [],
            'refunded': [],
            'returned': [],
        };
        
        // Populate unassigned orders (which are in 'processing' state)
        result['processing'] = [...unassignedOrders];

        // Populate orders from routes
        routes.forEach(route => {
            route.orders.forEach(order => {
                if (order.status && result[order.status]) {
                    result[order.status].push({ ...order, driverName: route.driverName });
                }
            });
        });
        
        return result;

    }, [routes, unassignedOrders]);
    
    return (
        <Accordion type="multiple" className="w-full space-y-4">
            {statuses.map(status => {
                const orders = ordersByStatus[status] || [];
                return (
                    <AccordionItem value={status} key={status} className="border rounded-lg bg-card">
                        <AccordionTrigger className="px-4 py-3 text-lg font-medium hover:no-underline">
                           <div className='flex items-center gap-2'>
                             {statusConfig[status].label}
                             <Badge variant="secondary">{orders.length}</Badge>
                           </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                            <DeliveriesTable orders={orders} />
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
}
