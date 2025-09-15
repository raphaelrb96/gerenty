

"use client";

import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, CheckCircle, Hourglass, DollarSign, PlusCircle, Users, XCircle, Ban, Package, PackageCheck, Wallet, ArrowLeftRight, ListFilter, User } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Bar, BarChart as RechartsBarChart, Pie, PieChart as RechartsPieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useCurrency } from "@/context/currency-context";
import { subDays, format, eachDayOfInterval, startOfToday } from "date-fns";
import { EmptyState } from "@/components/common/empty-state";
import { DeliveriesKanbanBoard } from "@/components/logistics/deliveries-kanban-board";
import { RouteManagement } from "@/components/logistics/route-management";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "@/context/i18n-context";
import { Order, Route } from "@/lib/types";
import { getRoutes } from "@/services/logistics-service";
import { getOrdersForCompanies } from "@/services/order-service";

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
    const { companies } = useCompany();
    const router = useRouter();
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();
    const [routes, setRoutes] = useState<Route[]>([]);
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogisticsData = async () => {
        if (!effectiveOwnerId) return;
        setLoading(true);
        try {
            const companyIds = companies.map(c => c.id);
            const [userRoutes, companyOrders] = await Promise.all([
                getRoutes(effectiveOwnerId),
                companyIds.length > 0 ? getOrdersForCompanies(companyIds) : Promise.resolve([]),
            ]);
            setRoutes(userRoutes);
            setAllOrders(companyOrders);
        } catch (error) {
            console.error("Failed to fetch logistics data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (effectiveOwnerId && companies.length > 0) {
            fetchLogisticsData();
        } else if (!effectiveOwnerId) {
            setLoading(false);
        }
    }, [effectiveOwnerId, companies]);

    const activeRoutes = useMemo(() => routes.filter(r => r.status === 'em_andamento'), [routes]);
    
    const deliverableOrders = useMemo(() => {
        return allOrders.filter(order => {
             const isDeliverable = order.shipping?.method !== 'retirada_loja';
             const isNotCompleted = order.status !== 'completed';
             return isDeliverable && isNotCompleted;
        });
    }, [allOrders]);

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
        
        const finishedRoutesToday = routes.filter(r => r.status === 'finalizada' && r.finishedAt && new Date(r.finishedAt as string) >= today).length;
        const finishedRoutesThisWeek = routes.filter(r => r.status === 'finalizada' && r.finishedAt && new Date(r.finishedAt as string) >= startOfThisWeek).length;

        const allOrdersInSystem = routes.flatMap(r => r.orders);
        
        const deliveriesCancelledInRoute = allActiveOrders.filter(o => o.status === 'cancelled').length;
        const totalCancelledValueInRoute = allActiveOrders
            .filter(o => o.status === 'cancelled')
            .reduce((sum, o) => sum + o.total, 0);

        const returnedOrders = allOrdersInSystem.filter(o => o.status === 'returned');
        const deliveriesReturnedInRoute = returnedOrders.length;
        const itemsToReturn = returnedOrders.flatMap(o => o.items).reduce((sum, item) => sum + item.quantity, 0);
        
        const deliveriesToProcess = deliverableOrders.filter(o => o.status === 'processing').length;
        
        // Financial Metrics
        const cashReceivedInRoute = allActiveOrders
            .filter(o => o.payment?.status === 'aprovado' && o.payment.method === 'dinheiro')
            .reduce((sum, o) => sum + o.total, 0);

        const otherPaymentsReceivedInRoute = allActiveOrders
            .filter(o => o.payment?.status === 'aprovado' && o.payment.method !== 'dinheiro')
            .reduce((sum, o) => sum + o.total, 0);

        const cashInProgress = allActiveOrders
            .filter(o => o.status === 'out_for_delivery' && o.payment.method === 'dinheiro' && o.payment.status !== 'aprovado')
            .reduce((sum, o) => sum + o.total, 0);

        const otherPaymentsInProgress = allActiveOrders
            .filter(o => o.status === 'out_for_delivery' && o.payment.method !== 'dinheiro' && o.payment.status !== 'aprovado')
            .reduce((sum, o) => sum + o.total, 0);
        
        const totalToReceive = cashInProgress + otherPaymentsInProgress;
        const totalReceived = cashReceivedInRoute + otherPaymentsReceivedInRoute;

        return {
            driversInRoute,
            deliveriesToProcess,
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
    }, [activeRoutes, routes, deliverableOrders]);

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
        const distribution: Record<string, number> = {
            Dinheiro: 0,
            Cartão: 0,
            Pix: 0,
            Online: 0,
        };
        activeRoutes.flatMap(r => r.orders).forEach(order => {
            if (order.status === 'out_for_delivery') {
                const methodName = t(`paymentMethods.${order.payment.method.toLowerCase()}`);
                if (distribution[methodName] !== undefined) {
                    distribution[methodName]++;
                } else {
                     switch (order.payment.method) {
                        case 'credito': case 'debito': distribution['Cartão']++; break;
                        default: distribution['Online']++; break;
                    }
                }
            }
        });
        return Object.entries(distribution).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
    }, [activeRoutes, t]);

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            <PageHeader 
                title={t('logistics.title')}
                description={t('logistics.description')}
                action={
                    <Button onClick={() => router.push('/dashboard/logistics/create')}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t('logistics.newRoute')}
                    </Button>
                }
            />

            <Tabs defaultValue="dashboard">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dashboard">{t('logistics.tabs.dashboard')}</TabsTrigger>
                    <TabsTrigger value="deliveries">{t('logistics.tabs.deliveries')}</TabsTrigger>
                    <TabsTrigger value="routes">{t('logistics.tabs.routes')}</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="mt-6 space-y-8">
                     <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-2">{t('logistics.operational.title')}</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <StatCard title={t('logistics.operational.driversInRoute')} value={metrics.driversInRoute} icon={<Truck className="text-muted-foreground" />} />
                                <StatCard title={t('logistics.operational.deliveriesToProcess')} value={metrics.deliveriesToProcess} icon={<Hourglass className="text-blue-500" />} />
                                <StatCard title={t('logistics.operational.deliveriesInProgress')} value={metrics.deliveriesInProgress} icon={<Hourglass className="text-yellow-500" />} />
                            </div>
                        </div>

                         <div>
                            <h3 className="text-lg font-medium mb-2">{t('logistics.financial.title')}</h3>
                             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <StatCard title={t('logistics.financial.totalToReceive')} value={formatCurrency(metrics.totalToReceive)} icon={<Wallet className="text-yellow-500" />} />
                                <StatCard title={t('logistics.financial.cashToReceive')} value={formatCurrency(metrics.cashInProgress)} icon={<DollarSign className="text-yellow-500" />} />
                                <StatCard title={t('logistics.financial.onlineToReceive')} value={formatCurrency(metrics.otherPaymentsInProgress)} icon={<ArrowLeftRight className="text-yellow-500" />} />
                                <StatCard title={t('logistics.financial.totalReceived')} value={formatCurrency(metrics.totalReceived)} icon={<Wallet className="text-green-500" />} />
                                <StatCard title={t('logistics.financial.cashReceived')} value={formatCurrency(metrics.cashReceivedInRoute)} icon={<DollarSign className="text-green-500" />} />
                                <StatCard title={t('logistics.financial.onlineReceived')} value={formatCurrency(metrics.otherPaymentsReceivedInRoute)} icon={<ArrowLeftRight className="text-green-500" />} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-medium mb-2">{t('logistics.results.title')}</h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <StatCard title={t('logistics.results.routesFinishedToday')} value={metrics.finishedRoutesToday} icon={<PackageCheck className="text-muted-foreground" />} description={`${metrics.finishedRoutesThisWeek} ${t('logistics.results.inTheWeek')}`}/>
                                <StatCard title={t('logistics.results.cancelledDeliveries')} value={metrics.deliveriesCancelledInRoute} icon={<Ban className="text-red-500" />} description={formatCurrency(metrics.totalCancelledValueInRoute)}/>
                                <StatCard title={t('logistics.results.itemsToReturn')} value={metrics.itemsToReturn} icon={<Package className="text-orange-500" />} description={`${metrics.deliveriesReturnedInRoute} ${t('logistics.results.returnedDeliveries')}`}/>
                            </div>
                        </div>
                    </div>


                     <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>{t('logistics.charts.performance.title')}</CardTitle>
                                <CardDescription>{t('logistics.charts.performance.description')}</CardDescription>
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
                                <CardTitle>{t('logistics.charts.payment.title')}</CardTitle>
                                <CardDescription>{t('logistics.charts.payment.description')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {paymentDistributionData.length > 0 ? (
                                    <ChartContainer config={{}} className="h-[300px] w-full">
                                        <RechartsPieChart>
                                            <Pie data={paymentDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={renderCustomizedLabel}>
                                                {paymentDistributionData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<ChartTooltipContent />} />
                                            <Legend />
                                        </RechartsPieChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center">
                                        <EmptyState icon={<DollarSign className="h-12 w-12" />} title={t('logistics.charts.payment.empty.title')} description={t('logistics.charts.payment.empty.description')} />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                     <Card>
                        <CardHeader>
                            <CardTitle>{t('logistics.routesInProgress')}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                           {activeRoutes.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground">{t('logistics.noRoutesInProgress')}</div>
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
                                                     <div className="flex justify-between"><span>{t('logistics.deliveries')}:</span> <strong>{route.orders.length}</strong></div>
                                                     <div className="flex justify-between"><span>{t('logistics.cash')}:</span> <strong>{formatCurrency(route.cashTotal || 0)}</strong></div>
                                                     <div className="flex justify-between"><span>{t('logistics.online')}:</span> <strong>{formatCurrency(onlineTotal)}</strong></div>
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
                        allOrders={deliverableOrders}
                        routes={routes}
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

    

    


    