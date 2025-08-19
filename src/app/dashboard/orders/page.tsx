"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { OrderDetails } from "@/components/orders/order-details";
import { Search, Filter, File } from "lucide-react";

const orders = [
  { id: "ORD001", customer: "John Doe", status: "Fulfilled", amount: "$250.00", date: "2023-11-23" },
  { id: "ORD002", customer: "Jane Smith", status: "Processing", amount: "$150.00", date: "2023-11-22" },
  { id: "ORD003", customer: "Bob Johnson", status: "Fulfilled", amount: "$350.00", date: "2023-11-21" },
  { id: "ORD004", customer: "Alice Williams", status: "Pending", amount: "$450.00", date: "2023-11-20" },
  { id: "ORD005", customer: "Charlie Brown", status: "Fulfilled", amount: "$550.00", date: "2023-11-19" },
  { id: "ORD006", customer: "Diana Prince", status: "Cancelled", amount: "$50.00", date: "2023-11-18" },
];

export default function OrdersPage() {
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    const handleViewDetails = (order: any) => {
        setSelectedOrder(order);
        setIsSheetOpen(true);
    }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">View and manage customer orders.</p>
        </div>
        <Button variant="outline">
            <File className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

       <div className="flex items-center gap-2">
        <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search orders..." className="pl-8" />
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1">
                    <Filter className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>Fulfilled</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Processing</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Pending</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Cancelled</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
          </SheetHeader>
          <OrderDetails order={selectedOrder} onFinished={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === "Fulfilled" ? "default" : order.status === "Processing" ? "secondary" : "outline"}
                     className={
                        order.status === "Fulfilled" ? "bg-green-600/20 text-green-700 hover:bg-green-600/30" : 
                        order.status === "Processing" ? "bg-blue-600/20 text-blue-700 hover:bg-blue-600/30" :
                        order.status === "Cancelled" ? "bg-red-600/20 text-red-700 hover:bg-red-600/30" : ""
                    }>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell className="text-right">{order.amount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order as any)}>Details</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
