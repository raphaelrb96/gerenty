"use client";

import type { Customer } from "@/services/customer-service";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type CustomerCardProps = {
    customer: Customer;
};

export function CustomerCard({ customer }: CustomerCardProps) {
    
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <Card className="mb-2 p-2 hover:bg-muted/80 cursor-grab active:cursor-grabbing">
            <CardContent className="p-1 flex items-center gap-3">
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={customer.profileImageUrl} />
                    <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <p className="font-semibold text-sm truncate">{customer.name}</p>
                    <p className="text-xs text-muted-foreground">
                        Última Interação: {customer.lastInteraction ? new Date(customer.lastInteraction as string).toLocaleDateString() : 'N/A'}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
