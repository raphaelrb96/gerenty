

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
import { DELIVERY_KANBAN_STATUSES } from '@/lib/order-statuses';

type DeliveriesKanbanBoardProps = {
    allOrders: Order[];
    routes: Route[];
}

export function DeliveriesKanbanBoard({ allOrders, routes }: DeliveriesKanbanBoardProps) {
    const { t } = useTranslation();
    
    const ordersByStatus = useMemo(() => {
        const result: Record<string, Order[]> = {};
        DELIVERY_KANBAN_STATUSES.forEach(status => result[status] = []);
        
        allOrders.forEach(order => {
            if (result[order.status]) {
                result[order.status].push(order);
            }
        });
        
        return result;

    }, [allOrders]);
    
    return (
        <Accordion type="multiple" className="w-full space-y-4">
            {DELIVERY_KANBAN_STATUSES.map(status => {
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
                            <DeliveriesTable orders={orders} routes={routes} />
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
    );
}
