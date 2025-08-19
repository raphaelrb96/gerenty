"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

type OrderDetailsProps = {
    order?: { id: string, customer: string, status: string, amount: string, date: string } | null,
    onFinished: () => void;
}

const statuses = ["Pending", "Processing", "Fulfilled", "Cancelled"];

export function OrderDetails({ order, onFinished }: OrderDetailsProps) {
  if (!order) return null;

  return (
    <div className="space-y-6 py-4">
        <div className="space-y-2">
            <h3 className="font-semibold text-lg">{order.id}</h3>
            <p className="text-muted-foreground">{order.date}</p>
        </div>
      
        <Separator />
        
        <div className="grid gap-4">
            <div className="font-semibold">Customer Details</div>
            <dl className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Customer</dt>
                    <dd>{order.customer}</dd>
                </div>
                 <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd><a href={`mailto:${order.customer.toLowerCase().replace(' ', '.')}@example.com`} className="text-primary hover:underline">{order.customer.toLowerCase().replace(' ', '.')}@example.com</a></dd>
                </div>
                 <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>+1 234 567 890</dd>
                </div>
            </dl>
        </div>
        
        <Separator />
        
        <div className="grid gap-4">
            <div className="font-semibold">Order Summary</div>
             <dl className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">1x Ergonomic Chair</dt>
                    <dd>$299.99</dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd>$299.99</dd>
                </div>
                <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Tax</dt>
                    <dd>$25.00</dd>
                </div>
                <div className="flex items-center justify-between font-semibold">
                    <dt>Total</dt>
                    <dd>{order.amount}</dd>
                </div>
            </dl>
        </div>

        <Separator />

        <div className="grid gap-4">
            <div className="font-semibold">Update Status</div>
             <Select defaultValue={order.status}>
                <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onFinished}>Close</Button>
            <Button type="button" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} onClick={onFinished}>Update Order</Button>
        </div>
    </div>
  );
}
