
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getOrders, getOrdersForCompanies, updateOrder } from "@/services/order-service";
import type { Order, OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { OrderDetails } from "@/components/orders/order-details";
import { File, MoreVertical, ShoppingCart, ChevronsUpDown, Building, Filter } from "lucide-react";
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
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_ORDER_STATUSES } from "@/lib/order-statuses";


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
                <Button variant="outline" className="w-full justify-between">
                    <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        <span className="truncate max-w-[250px]">{getDisplayName()}</span>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width)]">
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
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");


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
                if (!order.createdAt) return false;

                // Date filter
                const orderDate = new Date(order.createdAt as string);
                const isDateInRange = dateRange?.from && dateRange?.to
                    ? orderDate >= startOfDay(dateRange.from) && orderDate <= endOfDay(dateRange.to)
                    : true;
                
                // Status filter
                const isStatusMatch = statusFilter === 'all' || order.status === statusFilter;

                return isDateInRange && isStatusMatch;
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
    }, [user, activeCompany, companies, dateRange, statusFilter]);


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
            case 'out_for_delivery':
                return 'bg-blue-600/20 text-blue-700 hover:bg-blue-600/30';
            case 'pending':
                return 'bg-yellow-600/20 text-yellow-700 hover:bg-yellow-600/30';
            case 'cancelled':
            case 'refunded':
            case 'returned':
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
            <CardContent className="p-4 flex flex-col md:flex-row flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[240px]"><CompanySelector /></div>
                <div className="flex-1 min-w-[240px]"><DateRangePicker date={dateRange} onDateChange={setDateRange} className="w-full" /></div>
                <div className="flex-1 min-w-[240px]">
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filtrar por status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            {ALL_ORDER_STATUSES.map(status => (
                                <SelectItem key={status} value={status}>
                                    {t(`orderStatus.${status}`)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
       </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="p-4 sm:max-w-lg flex flex-col">
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
            description={!activeCompany ? "Selecione uma empresa para ver os pedidos ou veja todos." : "Nenhum pedido encontrado com os filtros selecionados."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewDetails(order)}>
                    <CardHeader className="flex flex-row items-start justify-between p-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border">
                                <AvatarFallback>{order.customer.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">#{order.id.substring(0, 7)}</CardTitle>
                                <p className="text-sm text-muted-foreground">{order.customer.name}</p>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onSelect={() => handleViewDetails(order)}>
                                    Ver Detalhes
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0 border-t flex justify-between text-sm">
                       <div className="flex flex-col items-center">
                            <span className="text-muted-foreground text-xs">Status</span>
                             <Badge variant="secondary" className={`mt-1 ${getStatusVariant(order.status)}`}>
                                {t(`orderStatus.${order.status}`)}
                            </Badge>
                       </div>
                       <div className="flex flex-col items-center">
                            <span className="text-muted-foreground text-xs">Data</span>
                            <span className="font-medium mt-1">
                                {order.createdAt ? new Date(order.createdAt as string).toLocaleString() : 'N/A'}
                            </span>
                       </div>
                       <div className="flex flex-col items-center">
                            <span className="text-muted-foreground text-xs">Total</span>
                            <span className="font-bold text-base mt-1">{formatCurrency(order.total)}</span>
                       </div>
                    </CardFooter>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
