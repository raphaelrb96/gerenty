
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
        const result: Record<string, (Order & { driverName?: string })[]> = {};
        deliveryStatuses.forEach(status => result[status] = []);

        // 1. Group unassigned orders (they are 'processing' by default)
        result['processing'] = [...unassignedOrders];

        // 2. Process all orders that are part of any route
        routes.forEach(route => {
            route.orders.forEach(order => {
                const status = order.status;
                if (result[status]) {
                    result[status].push({ ...order, driverName: route.driverName });
                }
            });
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

    