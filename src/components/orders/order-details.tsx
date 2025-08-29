
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import type { Order, OrderStatus } from "@/lib/types";
import { useTranslation } from "@/context/i18n-context";
import { useCurrency } from "@/context/currency-context";
import { ScrollArea } from "../ui/scroll-area";
import { SheetFooter, SheetHeader, SheetTitle } from "../ui/sheet";
import { useState } from "react";
import { Loader2, User, Truck, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type OrderDetailsProps = {
    order?: Order | null,
    onFinished: () => void;
    onStatusChange: (orderId: string, newStatus: OrderStatus) => Promise<void>;
}

const statuses: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "completed", "cancelled", "refunded"];

const getStatusVariant = (status: Order['status']) => {
    switch (status) {
        case 'completed':
        case 'delivered':
            return 'bg-green-600/20 text-green-700 hover:bg-green-600/30 border-green-600/30';
        case 'processing':
        case 'shipped':
        case 'confirmed':
            return 'bg-blue-600/20 text-blue-700 hover:bg-blue-600/30 border-blue-600/30';
        case 'pending':
            return 'bg-yellow-600/20 text-yellow-700 hover:bg-yellow-600/30 border-yellow-600/30';
        case 'cancelled':
        case 'refunded':
            return 'bg-red-600/20 text-red-700 hover:bg-red-600/30 border-red-600/30';
        default:
            return 'bg-gray-600/20 text-gray-700 hover:bg-gray-600/30 border-gray-600/30';
    }
}

export function OrderDetails({ order, onFinished, onStatusChange }: OrderDetailsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [currentStatus, setCurrentStatus] = useState(order?.status);
  const [isSaving, setIsSaving] = useState(false);
  
  if (!order) return null;

  const handleSave = async () => {
    if (currentStatus && currentStatus !== order.status) {
        setIsSaving(true);
        await onStatusChange(order.id, currentStatus);
        setIsSaving(false);
    }
    onFinished();
  };

  const handleNavigation = (path: string) => {
    onFinished();
    router.push(path);
  }

  return (
    <>
      <SheetHeader className="pr-6 pl-6 pt-6 flex-shrink-0">
          <SheetTitle>{t('orderDetails.orderId', { id: order.id.substring(0,7) })}</SheetTitle>
      </SheetHeader>
      <ScrollArea className="flex-1">
        <div className="space-y-6 py-4 px-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {order.customer.id && (
                    <Button variant="outline" size="sm" onClick={() => handleNavigation(`/dashboard/crm?customerId=${order.customer.id}`)}>
                        <User className="mr-2 h-4 w-4" /> Ver Cliente
                    </Button>
                )}
                 {order.shipping?.routeId && (
                    <Button variant="outline" size="sm" onClick={() => handleNavigation(`/dashboard/logistics?routeId=${order.shipping.routeId}`)}>
                        <Truck className="mr-2 h-4 w-4" /> Ver Logística
                    </Button>
                )}
                 {order.employeeId && (
                    <Button variant="outline" size="sm" onClick={() => handleNavigation(`/dashboard/team?employeeId=${order.employeeId}`)}>
                        <Handshake className="mr-2 h-4 w-4" /> Ver Vendedor
                    </Button>
                )}
            </div>

            <Separator />

            <div className="space-y-2">
                <p className="text-muted-foreground">{new Date(order.createdAt as string).toLocaleString()}</p>
            </div>
          
            <Separator />
            
            <div className="grid gap-4">
                <div className="font-semibold">{t('orderDetails.customerDetails')}</div>
                <dl className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">{t('orderDetails.customer')}</dt>
                        <dd>{order.customer.name}</dd>
                    </div>
                     <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">{t('orderDetails.email')}</dt>
                        <dd><a href={`mailto:${order.customer.email}`} className="text-primary hover:underline">{order.customer.email}</a></dd>
                    </div>
                     <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">{t('orderDetails.phone')}</dt>
                        <dd>{order.customer.phone || 'N/A'}</dd>
                    </div>
                </dl>
            </div>
            
            <Separator />
            
            <div className="grid gap-4">
                <div className="font-semibold">{t('orderDetails.orderSummary')}</div>
                 <dl className="grid gap-2 text-sm">
                    {order.items.map(item => (
                        <div key={item.productId} className="flex items-center justify-between">
                            <dt className="text-muted-foreground">{item.quantity}x {item.productName}</dt>
                            <dd>{formatCurrency(item.totalPrice)}</dd>
                        </div>
                    ))}
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">{t('orderDetails.subtotal')}</dt>
                        <dd>{formatCurrency(order.subtotal)}</dd>
                    </div>
                     <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">{t('orderDetails.shipping')}</dt>
                        <dd>{formatCurrency(order.shippingCost || 0)}</dd>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                        <dt>{t('orderDetails.total')}</dt>
                        <dd>{formatCurrency(order.total)}</dd>
                    </div>
                </dl>
            </div>

            <Separator />

            <div className="grid gap-4">
                <div className="font-semibold">{t('orderDetails.updateStatus')}</div>
                 <Select value={currentStatus} onValueChange={(value) => setCurrentStatus(value as OrderStatus)}>
                    <SelectTrigger className={cn(currentStatus && getStatusVariant(currentStatus))}>
                        <SelectValue placeholder={t('orderDetails.selectStatus')} />
                    </SelectTrigger>
                    <SelectContent>
                        {statuses.map(status => (
                            <SelectItem key={status} value={status}>{t(`orderStatus.${status}`)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </ScrollArea>
      <SheetFooter className="border-t pt-4 p-6 flex-shrink-0">
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onFinished}>{t('orderDetails.close')}</Button>
            <Button type="button" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('orderDetails.updateOrder')}
            </Button>
        </div>
      </SheetFooter>
    </>
  );
}
