
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
    allOrders: Order[];
    routes: Route[];
}

const deliveryStatuses: OrderStatus[] = ['processing', 'out_for_delivery', 'delivered', 'returned', 'cancelled'];


export function DeliveriesKanbanBoard({ allOrders, routes }: DeliveriesKanbanBoardProps) {
    const { t } = useTranslation();
    
    const ordersByStatus = useMemo(() => {
        const result: Record<string, (Order & { driverName?: string })[]> = {};
        deliveryStatuses.forEach(status => result[status] = []);

        const routeDriverMap = new Map<string, string>();
        routes.forEach(route => {
            route.orders.forEach(order => {
                routeDriverMap.set(order.id, route.driverName);
            });
        });

        allOrders.forEach(order => {
            const status = order.status;
            if (result[status]) {
                const driverName = routeDriverMap.get(order.id);
                result[status].push({ ...order, driverName });
            }
        });
        
        return result;

    }, [allOrders, routes]);
    
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

    