
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
import { DollarSign, Package, ShoppingCart, ArrowRight, TrendingUp, BarChart, FileText, ChevronsUpDown, Building, Calendar, Users, History, AlertCircle, XCircle, RotateCcw, Hourglass, Percent, HandCoins, CreditCard, Truck, Repeat, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState, useMemo } from "react";
import { getOrders, getOrdersForCompanies } from "@/services/order-service";
import { getProductsByUser } from "@/services/product-service";
import { getRoutes } from "@/services/logistics-service";
import type { Order, Product, OrderItem, Route } from "@/lib/types";
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";


function CompanySelector() {
    const { t } = useTranslation();
    const { companies, activeCompany, setActiveCompany } = useCompany();
    const { userData } = useAuth();
    const isCompanyOwner = userData?.role === 'empresa';

    const getDisplayName = () => {
        if (!activeCompany) {
            return t('dashboard.allCompanies');
        }
        return activeCompany.name;
    };

    if (companies.length === 0 && isCompanyOwner) {
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
                                    {t('dashboard.allCompanies')}
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
                                {t('dashboard.posButton')} <ArrowRight className="ml-2 h-4 w-4" />
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
  const { user, userData, effectiveOwnerId } = useAuth();
  const { activeCompany, companies, loading: companyLoading } = useCompany();
  const { formatCurrency } = useCurrency();
  
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allRoutes, setAllRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultDateRange = { from: subDays(new Date(), 29), to: new Date() };
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [activeFilter, setActiveFilter] = useState<string>('30d');


  useEffect(() => {
    async function fetchData() {
        if (!effectiveOwnerId || companyLoading) {
            return;
        }

        setLoading(true);
        try {
            const [userProducts, userOrders, userRoutes] = await Promise.all([
                getProductsByUser(effectiveOwnerId),
                getOrdersForCompanies(activeCompany ? [activeCompany.id] : companies.map(c => c.id)),
                getRoutes(effectiveOwnerId)
            ]);
            setAllProducts(userProducts);
            setAllOrders(userOrders);
            setAllRoutes(userRoutes);

        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    }

    if (effectiveOwnerId && companies !== undefined) {
       fetchData();
    }
  }, [effectiveOwnerId, activeCompany, companies, companyLoading]);

  const filteredData = useMemo(() => {
    const ordersInDateRange = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt as string);
        if (dateRange?.from && dateRange?.to) {
            return orderDate >= startOfDay(dateRange.from) && orderDate <= endOfDay(dateRange.to);
        }
        return true;
    });

    const routesInDateRange = allRoutes.filter(route => {
        if (!route.finishedAt) return false;
        const finishedDate = new Date(route.finishedAt as string);
         if (dateRange?.from && dateRange?.to) {
            return finishedDate >= startOfDay(dateRange.from) && finishedDate <= endOfDay(dateRange.to);
        }
        return true;
    });

    const completedOrders = ordersInDateRange.filter(o => o.status === 'completed');
    const cancelledOrders = ordersInDateRange.filter(o => o.status === 'cancelled' || o.status === 'returned');
    const refundedOrders = ordersInDateRange.filter(o => o.status === 'refunded');
    const pendingOrders = ordersInDateRange.filter(o => !['completed', 'cancelled', 'returned', 'refunded'].includes(o.status));
    const exchangeReturnOrders = ordersInDateRange.filter(o => o.status === 'exchange' || o.status === 'return');
    
    // Revenue & Profit
    const totalRevenue = completedOrders.reduce((acc, order) => acc + order.total, 0);
    const totalCost = completedOrders.reduce((acc, order) => acc + (order.items.reduce((itemAcc, item) => itemAcc + (item.costPrice || 0) * item.quantity, 0)), 0);
    const totalCommissions = completedOrders.reduce((acc, order) => acc + (order.commission || 0), 0);
    const totalShippingCost = routesInDateRange.reduce((acc, route) => acc + (route.finalizationDetails?.driverFinalPayment || 0), 0);
    const totalProfit = totalRevenue - totalCost - totalCommissions - totalShippingCost;
    
    // Order Counts
    const paidOrdersCount = completedOrders.length;
    const cancelledOrdersCount = cancelledOrders.length;
    
    // Averages
    const averageTicket = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0;
    const averageProfitPerOrder = paidOrdersCount > 0 ? totalProfit / paidOrdersCount : 0;
    
    // Items
    const itemsSoldCount = completedOrders.reduce((acc, order) => acc + order.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0);
    const averageProfitPerItem = itemsSoldCount > 0 ? totalProfit / itemsSoldCount : 0;

    // Costs
    const averageCostPerSale = paidOrdersCount > 0 ? (totalCost + totalCommissions + totalShippingCost) / paidOrdersCount : 0;

    // Cancelled & Refunded
    const cancelledRevenue = cancelledOrders.reduce((acc, order) => acc + order.total, 0);
    const refundedRevenue = refundedOrders.reduce((acc, order) => acc + order.total, 0);
    
    // Pending
    const pendingRevenue = pendingOrders.reduce((acc, order) => acc + order.total, 0);
    
    // Payments
    const cashReceived = completedOrders.filter(o => o.payment.method === 'dinheiro').reduce((sum, o) => sum + o.total, 0);
    const cashToReceive = pendingOrders.filter(o => o.payment.method === 'dinheiro').reduce((sum, o) => sum + o.total, 0);
    const accountReceived = completedOrders.filter(o => o.payment.method !== 'dinheiro').reduce((sum, o) => sum + o.total, 0);
    const accountToReceive = pendingOrders.filter(o => o.payment.method !== 'dinheiro').reduce((sum, o) => sum + o.total, 0);


    const topProducts = ordersInDateRange
        .filter(o => !['cancelled', 'refunded', 'returned'].includes(o.status))
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
            
            completedOrders.forEach(order => {
                const hourStr = format(new Date(order.createdAt as string), 'HH:00');
                if (revenueByHour.hasOwnProperty(hourStr)) {
                    revenueByHour[hourStr] += order.total;
                }
            });
            revenueChartData = Object.entries(revenueByHour).map(([hour, total]) => ({ name: hour, Total: total }));

        } else { // 7 days, 30 days, or custom range
            const revenueByDay: { [key: string]: number } = {};
            let intervalStart = dateRange.from;
            // Pad to at least 7 days for better visualization if range is small
            if (diff < 6) {
                 const daysToAdd = 6 - diff;
                 intervalStart = subDays(dateRange.from, daysToAdd);
            }
    
            eachDayOfInterval({ start: intervalStart, end: dateRange.to }).forEach(day => {
                revenueByDay[format(day, 'yyyy-MM-dd')] = 0;
            });
    
            completedOrders.forEach(order => {
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
                    // Correctly sort dates like '28/07', '29/07'
                    const [dayA, monthA] = a.name.split('/').map(Number);
                    const [dayB, monthB] = b.name.split('/').map(Number);
                    if (monthA !== monthB) return monthA - monthB;
                    return dayA - dayB;
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
        refundedRevenue,
        pendingRevenue,
        pendingOrdersCount: pendingOrders.length,
        topProducts,
        totalRegisteredProducts: allProducts.length,
        revenueChartData,
        exchangeReturnOrdersCount: exchangeReturnOrders.length,
        totalCommissions,
        totalShippingCost, // delivery payment
        averageProfitPerOrder,
        averageProfitPerItem,
        averageCostPerSale,
        cashReceived,
        cashToReceive,
        accountReceived,
        accountToReceive,
    };
}, [allOrders, allProducts, allRoutes, dateRange]);

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
        { title: t('dashboard.stats.totalRevenue'), value: formatCurrency(filteredData.totalRevenue), icon: <DollarSign /> },
        { title: t('dashboard.stats.totalProfit'), value: formatCurrency(filteredData.totalProfit), icon: <TrendingUp /> },
        { title: t('dashboard.stats.paidOrders'), value: `${filteredData.paidOrdersCount}`, icon: <ShoppingCart /> },
        { title: t('dashboard.stats.averageTicket'), value: formatCurrency(filteredData.averageTicket), icon: <FileText /> },
        
        { title: t('dashboard.stats.itemsSold'), value: `${filteredData.itemsSoldCount}`, icon: <Package /> },
        { title: t('dashboard.stats.averageProfitPerOrder'), value: formatCurrency(filteredData.averageProfitPerOrder), icon: <TrendingUp /> },
        { title: t('dashboard.stats.averageProfitPerItem'), value: formatCurrency(filteredData.averageProfitPerItem), icon: <TrendingUp /> },
        { title: t('dashboard.stats.averageCostPerSale'), value: formatCurrency(filteredData.averageCostPerSale), icon: <TrendingDown /> },

        { title: t('dashboard.stats.cashReceived'), value: formatCurrency(filteredData.cashReceived), icon: <HandCoins /> },
        { title: t('dashboard.stats.cashToReceive'), value: formatCurrency(filteredData.cashToReceive), icon: <Hourglass /> },
        { title: t('dashboard.stats.accountReceived'), value: formatCurrency(filteredData.accountReceived), icon: <CreditCard /> },
        { title: t('dashboard.stats.accountToReceive'), value: formatCurrency(filteredData.accountToReceive), icon: <Hourglass /> },

        { title: t('dashboard.stats.totalCommissions'), value: formatCurrency(filteredData.totalCommissions), icon: <Percent /> },
        { title: t('dashboard.stats.totalShippingCost'), value: formatCurrency(filteredData.totalShippingCost), icon: <Truck /> },
        { title: t('dashboard.stats.exchangesAndReturns'), value: `${filteredData.exchangeReturnOrdersCount}`, icon: <Repeat /> },
        { title: t('dashboard.stats.cancellations'), value: `${filteredData.cancelledOrdersCount}`, icon: <XCircle /> },
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
                title={t('dashboard.accountCards.products')}
                value={`${allProducts.length} / ${userData?.plan?.limits?.products ?? '∞'}`}
                detail={t('dashboard.accountCards.productsDetail')}
            />
             <AccountStatCard 
                icon={<Calendar />}
                title={t('dashboard.accountCards.subscription')}
                value={daysUntilExpiry !== null ? `${daysUntilExpiry} ${t('dashboard.accountCards.days')}` : t('dashboard.accountCards.lifetime')}
                detail={userData?.validityDate ? `${t('dashboard.accountCards.expiresOn')} ${new Date(userData.validityDate as string).toLocaleDateString()}` : `${t('dashboard.accountCards.plan')} ${userData?.plan?.name}`}
                warning={daysUntilExpiry !== null && daysUntilExpiry < 7}
            />
             <AccountStatCard 
                icon={<Building />}
                title={t('dashboard.accountCards.companies')}
                value={`${companies.length} / ${userData?.plan?.limits?.companies ?? '∞'}`}
                detail={t('dashboard.accountCards.companiesDetail')}
            />
             <AccountStatCard 
                icon={<History />}
                title={t('dashboard.accountCards.orders')}
                value={`${allOrders.length} / ${userData?.plan?.limits?.ordersPerMonth ?? '∞'}`}
                detail={t('dashboard.accountCards.ordersDetail')}
            />
        </div>
      
      {userData?.role === 'empresa' && (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.filters.title')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-4">
                    <DateRangePicker date={dateRange} onDateChange={(range) => { setDateRange(range); setActiveFilter(''); }} />
                    <Button variant={activeFilter === 'today' ? 'default' : 'outline'} onClick={() => handleDateFilterClick('today')}>{t('dashboard.filters.today')}</Button>
                    <Button variant={activeFilter === 'yesterday' ? 'default' : 'outline'} onClick={() => handleDateFilterClick('yesterday')}>{t('dashboard.filters.yesterday')}</Button>
                    <Button variant={activeFilter === '7d' ? 'default' : 'outline'} onClick={() => handleDateFilterClick('7d')}>{t('dashboard.filters.sevenDays')}</Button>
                    <Button variant={activeFilter === '30d' ? 'default' : 'outline'} onClick={() => handleDateFilterClick('30d')}>{t('dashboard.filters.thirtyDays')}</Button>
                </CardContent>
            </Card>


            {(activeCompany || companies.length > 0) && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.map(stat => (
                    <Card key={stat.title}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        {React.cloneElement(stat.icon as React.ReactElement, { className: "h-4 w-4 text-muted-foreground"})}
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
                          <CardTitle>{t('dashboard.charts.revenueOverview')}</CardTitle>
                      </CardHeader>
                      <CardContent className="pl-2">
                          <ChartContainer config={{}} className="h-[250px] w-full">
                              <RechartsBarChart accessibilityLayer data={filteredData.revenueChartData}>
                                  <CartesianGrid vertical={false} />
                                  <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                                  <YAxis tickLine={false} axisLine={false} tickMargin={10} tickFormatter={(value) => formatCurrency(Number(value))} />
                                  <ChartTooltip 
                                      cursor={false} 
                                      content={<ChartTooltipContent 
                                          formatter={(value) => formatCurrency(Number(value))}
                                          labelClassName="text-sm font-bold text-popover-foreground dark:text-popover-foreground"
                                      />}
                                  />
                                  <Bar dataKey="Total" fill="hsl(var(--primary))" radius={4} />
                              </RechartsBarChart>
                          </ChartContainer>
                      </CardContent>
                  </Card>
                  <Card className="col-span-1">
                      <CardHeader>
                          <CardTitle>{t('dashboard.charts.topSellingProducts')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <Table>
                              <TableHeader>
                                  <TableRow>
                                      <TableHead>{t('dashboard.charts.product')}</TableHead>
                                      <TableHead className="text-center">{t('dashboard.charts.sales')}</TableHead>
                                      <TableHead className="text-right">{t('dashboard.charts.total')}</TableHead>
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
        </>
      )}
    </div>
  );
}
