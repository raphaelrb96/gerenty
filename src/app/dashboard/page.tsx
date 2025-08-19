
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Package, ShoppingCart, ArrowUpRight, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { getOrders } from "@/services/order-service";
import { getProducts } from "@/services/product-service";
import type { Order, Product } from "@/lib/types";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useTranslation } from "@/context/i18n-context";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        setLoading(true);
        const [userOrders, userProducts] = await Promise.all([
          getOrders(user.uid),
          getProducts(user.uid),
        ]);
        setOrders(userOrders);
        setProducts(userProducts);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const totalRevenue = orders.reduce((acc, order) => acc + order.amount, 0);
  const totalSales = orders.length;
  const productsInStock = products.length;

  const stats = [
    { title: t('dashboard.totalRevenue'), value: `R$${totalRevenue.toFixed(2)}`, icon: <DollarSign className="h-4 w-4 text-muted-foreground" /> },
    { title: t('dashboard.totalSales'), value: `+${totalSales}`, icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" /> },
    { title: t('dashboard.productsInStock'), value: `${productsInStock}`, icon: <Package className="h-4 w-4 text-muted-foreground" /> },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="font-headline text-3xl font-bold">{t('Dashboard')}</h1>
        <div className="flex items-center space-x-2">
            <Button asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                <Link href="/dashboard/products">
                    <PlusCircle className="mr-2 h-4 w-4" /> {t('dashboard.addProduct')}
                </Link>
            </Button>
        </div>
      </div>

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

      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                 <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
                 <CardDescription>{t('dashboard.recentActivityDesc')}</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/dashboard/orders">{t('dashboard.viewAll')} <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.slice(0, 5).map(activity => (
            <div key={activity.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="grid gap-1">
                    <p className="font-medium">{activity.customer}</p>
                    <p className="text-sm text-muted-foreground">{activity.id.substring(0, 7)}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold">R${activity.amount.toFixed(2)}</p>
                     <Badge variant={activity.status === "Fulfilled" ? "default" : activity.status === "Processing" ? "secondary" : "outline"}
                    className={activity.status === "Fulfilled" ? "bg-green-600/20 text-green-700 hover:bg-green-600/30" : activity.status === "Processing" ? "bg-blue-600/20 text-blue-700 hover:bg-blue-600/30" : ""}>
                      {activity.status}
                    </Badge>
                </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
