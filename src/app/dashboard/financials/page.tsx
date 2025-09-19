
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { getFinancialData, FinancialData } from "@/services/financial-service";
import { DateRange } from "react-day-picker";
import { subDays, startOfDay, endOfDay } from "date-fns";

import { PageHeader } from "@/components/common/page-header";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useCurrency } from "@/context/currency-context";
import { DollarSign, TrendingUp, TrendingDown, Receipt, PlusCircle, Shield, LayoutGrid, ListChecks, FilePieChart, Percent, Activity } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { usePermissions } from "@/context/permissions-context";
import { EmptyState } from "@/components/common/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const StatCard = ({ title, value, icon, description }: { title: string, value: string, icon: React.ReactNode, description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

function FinancialsDashboardTab() {
    const { effectiveOwnerId } = useAuth();
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
            if (!effectiveOwnerId || !dateRange?.from || !dateRange?.to) return;
            setLoading(true);
            try {
                const companyIds = activeCompany ? [activeCompany.id] : companies.map(c => c.id);
                if (companyIds.length > 0) {
                    const data = await getFinancialData(effectiveOwnerId, companyIds, dateRange.from, dateRange.to);
                    setFinancialData(data);
                } else {
                    setFinancialData(null); // No companies to fetch data for
                }
            } catch (error) {
                console.error("Failed to fetch financial data:", error);
                setFinancialData(null); // Reset data on error
            } finally {
                setLoading(false);
            }
        };

        if (effectiveOwnerId && companies !== undefined) {
           fetchFinancials();
        }
    }, [effectiveOwnerId, activeCompany, companies, dateRange]);
    
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

    if (!financialData) {
         return <EmptyState icon={<DollarSign />} title="Sem Dados Financeiros" description="Não há dados financeiros para o período ou empresa selecionada."/>;
    }


    return (
        <div className="space-y-6">
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
                <StatCard title="Faturamento" value={formatCurrency(financialData.revenue)} icon={<Receipt className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Lucro Bruto" value={formatCurrency(financialData.grossProfit)} icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Despesas" value={formatCurrency(financialData.totalExpenses)} icon={<TrendingDown className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Lucro Líquido" value={formatCurrency(financialData.netProfit)} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Margem de Lucro" value={`${financialData.profitMargin.toFixed(2)}%`} icon={<Percent className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="Ticket Médio" value={formatCurrency(financialData.averageTicket)} icon={<Activity className="h-4 w-4 text-muted-foreground" />} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Desempenho Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                     <ChartContainer config={{}} className="h-[350px] w-full">
                        <RechartsBarChart data={financialData.performanceByPeriod}>
                             <CartesianGrid vertical={false} />
                            <XAxis dataKey="period" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => formatCurrency(Number(value))} />
                            <ChartTooltip 
                                cursor={false} 
                                content={<ChartTooltipContent 
                                    formatter={(value, name) => `${name}: ${formatCurrency(Number(value))}`}
                                    labelClassName="text-sm font-bold"
                                />}
                            />
                            <Bar dataKey="Receita" fill="hsl(var(--chart-2))" radius={4} name="Receita"/>
                            <Bar dataKey="Custos" fill="hsl(var(--chart-4))" radius={4} name="Custos" />
                            <Bar dataKey="Lucro" fill="hsl(var(--chart-1))" radius={4} name="Lucro" />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Distribuição de Despesas</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={{}} className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={financialData.expenseDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                         {financialData.expenseDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltipContent formatter={(value, name) => `${name}: ${formatCurrency(Number(value))}`} />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                     <CardHeader>
                        <CardTitle>Top 5 Produtos por Lucro</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={{}} className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsBarChart layout="vertical" data={financialData.topProductsByProfit} margin={{ left: 20 }}>
                                    <CartesianGrid horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={120} />
                                    <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
                                    <Bar dataKey="profit" fill="hsl(var(--chart-1))" radius={4} name="Lucro" />
                                </RechartsBarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export default function FinancialsPage() {
    const { hasAccess } = usePermissions();

    if (!hasAccess('financials')) {
        return (
            <div className="flex items-center justify-center h-full">
                <EmptyState
                    icon={<Shield className="h-16 w-16" />}
                    title="Acesso Negado"
                    description="Você não tem permissão para acessar o módulo financeiro."
                />
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <PageHeader
                title="Módulo Financeiro"
                description="Uma visão 360 graus da saúde financeira do seu negócio."
            />
             <Tabs defaultValue="dashboard">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dashboard"><LayoutGrid className="mr-2 h-4 w-4" />Dashboard</TabsTrigger>
                    <TabsTrigger value="transactions"><ListChecks className="mr-2 h-4 w-4" />Transações</TabsTrigger>
                    <TabsTrigger value="reports"><FilePieChart className="mr-2 h-4 w-4" />Relatórios</TabsTrigger>
                </TabsList>
                <TabsContent value="dashboard" className="mt-6">
                    <FinancialsDashboardTab />
                </TabsContent>
                <TabsContent value="transactions" className="mt-6">
                    <div className="space-y-4">
                        <PageHeader
                            title="Gestão de Contas e Transações"
                            description="Gerencie suas contas a pagar e a receber."
                            action={
                                <Button onClick={() => {}}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Adicionar Transação
                                </Button>
                            }
                        />
                        <Card>
                            <CardContent className="p-16 text-center text-muted-foreground">
                                Funcionalidade em breve.
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="reports" className="mt-6">
                     <PageHeader
                        title="Relatórios Detalhados e Análises"
                        description="Gere relatórios complexos para obter insights sobre o negócio."
                    />
                     <div className="mt-8">
                        <Card>
                            <CardContent className="p-16 text-center text-muted-foreground">
                                Funcionalidade em breve.
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
