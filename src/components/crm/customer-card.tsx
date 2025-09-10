

"use client";

import type { Customer } from "@/services/customer-service";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { Badge } from "../ui/badge";

type CustomerCardProps = {
    customer: Customer;
    stageName: string;
    isOverlay?: boolean;
    onClick?: () => void;
};

export function CustomerCard({ customer, stageName, isOverlay, onClick }: CustomerCardProps) {
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
        const names = name.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <Card 
                className={cn(
                    "mb-2 p-2 group transition-shadow hover:shadow-md",
                    isDragging && "opacity-50 z-50",
                    isOverlay && "shadow-lg",
                    onClick && "cursor-pointer hover:bg-muted/80"
                )}
                onClick={onClick}
            >
                <CardContent className="p-1 flex items-start gap-3">
                     <div {...listeners} className="cursor-grab touch-none p-2 text-muted-foreground group-hover:text-foreground">
                        <GripVertical className="h-5 w-5" />
                    </div>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={customer.profileImageUrl} />
                        <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-sm truncate">{customer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {stageName}
                        </p>
                        {customer.tags && customer.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {customer.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

