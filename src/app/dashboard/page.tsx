
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DollarSign, Package, ShoppingCart, ArrowRight, TrendingUp, BarChart, FileText, ChevronsUpDown, Building, Calendar, Users, History, AlertCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState, useMemo } from "react";
import { getOrders, getOrdersForCompanies } from "@/services/order-service";
import { getProductsByUser } from "@/services/product-service";
import type { Order, Product, OrderItem } from "@/lib/types";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useTranslation } from "@/context/i18n-context";
import { useCurrency } from "@/context/currency-context";
import { useCompany } from "@/context/company-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { subDays, startOfDay, endOfDay, eachDayOfInterval, eachHourOfInterval, format, differenceInDays, differenceInCalendarDays, parseISO } from "date-fns";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";


function CompanySelector() {
    const { t } = useTranslation();
    const { companies, activeCompany, setActiveCompany } = useCompany();

    const getDisplayName = () => {
        if (!activeCompany) {
            return "Visão Geral de Todas as Empresas";
        }
        return activeCompany.name;
    };

    if (companies.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-4">
                        <Building className="h-8 w-8 text-muted-foreground" />
                        <div>
                             <h2 className="font-semibold">{t('dashboard.noCompanySelected.title')}</h2>
                             <p className="text-sm text-muted-foreground">{t('dashboard.noCompanySelected.description')}</p>
                        </div>
                        <Button asChild className="ml-auto">
                            <Link href="/dashboard/companies/create">{t('dashboard.createCompany')}</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }


    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                          <div className="p-3 rounded-md bg-muted">
                              <Building className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                              <p className="text-xs text-muted-foreground">{t('dashboard.activeCompany')}</p>
                              <h2 className="text-lg font-bold">{getDisplayName()}</h2>
                          </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="outline">
                                      {t('dashboard.switchCompany')}
                                      <ChevronsUpDown className="ml-2 h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
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
                           <Button variant="secondary" asChild>
                               <Link href="/dashboard/companies">
                                  {t('dashboard.viewAllCompanies')}
                              </Link>
                          </Button>
                      </div>
                    </div>
                    <div className="flex-shrink-0 self-start md:self-center">
                         <Button asChild size="lg" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                             <Link href="/dashboard/pos">
                                Frente de Caixa <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

const AccountStatCard = ({ icon, title, value, detail, warning }: { icon: React.ReactNode, title: string, value: string, detail: string, warning?: boolean }) => (
    <Card>
        <CardContent className="p-4 flex items-center gap-4">
            <div className={cn("p-3 rounded-md bg-muted", warning && "bg-destructive/20")}>
                {React.cloneElement(icon as React.ReactElement, { className: cn("h-6 w-6 text-muted-foreground", warning && "text-destructive")})}
            </div>
            <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-lg font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{detail}</p>
            </div>
        </CardContent>
    </Card>
);

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, userData } = useAuth();
  const { activeCompany, companies } = useCompany();
  const { formatCurrency } = useCurrency();
  
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultDateRange = { from: subDays(new Date(), 29), to: new Date() };
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [activeFilter, setActiveFilter] = useState<string>('30d');


  useEffect(() => {
    async function fetchData() {
        if (!user) {
            setLoading(false);
            setAllOrders([]);
            setAllProducts([]);
            return;
        }

        setLoading(true);
        try {
            const userProducts = await getProductsByUser(user.uid);
            setAllProducts(userProducts);

            const companyIds = activeCompany ? [activeCompany.id] : companies.map(c => c.id);
            if (companyIds.length === 0 && !activeCompany) {
                setAllOrders([]);
                return;
            };

            const ordersResults = await getOrdersForCompanies(companyIds);
            setAllOrders(ordersResults);

        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    }

    if (user && companies) {
       fetchData();
    }
  }, [user, activeCompany, companies]);

  const filteredData = useMemo(() => {
    const ordersInDateRange = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt as string);
        if (dateRange?.from && dateRange?.to) {
            return orderDate >= startOfDay(dateRange.from) && orderDate <= endOfDay(dateRange.to);
        }
        return true;
    });

    const completedOrders = ordersInDateRange.filter(o => o.status === 'completed');
    const cancelledOrders = ordersInDateRange.filter(o => o.status === 'cancelled');

    const totalRevenue = completedOrders.reduce((acc, order) => acc + order.total, 0);
    const totalCost = completedOrders.reduce((acc, order) => acc + (order.items.reduce((itemAcc, item) => itemAcc + (item.costPrice || 0) * item.quantity, 0)), 0);
    const totalProfit = totalRevenue - totalCost;
    const paidOrdersCount = completedOrders.length;
    const averageTicket = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;
    const itemsSoldCount = completedOrders.reduce((acc, order) => acc + order.items.length, 0);

    const cancelledRevenue = cancelledOrders.reduce((acc, order) => acc + order.total, 0);
    const cancelledOrdersCount = cancelledOrders.length;

    const topProducts = ordersInDateRange
        .flatMap(o => o.items)
        .reduce((acc, item) => {
            const existing = acc.find(p => p.productId === item.productId);
            if (existing) {
                existing.quantity += item.quantity;
                existing.totalPrice += item.totalPrice;
            } else {
                acc.push({ ...item });
            }
            return acc;
        }, [] as OrderItem[])
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    
    let revenueChartData: { name: string, Total: number }[] = [];
    if (dateRange?.from && dateRange?.to) {
        const diff = differenceInDays(dateRange.to, dateRange.from);

        if (diff <= 1) { // Today or Yesterday
            const intervalStart = startOfDay(dateRange.from);
            const intervalEnd = endOfDay(dateRange.from);
            const revenueByHour: { [key: string]: number } = {};
            
            eachHourOfInterval({ start: intervalStart, end: intervalEnd }).forEach(hour => {
                revenueByHour[format(hour, 'HH:00')] = 0;
            });
            
            ordersInDateRange.forEach(order => {
                const hourStr = format(new Date(order.createdAt as string), 'HH:00');
                if (revenueByHour.hasOwnProperty(hourStr)) {
                    revenueByHour[hourStr] += order.total;
                }
            });
            revenueChartData = Object.entries(revenueByHour).map(([hour, total]) => ({ name: hour, Total: total }));

        } else { // 7 days, 30 days, or custom range
            const revenueByDay: { [key: string]: number } = {};
            let intervalStart = dateRange.from;
            if (diff < 6) {
                 const daysToAdd = 6 - diff;
                 intervalStart = subDays(dateRange.from, daysToAdd);
            }
    
            eachDayOfInterval({ start: intervalStart, end: dateRange.to }).forEach(day => {
                revenueByDay[format(day, 'yyyy-MM-dd')] = 0;
            });
    
            ordersInDateRange.forEach(order => {
                const dateStr = format(new Date(order.createdAt as string), 'yyyy-MM-dd');
                if (revenueByDay.hasOwnProperty(dateStr)) {
                    revenueByDay[dateStr] += order.total;
                }
            });

            revenueChartData = Object.entries(revenueByDay)
                .map(([date, total]) => ({
                    name: format(new Date(date), 'dd/MM'),
                    Total: total
                }))
                .sort((a,b) => {
                    const dateA = new Date(a.name.split('/').reverse().join('-') + `-${new Date().getFullYear()}`);
                    const dateB = new Date(b.name.split('/').reverse().join('-') + `-${new Date().getFullYear()}`);
                    return dateA.getTime() - dateB.getTime();
                });
        }
    }
        
    return {
        totalRevenue,
        totalProfit,
        paidOrdersCount,
        averageTicket,
        totalCost,
        itemsSoldCount,
        cancelledRevenue,
        cancelledOrdersCount,
        totalSales: ordersInDateRange.length,
        topProducts,
        totalRegisteredProducts: allProducts.length,
        revenueChartData,
    };
}, [allOrders, allProducts, dateRange]);

    const handleDateFilterClick = (filter: string) => {
        setActiveFilter(filter);
        const today = new Date();
        switch (filter) {
            case 'today':
                setDateRange({ from: startOfDay(today), to: endOfDay(today) });
                break;
            case 'yesterday':
                const yesterday = subDays(today, 1);
                setDateRange({ from: startOfDay(yesterday), to: endOfDay(yesterday) });
                break;
            case '7d':
                setDateRange({ from: startOfDay(subDays(today, 6)), to: endOfDay(today) });
                break;
            case '30d':
                setDateRange({ from: startOfDay(subDays(today, 29)), to: endOfDay(today) });
                break;
        }
    };
  
    const daysUntilExpiry = userData?.validityDate
    ? differenceInCalendarDays(parseISO(userData.validityDate as string), new Date())
    : null;

  const stats = [
    { title: "Receita Total", value: formatCurrency(filteredData.totalRevenue), icon: <DollarSign /> },
    { title: "Lucro Total", value: formatCurrency(filteredData.totalProfit), icon: <TrendingUp /> },
    { title: "Pedidos Pagos", value: `+${filteredData.paidOrdersCount}`, icon: <ShoppingCart /> },
    { title: "Ticket Médio", value: formatCurrency(filteredData.averageTicket), icon: <FileText /> },
    { title: "Custo Total", value: formatCurrency(filteredData.totalCost), icon: <DollarSign className="opacity-50"/> },
    { title: "Itens Vendidos", value: `${filteredData.itemsSoldCount}`, icon: <Package /> },
    { title: "Receita Cancelada", value: formatCurrency(filteredData.cancelledRevenue), icon: <XCircle className="text-red-500" /> },
    { title: "Cancelamentos", value: `${filteredData.cancelledOrdersCount}`, icon: <AlertCircle className="text-red-500" /> },
    { title: "Vendas", value: `+${filteredData.totalSales}`, icon: <BarChart /> },
  ];
  
  if (loading) {
    return <div className="flex h-full items-center justify-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-headline text-3xl font-bold">{t('Dashboard')}</h1>
      </div>

      <CompanySelector />
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AccountStatCard 
                icon={<Package />}
                title="Produtos"
                value={`${filteredData.totalRegisteredProducts} / ${userData?.plan?.limits?.products ?? '∞'}`}
                detail="Cadastrados vs Limite do plano"
            />
             <AccountStatCard 
                icon={<Calendar />}
                title="Assinatura"
                value={daysUntilExpiry !== null ? `${daysUntilExpiry} dias` : "Vitalício"}
                detail={userData?.validityDate ? `Vence em ${new Date(userData.validityDate as string).toLocaleDateString()}` : `Plano ${userData?.plan?.name}`}
                warning={daysUntilExpiry !== null && daysUntilExpiry < 7}
            />
             <AccountStatCard 
                icon={<Building />}
                title="Empresas"
                value={`${companies.length} / ${userData?.plan?.limits?.companies ?? '∞'}`}
                detail="Criadas vs Limite do plano"
            />
             <AccountStatCard 
                icon={<History />}
                title="Pedidos"
                value={`${allOrders.length} / ${userData?.plan?.limits?.ordersPerMonth ?? '∞'}`}
                detail="Pedidos no ciclo vs Limite do plano"
            />
        </div>

      <Card>
          <CardHeader>
              <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
              <DateRangePicker date={dateRange} onDateChange={(range) => { setDateRange(range); setActiveFilter(''); }} />
              <Button variant={activeFilter === 'today' ? 'default' : 'outline'} onClick={() => handleDateFilterClick('today')}>Hoje</Button>
              <Button variant={activeFilter === 'yesterday' ? 'default' : 'outline'} onClick={() => handleDateFilterClick('yesterday')}>Ontem</Button>
              <Button variant={activeFilter === '7d' ? 'default' : 'outline'} onClick={() => handleDateFilterClick('7d')}>7 dias</Button>
              <Button variant={activeFilter === '30d' ? 'default' : 'outline'} onClick={() => handleDateFilterClick('30d')}>30 dias</Button>
          </CardContent>
      </Card>


      {(activeCompany || companies.length > 0) && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.map(stat => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

        <div className="grid grid-cols-1 gap-4">
            <Card className="col-span-1">
                <CardHeader>
                    <CardTitle>Visão Geral da Receita</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ChartContainer config={{}} className="min-h-[200px] w-full">
                        <RechartsBarChart accessibilityLayer data={filteredData.revenueChartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => formatCurrency(Number(value))} />
                            <ChartTooltip 
                                cursor={false} 
                                content={<ChartTooltipContent 
                                    formatter={(value) => formatCurrency(Number(value))}
                                    labelClassName="text-sm font-bold text-accent-foreground"
                                />}
                            />
                            <Bar dataKey="Total" fill="hsl(var(--primary))" radius={4} />
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card className="col-span-1">
                 <CardHeader>
                    <CardTitle>Produtos Mais Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-center">Vendas</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.topProducts.map(product => (
                                <TableRow key={product.productId}>
                                    <TableCell className="font-medium">{product.productName}</TableCell>
                                    <TableCell className="text-center">{product.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(product.totalPrice)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        </>
      )}
    </div>
  );
}
