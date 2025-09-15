
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
import { useTranslation } from '@/context/i18n-context';

type DeliveriesKanbanBoardProps = {
    routes: Route[];
    unassignedOrders: Order[];
    onDataRefresh: () => void;
}

// All relevant statuses for the logistics/delivery flow
const deliveryStatuses: OrderStatus[] = ['processing', 'out_for_delivery', 'delivered', 'returned', 'cancelled'];


export function DeliveriesKanbanBoard({ routes, unassignedOrders, onDataRefresh }: DeliveriesKanbanBoardProps) {
    const { t } = useTranslation();

    const ordersByStatus = useMemo(() => {
        // Initialize an object to hold arrays of orders for each status.
        const result: Record<string, (Order & { driverName?: string })[]> = {};
        deliveryStatuses.forEach(status => result[status] = []);

        // 1. Start with all unassigned orders, which are in the 'processing' state.
        result['processing'] = [...unassignedOrders];

        // 2. Process all orders that are part of a route.
        const allOrdersInRoutes = routes.flatMap(route => 
            route.orders.map(order => ({ ...order, driverName: route.driverName }))
        );

        // 3. Group these orders by their current status.
        allOrdersInRoutes.forEach(order => {
             if (order.status && result[order.status]) {
                result[order.status].push(order);
            }
        });
        
        return result;

    }, [routes, unassignedOrders]);
    
    return (
        <Accordion type="multiple" className="w-full space-y-4">
            {deliveryStatuses.map(status => {
                const orders = ordersByStatus[status] || [];
                return (
                    <AccordionItem value={status} key={status} className="border rounded-lg bg-card">
                        <AccordionTrigger className="px-4 py-3 text-lg font-medium hover:no-underline">
                           <div className='flex items-center gap-2'>
                             {t(`orderStatus.${status}`)}
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
