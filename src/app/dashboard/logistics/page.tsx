
"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, CheckCircle, Hourglass, DollarSign, PlusCircle, Users, XCircle, Ban, Package, PackageCheck, Wallet, ArrowLeftRight, ListFilter, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { getRoutes, Route, Order } from "@/services/logistics-service";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useCurrency } from "@/context/currency-context";
import { subDays, format, eachDayOfInterval, startOfToday } from "date-fns";
import { EmptyState } from "@/components/common/empty-state";
import { DeliveriesKanbanBoard } from "@/components/logistics/deliveries-kanban-board";
import { getUnassignedOrders } from "@/services/order-service";
import { RouteManagement } from "@/components/logistics/route-management";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const StatCard = ({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description?: string }) => (
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

const chartColors = ['#22c55e', '#f97316', '#3b82f6', '#8b5cf6'];
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


export default function LogisticsPage() {
    const { effectiveOwnerId } = useAuth();
    const router = useRouter();
    const { formatCurrency } = useCurrency();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [unassignedOrders, setUnassignedOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogisticsData = async () => {
        if (!effectiveOwnerId) return;
        setLoading(true);
        try {
            const [userRoutes, pendingOrders] = await Promise.all([
                getRoutes(effectiveOwnerId),
                getUnassignedOrders([effectiveOwnerId]) // Simplified for now
            ]);
            setRoutes(userRoutes);
            setUnassignedOrders(pendingOrders);
        } catch (error) {
            console.error("Failed to fetch logistics data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (effectiveOwnerId) {
            fetchLogisticsData();
        } else {
            setLoading(false);
        }
    }, [effectiveOwnerId]);

    const activeRoutes = useMemo(() => routes.filter(r => r.status === 'em_andamento'), [routes]);
    
    const getInitials = (name: string) => {
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const metrics = useMemo(() => {
        const today = startOfToday();
        const startOfThisWeek = subDays(today, 6);

        const driversInRoute = new Set(activeRoutes.map(r => r.driverId)).size;
        
        const allActiveOrders = activeRoutes.flatMap(r => r.orders.map(o => ({...o, routeId: r.id})));
        
        const deliveriesInProgress = allActiveOrders.filter(o => o.status === 'out_for_delivery').length;
        const deliveriesCancelledInRoute = allActiveOrders.filter(o => o.status === 'cancelled').length;
        const totalCancelledValueInRoute = allActiveOrders
            .filter(o => o.status === 'cancelled')
            .reduce((sum, o) => sum + o.total, 0);

        const deliveriesReturnedInRoute = allActiveOrders.filter(o => o.status === 'returned').length;
        
        const cashReceivedInRoute = allActiveOrders
            .filter(o => o.delivery?.paymentStatus === 'pago' && o.delivery.paymentMethodReceived === 'dinheiro')
            .reduce((sum, o) => sum + o.total, 0);
        const cashInProgress = allActiveOrders
            .filter(o => o.status === 'out_for_delivery' && o.payment.method === 'dinheiro')
            .reduce((sum, o) => sum + o.total, 0);
        
        const otherPaymentsReceivedInRoute = allActiveOrders
            .filter(o => o.delivery?.paymentStatus === 'pago' && o.delivery.paymentMethodReceived && o.delivery.paymentMethodReceived !== 'dinheiro')
            .reduce((sum, o) => sum + o.total, 0);
        const otherPaymentsInProgress = allActiveOrders
            .filter(o => o.status === 'out_for_delivery' && o.payment.method !== 'dinheiro')
            .reduce((sum, o) => sum + o.total, 0);
        
        const totalToReceive = cashInProgress + otherPaymentsInProgress;
        const totalReceived = cashReceivedInRoute + otherPaymentsReceivedInRoute;

        const finishedRoutesToday = routes.filter(r => r.status === 'finalizada' && r.finishedAt && new Date(r.finishedAt as string) >= today).length;
        const finishedRoutesThisWeek = routes.filter(r => r.status === 'finalizada' && r.finishedAt && new Date(r.finishedAt as string) >= startOfThisWeek).length;
        
        const itemsToReturn = returnedOrders.flatMap(o => o.items).reduce((sum, item) => sum + item.quantity, 0);


        return {
            driversInRoute,
            deliveriesToProcess: unassignedOrders.length,
            deliveriesInProgress,
            deliveriesCancelledInRoute,
            totalCancelledValueInRoute,
            cashReceivedInRoute,
            cashInProgress,
            otherPaymentsReceivedInRoute,
            otherPaymentsInProgress,
            totalToReceive,
            totalReceived,
            finishedRoutesToday,
            finishedRoutesThisWeek,
            itemsToReturn,
            deliveriesReturnedInRoute
        };
    }, [activeRoutes, routes, unassignedOrders]);

    const chartData = useMemo(() => {
        const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
        const data = days.map(day => ({
            name: format(day, 'dd/MM'),
            Entregas: 0
        }));

        routes.forEach(route => {
             if (route.status === 'finalizada' && route.finishedAt) {
                const finishedDateStr = format(new Date(route.finishedAt as string), 'dd/MM');
                const dayData = data.find(d => d.name === finishedDateStr);
                if (dayData) {
                    dayData.Entregas += route.orders.filter(o => o.status === 'delivered').length;
                }
            }
        });
        return data;
    }, [routes]);
    
    const paymentDistributionData = useMemo(() => {
        const distribution = {
            Dinheiro: 0,
            Cartão: 0,
            Pix: 0,
            Online: 0,
        };
        activeRoutes.flatMap(r => r.orders).forEach(order => {
            if (order.status === 'out_for_delivery') {
                switch (order.payment.method) {
                    case 'dinheiro': distribution.Dinheiro++; break;
                    case 'credito': case 'debito': distribution.Cartão++; break;
                    case 'pix': distribution.Pix++; break;
                    default: distribution.Online++; break;
                }
            }
        });
        return Object.entries(distribution).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
    }, [activeRoutes]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
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
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="deliveries">Entregas</TabsTrigger>
                    <TabsTrigger value="routes">Rotas</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6 space-y-8">
                     <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-2">Operacional</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <StatCard title="Entregadores em Rota" value={metrics.driversInRoute} icon={<Truck className="text-muted-foreground" />} />
                                <StatCard title="Entregas a Processar" value={metrics.deliveriesToProcess} icon={<Hourglass className="text-blue-500" />} />
                                <StatCard title="Entregas em Andamento" value={metrics.deliveriesInProgress} icon={<Hourglass className="text-yellow-500" />} />
                            </div>
                        </div>

                         <div>
                            <h3 className="text-lg font-medium mb-2">Financeiro (Em Rota)</h3>
                             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <StatCard title="Total a Receber" value={formatCurrency(metrics.totalToReceive)} icon={<Wallet className="text-yellow-500" />} />
                                <StatCard title="Dinheiro a Receber" value={formatCurrency(metrics.cashInProgress)} icon={<DollarSign className="text-yellow-500" />} />
                                <StatCard title="Online a Receber" value={formatCurrency(metrics.otherPaymentsInProgress)} icon={<ArrowLeftRight className="text-yellow-500" />} />
                                <StatCard title="Total Recebido" value={formatCurrency(metrics.totalReceived)} icon={<Wallet className="text-green-500" />} />
                                <StatCard title="Dinheiro Recebido" value={formatCurrency(metrics.cashReceivedInRoute)} icon={<DollarSign className="text-green-500" />} />
                                <StatCard title="Online Recebido" value={formatCurrency(metrics.otherPaymentsReceivedInRoute)} icon={<ArrowLeftRight className="text-green-500" />} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium mb-2">Resultados e Alertas</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <StatCard title="Rotas Finalizadas (Hoje)" value={metrics.finishedRoutesToday} icon={<PackageCheck className="text-muted-foreground" />} description={`${metrics.finishedRoutesThisWeek} na semana`}/>
                                <StatCard title="Entregas Canceladas (em rota)" value={metrics.deliveriesCancelledInRoute} icon={<Ban className="text-red-500" />} description={formatCurrency(metrics.totalCancelledValueInRoute)}/>
                                <StatCard title="Itens para Devolução" value={metrics.itemsToReturn} icon={<Package className="text-orange-500" />} description={`${metrics.deliveriesReturnedInRoute} entregas devolvidas`}/>
                            </div>
                        </div>
                    </div>


                     <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Desempenho de Entregas</CardTitle>
                                <CardDescription>Entregas concluídas nos últimos 7 dias.</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <ChartContainer config={{ Entregas: { label: "Entregas", color: "hsl(var(--chart-1))" } }} className="h-[300px] w-full">
                                    <RechartsBarChart data={chartData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={10} allowDecimals={false} />
                                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                        <Bar dataKey="Entregas" fill="var(--color-Entregas)" radius={8} />
                                    </RechartsBarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-2">
                             <CardHeader>
                                <CardTitle>Distribuição de Pagamentos</CardTitle>
                                <CardDescription>Métodos de pagamento nas rotas ativas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {paymentDistributionData.length > 0 ? (
                                    <ChartContainer config={{}} className="h-[300px] w-full">
                                        <RechartsPieChart>
                                            <RechartsPieChart data={paymentDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={renderCustomizedLabel}>
                                                {paymentDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                                ))}
                                            </RechartsPieChart>
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Legend />
                                        </RechartsPieChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center">
                                        <EmptyState icon={<DollarSign className="h-12 w-12" />} title="Sem dados de pagamento" description="Não há rotas ativas com pagamentos para exibir." />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                     <Card>
                        <CardHeader>
                            <CardTitle>Painel de Rotas em Andamento</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                           {activeRoutes.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground">Nenhuma rota em andamento.</div>
                           ) : (
                               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
                                   {activeRoutes.map(route => {
                                        const onlineTotal = (route.cardTotal || 0) + (route.pixTotal || 0) + (route.onlineTotal || 0);
                                        return (
                                            <Card key={route.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/dashboard/logistics')}>
                                               <CardHeader className="flex flex-row items-center gap-4">
                                                    <Avatar>
                                                        <AvatarFallback>{getInitials(route.driverName)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{route.driverName}</p>
                                                        <p className="text-xs text-muted-foreground">{new Date(route.createdAt as string).toLocaleDateString()}</p>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-2 text-sm">
                                                     <div className="flex justify-between"><span>Entregas:</span> <strong>{route.orders.length}</strong></div>
                                                     <div className="flex justify-between"><span>Dinheiro:</span> <strong>{formatCurrency(route.cashTotal || 0)}</strong></div>
                                                     <div className="flex justify-between"><span>Online:</span> <strong>{formatCurrency(onlineTotal)}</strong></div>
                                                </CardContent>
                                            </Card>
                                        )
                                   })}
                               </div>
                           )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="deliveries" className="mt-4">
                     <DeliveriesKanbanBoard 
                        routes={routes} 
                        unassignedOrders={unassignedOrders} 
                        onDataRefresh={fetchLogisticsData}
                    />
                </TabsContent>

                <TabsContent value="routes" className="mt-4">
                     <RouteManagement 
                        routes={routes} 
                        onDataRefresh={fetchLogisticsData}
                     />
                </TabsContent>

            </Tabs>
        </div>
    );
}

    