

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

const statuses: OrderStatus[] = ['processing', 'out_for_delivery', 'delivered', 'returned', 'cancelled'];


export function DeliveriesKanbanBoard({ routes, unassignedOrders, onDataRefresh }: DeliveriesKanbanBoardProps) {
    const { t } = useTranslation();

    const statusConfig: Record<OrderStatus, { label: string }> = {
        'processing': { label: t('orderStatus.processing') },
        'out_for_delivery': { label: t('orderStatus.out_for_delivery') },
        'delivered': { label: t('orderStatus.delivered') },
        'cancelled': { label: t('orderStatus.cancelled') },
        'returned': { label: t('orderStatus.returned')},
        'pending': { label: t('orderStatus.pending')},
        'confirmed': { label: t('orderStatus.confirmed') },
        'completed': { label: t('orderStatus.completed') },
        'refunded': { label: t('orderStatus.refunded') },
    }

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
        
        // 1. Start with all unassigned orders, which are 'processing'
        result['processing'] = [...unassignedOrders];

        // 2. Process all orders from all routes
        const allOrdersInRoutes = routes.flatMap(route => 
            route.orders.map(order => ({ ...order, driverName: route.driverName }))
        );

        // 3. Group all orders by their current status
        allOrdersInRoutes.forEach(order => {
             if (order.status && result[order.status]) {
                result[order.status].push(order);
            }
        });
        
        return result;

    }, [routes, unassignedOrders]);
    
    return (
        <Accordion type="multiple" defaultValue={['processing', 'out_for_delivery']} className="w-full space-y-4">
            {statuses.map(status => {
                const orders = ordersByStatus[status] || [];
                return (
                    <AccordionItem value={status} key={status} className="border rounded-lg bg-card">
                        <AccordionTrigger className="px-4 py-3 text-lg font-medium hover:no-underline">
                           <div className='flex items-center gap-2'>
                             {statusConfig[status]?.label || status}
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
