
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getOrders } from "@/services/order-service";
import type { Order } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { OrderDetails } from "@/components/orders/order-details";
import { File, MoreVertical, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { useTranslation } from "@/context/i18n-context";
import { useCurrency } from "@/context/currency-context";

export default function OrdersPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { formatCurrency } = useCurrency();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

     useEffect(() => {
        if (user) {
            fetchOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const userOrders = await getOrders(user.uid);
            setOrders(userOrders);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsSheetOpen(true);
    }
    
    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'completed':
            case 'delivered':
                return 'bg-green-600/20 text-green-700 hover:bg-green-600/30';
            case 'processing':
            case 'shipped':
            case 'confirmed':
                return 'bg-blue-600/20 text-blue-700 hover:bg-blue-600/30';
            case 'pending':
                return 'bg-yellow-600/20 text-yellow-700 hover:bg-yellow-600/30';
            case 'cancelled':
            case 'refunded':
                return 'bg-red-600/20 text-red-700 hover:bg-red-600/30';
            default:
                return 'bg-gray-600/20 text-gray-700 hover:bg-gray-600/30';
        }
    }


    if (loading) {
        return <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>;
    }

  return (
    <div className="space-y-4">
      <PageHeader 
        title={t('ordersPage.title')}
        description={t('ordersPage.description')}
        action={
             <Button variant="outline">
                <File className="mr-2 h-4 w-4" /> {t('ordersPage.export')}
            </Button>
        }
      />

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t('ordersPage.orderDetails')}</SheetTitle>
          </SheetHeader>
          <OrderDetails order={selectedOrder} onFinished={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {orders.length === 0 ? (
        <EmptyState
            icon={<ShoppingCart className="h-16 w-16" />}
            title={t('ordersPage.empty.title')}
            description={t('ordersPage.empty.description')}
        />
      ) : (
        <div className="space-y-4">
            {orders.map((order) => (
            <Card key={order.id}>
                <CardContent className="p-4 grid grid-cols-2 md:grid-cols-5 items-center gap-4">
                    <div className="md:col-span-1">
                        <p className="font-medium">#{order.id.substring(0, 7)}</p>
                        <p className="text-sm text-muted-foreground">{order.customer.name}</p>
                    </div>
                    <div className="md:col-span-1 flex justify-start md:justify-center">
                        <Badge variant="secondary" className={getStatusVariant(order.status)}>
                            {t(`orderStatus.${order.status}`)}
                        </Badge>
                    </div>
                    <div className="md:col-span-1 text-left md:text-center text-sm text-muted-foreground">
                        {new Date(order.createdAt as string).toLocaleDateString()}
                    </div>
                    <div className="md:col-span-1 text-left md:text-right font-semibold">
                        {formatCurrency(order.total)}
                    </div>
                    <div className="flex md:col-span-1 justify-end items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)}>
                        {t('ordersPage.detailsButton')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            ))}
        </div>
      )}
    </div>
  );
}
