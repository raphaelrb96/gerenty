
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, CheckCircle, Hourglass, DollarSign, PlusCircle } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getRoutes, Route } from "@/services/logistics-service";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/logistics/kanban-board";
import { useRouter } from "next/navigation";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
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

    const metrics = {
        totalRoutes: routes.length,
        completedRoutes: routes.filter(r => r.status === 'Entregue').length,
        pendingRoutes: routes.filter(r => r.status !== 'Entregue' && r.status !== 'Outro').length,
        totalRevenue: routes.filter(r => r.status === 'Entregue').reduce((acc, r) => acc + r.totalValue, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    };

    const chartData = [
        { name: "Jan", total: Math.floor(Math.random() * 20) + 5 },
        { name: "Fev", total: Math.floor(Math.random() * 20) + 5 },
        { name: "Mar", total: Math.floor(Math.random() * 20) + 5 },
        { name: "Abr", total: Math.floor(Math.random() * 20) + 5 },
        { name: "Mai", total: Math.floor(Math.random() * 20) + 5 },
        { name: "Jun", total: Math.floor(Math.random() * 20) + 5 },
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
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard title="Total de Rotas" value={metrics.totalRoutes} icon={<Truck className="text-muted-foreground" />} />
                        <StatCard title="Rotas Concluídas" value={metrics.completedRoutes} icon={<CheckCircle className="text-muted-foreground" />} />
                        <StatCard title="Rotas Pendentes" value={metrics.pendingRoutes} icon={<Hourglass className="text-muted-foreground" />} />
                        <StatCard title="Rendimento Total" value={metrics.totalRevenue} icon={<DollarSign className="text-muted-foreground" />} />
                    </div>
                     <Card>
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
                </TabsContent>

                <TabsContent value="management" className="mt-4">
                    <KanbanBoard routes={routes} setRoutes={setRoutes} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
