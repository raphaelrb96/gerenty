
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, CheckCircle, Hourglass, DollarSign, PlusCircle, Users, XCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getRoutes, Route } from "@/services/logistics-service";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/logistics/kanban-board";
import { useRouter } from "next/navigation";
import { Bar, BarChart as RechartsBarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
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

export default function LogisticsPage() {
    const { effectiveOwnerId } = useAuth();
    const router = useRouter();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRoutes = async () => {
        if (!effectiveOwnerId) return;
        setLoading(true);
        try {
            const userRoutes = await getRoutes(effectiveOwnerId);
            setRoutes(userRoutes);
        } catch (error) {
            console.error("Failed to fetch routes", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (effectiveOwnerId) {
            fetchRoutes();
        } else {
            setLoading(false);
        }
    }, [effectiveOwnerId]);

    const driversInRoute = new Set(routes.filter(r => r.status === 'a_caminho').map(r => r.driverId)).size;
    const deliveriesInProgress = routes.filter(r => r.status === 'a_caminho').reduce((acc, r) => acc + r.orders.length, 0);
    const deliveriesCompleted = routes.filter(r => r.status === 'entregue').reduce((acc, r) => acc + r.orders.length, 0);
    const deliveriesCancelled = routes.filter(r => r.status === 'cancelado').reduce((acc, r) => acc + r.orders.length, 0);
    const totalCashInRoute = routes.filter(r => r.status === 'a_caminho').reduce((acc, r) => acc + (r.totalCashInRoute || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


    const chartData = [
        { name: "Jan", total: Math.floor(Math.random() * 20) + 5 },
        { name: "Fev", total: Math.floor(Math.random() * 20) + 5 },
        { name: "Mar", total: Math.floor(Math.random() * 20) + 5 },
        { name: "Abr", total: Math.floor(Math.random() * 20) + 5 },
        { name: "Mai", total: Math.floor(Math.random() * 20) + 5 },
        { name: "Jun", total: Math.floor(Math.random() * 20) + 5 },
    ];
    
    const pieChartData = [
        { name: 'A Processar', value: routes.filter(r => r.status === 'a_processar').length, fill: 'var(--color-blue)' },
        { name: 'A Caminho', value: routes.filter(r => r.status === 'a_caminho').length, fill: 'var(--color-yellow)' },
        { name: 'Entregue', value: routes.filter(r => r.status === 'entregue').length, fill: 'var(--color-green)' },
        { name: 'Cancelado', value: routes.filter(r => r.status === 'cancelado').length, fill: 'var(--color-red)' },
    ]

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-4">
            <PageHeader 
                title="Logística e Entregas"
                description="Acompanhe e gerencie o fluxo de suas entregas."
                action={
                    <Button onClick={() => router.push('/dashboard/logistics/create')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Rota
                    </Button>
                }
            />

            <Tabs defaultValue="dashboard">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="management">Gestão de Rotas</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-4 space-y-4">
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <StatCard title="Total de Rotas" value={routes.length} icon={<Truck className="text-muted-foreground" />} />
                        <StatCard title="Entregadores em Rota" value={driversInRoute} icon={<Users className="text-muted-foreground" />} />
                        <StatCard title="Entregas em Andamento" value={deliveriesInProgress} icon={<Hourglass className="text-muted-foreground" />} />
                        <StatCard title="Entregas Concluídas" value={deliveriesCompleted} icon={<CheckCircle className="text-muted-foreground" />} />
                        <StatCard title="Entregas Canceladas" value={deliveriesCancelled} icon={<XCircle className="text-muted-foreground" />} />
                        <StatCard title="Dinheiro em Rota" value={totalCashInRoute} icon={<DollarSign className="text-muted-foreground" />} />
                    </div>
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Desempenho de Entregas</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <ChartContainer config={{ total: { label: "Rotas", color: "hsl(var(--chart-1))" } }} className="h-[250px] w-full">
                                    <RechartsBarChart data={chartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={10} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <Bar dataKey="total" fill="var(--color-total)" radius={8} />
                                    </RechartsBarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>Distribuição por Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={{}} className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label />
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="management" className="mt-4">
                    <KanbanBoard routes={routes} setRoutes={setRoutes} onRouteUpdate={fetchRoutes} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
