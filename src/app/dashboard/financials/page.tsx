
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { getFinancialData, FinancialData } from "@/services/financial-service";
import { DateRange } from "react-day-picker";
import { subDays, startOfDay, endOfDay } from "date-fns";

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

export default function FinancialsPage() {
    const { user } = useAuth();
    const { activeCompany, companies } = useCompany();
    const { formatCurrency } = useCurrency();
    const [financialData, setFinancialData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(true);

    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 29),
        to: new Date(),
    });
    const [activeFilter, setActiveFilter] = useState<string>('30d');

    useEffect(() => {
        const fetchFinancials = async () => {
            if (!user || !dateRange?.from || !dateRange?.to) return;
            setLoading(true);
            try {
                const companyIds = activeCompany ? [activeCompany.id] : companies.map(c => c.id);
                if (companyIds.length > 0) {
                    const data = await getFinancialData(companyIds, dateRange.from, dateRange.to);
                    setFinancialData(data);
                } else {
                    setFinancialData(null);
                }
            } catch (error) {
                console.error("Failed to fetch financial data:", error);
                setFinancialData(null);
            } finally {
                setLoading(false);
            }
        };

        if (user && companies) {
           fetchFinancials();
        }
    }, [user, activeCompany, companies, dateRange]);
    
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
    
    const revenueChartData = financialData?.revenueByPeriod.map(d => ({ name: d.period, Receita: d.total })) || [];

    return (
        <div className="space-y-8">
            <PageHeader
                title="Painel Financeiro"
                description="Uma visão completa da saúde financeira do seu negócio."
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
                <StatCard title="Receita Líquida" value={formatCurrency(financialData?.netRevenue || 0)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Lucro Bruto" value={formatCurrency(financialData?.grossProfit || 0)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Custos Totais" value={formatCurrency(financialData?.totalCosts || 0)} icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Ticket Médio" value={formatCurrency(financialData?.averageTicket || 0)} icon={<BarChart className="h-4 w-4 text-muted-foreground" />} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Visão Geral de Receita</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                     <ChartContainer config={{}} className="h-[350px] w-full">
                        <RechartsBarChart data={revenueChartData}>
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
