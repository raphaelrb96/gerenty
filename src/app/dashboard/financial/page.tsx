
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { getOrdersForCompanies } from "@/services/order-service";
import type { Order } from "@/lib/types";
import { DateRange } from "react-day-picker";
import { subDays, startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";

import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useCurrency } from "@/context/currency-context";
import { DollarSign, ShoppingCart, TrendingUp, BarChart } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export default function FinancialPage() {
    const { user } = useAuth();
    const { activeCompany, companies } = useCompany();
    const { formatCurrency } = useCurrency();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    const [activeFilter, setActiveFilter] = useState<string>('30d');


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
                console.error("Failed to fetch orders for financial page:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && companies) {
           fetchOrders();
        }
    }, [user, activeCompany, companies]);

    const filteredData = useMemo(() => {
        const ordersInDateRange = orders.filter(order => {
            const orderDate = new Date(order.createdAt as string);
            if (dateRange?.from && dateRange?.to) {
                return orderDate >= startOfDay(dateRange.from) && orderDate <= endOfDay(dateRange.to);
            }
            return true;
        });

        const completedOrders = ordersInDateRange.filter(o => o.status === 'completed');
        const netRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
        const totalCost = completedOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + (item.costPrice || 0) * item.quantity, 0), 0);
        const grossProfit = netRevenue - totalCost;
        const averageTicket = completedOrders.length > 0 ? netRevenue / completedOrders.length : 0;
        
        const revenueChartData: { name: string, Receita: number }[] = [];
        if (dateRange?.from && dateRange?.to) {
            const revenueByDay: { [key: string]: number } = {};
            
            eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).forEach(day => {
                revenueByDay[format(day, 'yyyy-MM-dd')] = 0;
            });
    
            completedOrders.forEach(order => {
                const dateStr = format(new Date(order.createdAt as string), 'yyyy-MM-dd');
                if (revenueByDay.hasOwnProperty(dateStr)) {
                    revenueByDay[dateStr] += order.total;
                }
            });

            revenueChartData.push(...Object.entries(revenueByDay).map(([date, total]) => ({
                name: format(new Date(date), 'dd/MM'),
                Receita: total,
            })));
        }

        return {
            netRevenue,
            totalCost,
            grossProfit,
            averageTicket,
            revenueChartData,
        };

    }, [orders, dateRange]);
    
    const handleDateFilterClick = (filter: string) => {
        setActiveFilter(filter);
        const today = new Date();
        switch (filter) {
            case 'today':
                setDateRange({ from: startOfDay(today), to: endOfDay(today) });
                break;
            case '7d':
                setDateRange({ from: startOfDay(subDays(today, 6)), to: endOfDay(today) });
                break;
            case '30d':
                setDateRange({ from: startOfDay(subDays(today, 29)), to: endOfDay(today) });
                break;
        }
    };


    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-8">
            <PageHeader
                title="Painel Financeiro"
                description="Uma visão geral da saúde financeira do seu negócio."
            />

            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
                     <DateRangePicker date={dateRange} onDateChange={(range) => { setDateRange(range); setActiveFilter(''); }} />
                     <div className="flex items-center gap-2">
                        <Button variant={activeFilter === 'today' ? 'default' : 'outline'} onClick={() => handleDateFilterClick('today')}>Hoje</Button>
                        <Button variant={activeFilter === '7d' ? 'default' : 'outline'} onClick={() => handleDateFilterClick('7d')}>7 Dias</Button>
                        <Button variant={activeFilter === '30d' ? 'default' : 'outline'} onClick={() => handleDateFilterClick('30d')}>30 Dias</Button>
                     </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Receita Líquida" value={formatCurrency(filteredData.netRevenue)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Lucro Bruto" value={formatCurrency(filteredData.grossProfit)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Custo dos Produtos" value={formatCurrency(filteredData.totalCost)} icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Ticket Médio" value={formatCurrency(filteredData.averageTicket)} icon={<BarChart className="h-4 w-4 text-muted-foreground" />} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Visão Geral de Receita</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                     <ChartContainer config={{}} className="h-[350px] w-full">
                        <RechartsBarChart data={filteredData.revenueChartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => formatCurrency(Number(value))} />
                            <ChartTooltip 
                                cursor={false} 
                                content={<ChartTooltipContent 
                                    formatter={(value) => formatCurrency(Number(value))}
                                    labelClassName="text-sm font-bold"
                                />}
                            />
                            <Bar dataKey="Receita" fill="hsl(var(--primary))" radius={4} />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
