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

const stats = [
  { title: "Total Revenue", value: "$45,231.89", change: "+20.1% from last month", icon: <DollarSign className="h-4 w-4 text-muted-foreground" /> },
  { title: "Total Sales", value: "+12,234", change: "+19% from last month", icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" /> },
  { title: "Products in Stock", value: "573", change: "20 since last hour", icon: <Package className="h-4 w-4 text-muted-foreground" /> },
];

const recentActivities = [
    { id: "ORD001", customer: "John Doe", status: "Fulfilled", amount: "$250.00", date: "2023-11-23" },
    { id: "ORD002", customer: "Jane Smith", status: "Processing", amount: "$150.00", date: "2023-11-22" },
    { id: "ORD003", customer: "Bob Johnson", status: "Fulfilled", amount: "$350.00", date: "2023-11-21" },
    { id: "ORD004", customer: "Alice Williams", status: "Pending", amount: "$450.00", date: "2023-11-20" },
    { id: "ORD005", customer: "Charlie Brown", status: "Fulfilled", amount: "$550.00", date: "2023-11-19" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-2">
            <Button asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                <Link href="/dashboard/products">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Product
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
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                 <CardTitle>Recent Activity</CardTitle>
                 <CardDescription>An overview of the latest orders in your store.</CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/dashboard/orders">View All <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentActivities.map(activity => (
            <div key={activity.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="grid gap-1">
                    <p className="font-medium">{activity.customer}</p>
                    <p className="text-sm text-muted-foreground">{activity.id}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold">{activity.amount}</p>
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
