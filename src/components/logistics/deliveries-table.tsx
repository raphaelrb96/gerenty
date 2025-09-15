
"use client";

import type { Order } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/context/currency-context";
import { EmptyState } from "../common/empty-state";
import { Package } from "lucide-react";

type DeliveriesTableProps = {
  orders: (Order & { driverName?: string })[];
};

export function DeliveriesTable({ orders }: DeliveriesTableProps) {
    const { formatCurrency } = useCurrency();

    if (orders.length === 0) {
        return (
            <div className="py-12">
                <EmptyState 
                    icon={<Package className="h-12 w-12" />}
                    title="Nenhuma entrega aqui"
                    description="Não há entregas com este status no momento."
                />
            </div>
        );
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Destino</TableHead>
                        <TableHead>Entregador</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.customer.name}</TableCell>
                            <TableCell className="text-muted-foreground">{order.shipping?.address?.city || 'N/A'}</TableCell>
                            <TableCell>
                                {order.driverName ? <Badge variant="outline">{order.driverName}</Badge> : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(order.total)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
