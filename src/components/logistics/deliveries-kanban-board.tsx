
"use client";

import type { Route, Order, DeliveryStatus } from '@/lib/types';
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

const statuses: DeliveryStatus[] = ['a_processar', 'em_transito', 'entregue', 'cancelada'];

const statusConfig: Record<DeliveryStatus, { label: string }> = {
    'a_processar': { label: 'A Processar' },
    'em_transito': { label: 'Em Trânsito' },
    'entregue': { label: 'Entregue' },
    'cancelada': { label: 'Cancelada' },
    'devolvida': { label: 'Devolvida' }, // Mantido para config mas não será usado no render
}


export function DeliveriesKanbanBoard({ routes, unassignedOrders, onDataRefresh }: DeliveriesKanbanBoardProps) {

    const ordersByStatus = useMemo(() => {
        const result: Record<DeliveryStatus, (Order & { driverName?: string })[]> = {
            'a_processar': [],
            'em_transito': [],
            'entregue': [],
            'cancelada': [],
            'devolvida': [],
        };
        
        // Populate unassigned orders
        result['a_processar'] = [...unassignedOrders];

        // Populate orders from routes
        routes.forEach(route => {
            route.orders.forEach(order => {
                if (order.delivery.status && result[order.delivery.status]) {
                    result[order.delivery.status].push({ ...order, driverName: route.driverName });
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
