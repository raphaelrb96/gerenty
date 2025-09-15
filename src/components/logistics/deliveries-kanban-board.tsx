
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

    const ordersInTransit = routes.flatMap(r => r.orders.map(o => ({...o, driverName: r.driverName})));

    const getOrdersForStatus = (status: DeliveryStatus) => {
        if (status === 'a_processar') {
            return unassignedOrders;
        }
        return ordersInTransit.filter(o => o.delivery.status === status);
    }
    
    return (
        <Accordion type="multiple" className="w-full space-y-4">
            {statuses.map(status => {
                const orders = getOrdersForStatus(status);
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
