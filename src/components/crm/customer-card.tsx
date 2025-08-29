
"use client";

import type { Customer } from "@/services/customer-service";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

type CustomerCardProps = {
    customer: Customer;
    isOverlay?: boolean;
};

export function CustomerCard({ customer, isOverlay }: CustomerCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ 
        id: customer.id,
        data: {
            type: 'Customer',
            customer,
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className={cn(
                "mb-2 p-2 hover:bg-muted/80 cursor-grab active:cursor-grabbing",
                isDragging && "opacity-50 z-50",
                isOverlay && "shadow-lg"
            )}>
                <CardContent className="p-1 flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={customer.profileImageUrl} />
                        <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-sm truncate">{customer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            Última Interação: {customer.lastInteraction ? new Date(customer.lastInteraction as string).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
