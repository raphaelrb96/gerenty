"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { getOrdersForCompanies } from "@/services/order-service";
import type { Order, OrderItem } from "@/lib/types";

import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/context/currency-context";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { BarChart, Users, Package } from "lucide-react";


function TopSellingProducts({ orders }: { orders: Order[] }) {
    const { formatCurrency } = useCurrency();

    const topProducts = useMemo(() => {
        const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

        orders.forEach(order => {
            if (order.status === 'completed') {
                order.items.forEach(item => {
                    if (!productSales[item.productId]) {
                        productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
                    }
                    productSales[item.productId].quantity += item.quantity;
                    productSales[item.productId].revenue += item.totalPrice;
                });
            }
        });

        return Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    }, [orders]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
                <CardDescription>Os 10 produtos mais vendidos no período selecionado.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-center">Quantidade Vendida</TableHead>
                            <TableHead className="text-right">Receita Gerada</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {topProducts.map((product) => (
                            <TableRow key={product.name}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-center">{product.quantity}</TableCell>
                                <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 {topProducts.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        Nenhum dado de venda para o período selecionado.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


export default function ReportsPage() {
    const { user } = useAuth();
    const { companies, activeCompany } = useCompany();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const companyIds = activeCompany ? [activeCompany.id] : companies.map(c => c.id);
                if (companyIds.length > 0) {
                    const fetchedOrders = await getOrdersForCompanies(companyIds);
                    setOrders(fetchedOrders);
                } else {
                    setOrders([]);
                }
            } catch (error) {
                console.error("Failed to fetch orders for reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [user, companies, activeCompany]);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (!dateRange?.from || !dateRange?.to) return true;
            const orderDate = new Date(order.createdAt as string);
            return orderDate >= startOfDay(dateRange.from) && orderDate <= endOfDay(dateRange.to);
        });
    }, [orders, dateRange]);


    return (
        <div className="space-y-8">
            <PageHeader
                title="Relatórios e Análises"
                description="Obtenha insights sobre o desempenho do seu negócio."
            />
            
            <Card>
                <CardContent className="p-4">
                    <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                </CardContent>
            </Card>

            <Tabs defaultValue="sales">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sales"><BarChart className="mr-2 h-4 w-4" />Vendas</TabsTrigger>
                    <TabsTrigger value="customers"><Users className="mr-2 h-4 w-4" />Clientes</TabsTrigger>
                    <TabsTrigger value="inventory"><Package className="mr-2 h-4 w-4" />Estoque</TabsTrigger>
                </TabsList>
                
                <TabsContent value="sales" className="mt-6">
                    {loading ? <LoadingSpinner /> : (
                        <div className="space-y-6">
                            <TopSellingProducts orders={filteredOrders} />
                             <Card>
                                <CardHeader><CardTitle>Desempenho por Vendedor</CardTitle></CardHeader>
                                <CardContent><p className="text-muted-foreground text-center py-8">Em breve.</p></CardContent>
                            </Card>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="customers" className="mt-6">
                     <Card>
                        <CardHeader><CardTitle>Análise de Clientes</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground text-center py-8">Em breve.</p></CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="inventory" className="mt-6">
                     <Card>
                        <CardHeader><CardTitle>Relatórios de Estoque</CardTitle></CardHeader>
                        <CardContent><p className="text-muted-foreground text-center py-8">Em breve.</p></CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
