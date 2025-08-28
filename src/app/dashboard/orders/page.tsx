
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getOrders, getOrdersForCompanies, updateOrder } from "@/services/order-service";
import type { Order, OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { OrderDetails } from "@/components/orders/order-details";
import { File, MoreVertical, ShoppingCart, ChevronsUpDown, Building } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { EmptyState } from "@/components/common/empty-state";
import { useTranslation } from "@/context/i18n-context";
import { useCurrency } from "@/context/currency-context";
import { useCompany } from "@/context/company-context";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays, startOfDay, endOfDay } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";


function CompanySelector() {
    const { t } = useTranslation();
    const { companies, activeCompany, setActiveCompany } = useCompany();

    const getDisplayName = () => {
        if (!activeCompany) {
            return "Visão Geral de Todas as Empresas";
        }
        return activeCompany.name;
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                    <Building className="mr-2 h-4 w-4" />
                    <span className="truncate max-w-[200px]">{getDisplayName()}</span>
                    <ChevronsUpDown className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-full md:w-[300px]">
                <DropdownMenuItem onSelect={() => setActiveCompany(null)}>
                    Visão Geral de Todas as Empresas
                </DropdownMenuItem>
                {companies.map((company) => (
                    <DropdownMenuItem key={company.id} onSelect={() => setActiveCompany(company)}>
                        {company.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function OrdersPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { activeCompany, companies } = useCompany();
    const { formatCurrency } = useCurrency();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 29), to: new Date() });

    const fetchOrders = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            let userOrders: Order[] = [];
            if (activeCompany) {
                userOrders = await getOrders(activeCompany.id);
            } else if (companies.length > 0) {
                const companyIds = companies.map(c => c.id);
                userOrders = await getOrdersForCompanies(companyIds);
            }

            const filteredOrders = userOrders.filter(order => {
                const orderDate = new Date(order.createdAt as string);
                 if (dateRange?.from && dateRange?.to) {
                    return orderDate >= startOfDay(dateRange.from) && orderDate <= endOfDay(dateRange.to);
                }
                return true;
            });

            setOrders(filteredOrders);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


     useEffect(() => {
        if (user && companies) {
           fetchOrders();
        } else if (!user) {
            setLoading(false);
        }
    }, [user, activeCompany, companies, dateRange]);


    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsSheetOpen(true);
    }

    const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await updateOrder(orderId, { status: newStatus });
            // Update the local state to reflect the change immediately
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order.id === orderId ? { ...order, status: newStatus } : order
                )
            );
            toast({
                title: "Status Atualizado",
                description: `O pedido #${orderId.substring(0,7)} foi atualizado para "${t(`orderStatus.${newStatus}`)}".`
            });
        } catch (error) {
            console.error("Failed to update order status", error);
            toast({
                variant: "destructive",
                title: "Erro ao Atualizar",
                description: "Não foi possível atualizar o status do pedido."
            });
        }
    };
    
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
      />

       <Card>
            <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                <CompanySelector />
                <DateRangePicker date={dateRange} onDateChange={setDateRange} />
            </CardContent>
       </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg flex flex-col p-0">
            <OrderDetails 
                order={selectedOrder} 
                onStatusChange={handleUpdateStatus}
                onFinished={() => setIsSheetOpen(false)} 
            />
        </SheetContent>
      </Sheet>

      {orders.length === 0 ? (
        <EmptyState
            icon={<ShoppingCart className="h-16 w-16" />}
            title={t('ordersPage.empty.title')}
            description={!activeCompany ? "Selecione uma empresa para ver os pedidos ou veja todos." : t('ordersPage.empty.description')}
        />
      ) : (
        <div className="space-y-4">
            {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-x-4 gap-y-2">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>{order.customer.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">#{order.id.substring(0, 7)}</p>
                            <p className="text-sm text-muted-foreground truncate">{order.customer.name}</p>
                        </div>
                    </div>
                    
                    <div className="hidden md:flex md:justify-center">
                        <Badge variant="secondary" className={getStatusVariant(order.status)}>
                            {t(`orderStatus.${order.status}`)}
                        </Badge>
                    </div>

                    <div className="hidden md:block text-sm text-muted-foreground text-center">
                        {new Date(order.createdAt as string).toLocaleDateString()}
                    </div>
                    
                    <div className="hidden md:block text-right font-semibold">
                        {formatCurrency(order.total)}
                    </div>
                    
                    <div className="flex justify-end items-center gap-2 col-start-3 md:col-start-auto">
                        <div className="md:hidden text-right">
                             <p className="font-semibold">{formatCurrency(order.total)}</p>
                             <Badge variant="secondary" className={`mt-1 ${getStatusVariant(order.status)}`}>
                                {t(`orderStatus.${order.status}`)}
                            </Badge>
                        </div>
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
