
"use client";

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
import { DollarSign, Package, ShoppingCart, ArrowRight, TrendingUp, BarChart, FileText, ChevronsUpDown, Building } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState, useMemo } from "react";
import { getOrders } from "@/services/order-service";
import { getProducts } from "@/services/product-service";
import type { Order, Product } from "@/lib/types";
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
import { subDays, startOfMonth, endOfMonth, eachDayOfInterval, format, differenceInDays } from "date-fns";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";


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
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
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
                    <div className="flex-shrink-0">
                         <Button asChild size="lg" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                             <Link href="/dashboard/pos">
                                Ir para o PDV <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}


export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { activeCompany, companies } = useCompany();
  const { formatCurrency } = useCurrency();
  
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const defaultDateRange = { from: subDays(new Date(), 29), to: new Date() };
  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);


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
            const companyIds = activeCompany ? [activeCompany.id] : companies.map(c => c.id);
            if (companyIds.length === 0 && !activeCompany) {
                const userProducts = await getProducts(user.uid);
                setAllProducts(userProducts);
                setAllOrders([]);
                return;
            };

            const [ordersResults, productsResults] = await Promise.all([
                Promise.all(companyIds.map(id => getOrders(id))),
                Promise.all(companyIds.map(id => getProducts(id)))
            ]);
            
            setAllOrders(ordersResults.flat());
            setAllProducts(productsResults.flat());

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
    const orders = allOrders.filter(order => {
        const orderDate = new Date(order.createdAt as string);
        if (dateRange?.from && dateRange?.to) {
            return orderDate >= dateRange.from && orderDate <= dateRange.to;
        }
        return true;
    });

    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
    const totalSales = orders.length;

    const totalCost = orders.reduce((acc, order) => {
        const orderCost = order.items.reduce((itemAcc, item) => {
            return itemAcc + (item.costPrice || 0) * item.quantity;
        }, 0);
        return acc + orderCost;
    }, 0);

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    const topProducts = orders
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
        }, [] as { productId: string; productName: string; quantity: number, totalPrice: number }[])
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    
    // Revenue chart data
    const revenueByDay: { [key: string]: number } = {};
    if (dateRange?.from && dateRange?.to) {
        const intervalDays = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

        // Ensure at least 7 days are shown, expand interval if needed
        const diff = differenceInDays(dateRange.to, dateRange.from);
        if (diff < 6) {
             const daysToAdd = 6 - diff;
             dateRange.from = subDays(dateRange.from, daysToAdd);
        }

        eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).forEach(day => {
            revenueByDay[format(day, 'yyyy-MM-dd')] = 0;
        });

        orders.forEach(order => {
            const dateStr = format(new Date(order.createdAt as string), 'yyyy-MM-dd');
            if (revenueByDay.hasOwnProperty(dateStr)) {
                revenueByDay[dateStr] += order.total;
            }
        });
    }

    const revenueChartData = Object.entries(revenueByDay)
        .map(([date, total]) => ({
            name: format(new Date(date), 'dd/MM'),
            Total: total
        }))
        .sort((a,b) => new Date(a.name.split('/').reverse().join('-')).getTime() - new Date(b.name.split('/').reverse().join('-')).getTime());
        
    return {
        orders,
        totalRevenue,
        totalSales,
        totalCost,
        totalProfit,
        profitMargin,
        averageTicket,
        topProducts,
        totalRegisteredProducts: allProducts.length,
        revenueChartData,
    };
}, [allOrders, allProducts, dateRange]);


  const stats = [
    { title: "Receita Total", value: formatCurrency(filteredData.totalRevenue), icon: <DollarSign /> },
    { title: "Lucro Total", value: formatCurrency(filteredData.totalProfit), icon: <TrendingUp /> },
    { title: "Vendas", value: `+${filteredData.totalSales}`, icon: <ShoppingCart /> },
    { title: "Ticket Médio", value: formatCurrency(filteredData.averageTicket), icon: <FileText /> },
    { title: "Custo Total", value: formatCurrency(filteredData.totalCost), icon: <DollarSign className="opacity-50"/> },
    { title: "Produtos Cadastrados", value: `${filteredData.totalRegisteredProducts}`, icon: <Package /> },
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

      <Card>
          <CardHeader>
              <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
              <DateRangePicker date={dateRange} onDateChange={setDateRange} />
              <Button variant="outline" onClick={() => setDateRange({from: new Date(), to: new Date()})}>Hoje</Button>
              <Button variant="outline" onClick={() => setDateRange({from: subDays(new Date(), 6), to: new Date()})}>Últimos 7 dias</Button>
              <Button variant="outline" onClick={() => setDateRange({from: startOfMonth(new Date()), to: endOfMonth(new Date())})}>Este Mês</Button>
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Visão Geral da Receita</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <RechartsBarChart data={filteredData.revenueChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => formatCurrency(Number(value))} />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Bar dataKey="Total" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                        </RechartsBarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
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
