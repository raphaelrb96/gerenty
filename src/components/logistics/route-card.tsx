
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Box, GripVertical, MoreHorizontal, DollarSign } from "lucide-react";
import type { Route } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/context/currency-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { RouteDetailsModal } from "./route-details-modal";


export function RouteCard({ route, onRouteFinalized }: { route: Route, onRouteFinalized: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: route.id });
    
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const { formatCurrency } = useCurrency();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    return (
        <>
            <div ref={setNodeRef} style={style} {...attributes}>
                <Card className={cn("hover:shadow-md transition-shadow", isDragging && "opacity-50 shadow-lg")}>
                    <CardHeader className="p-4 flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="text-base">Rota #{route.id.substring(0, 7)}</CardTitle>
                            <CardDescription className="text-xs">{new Date(route.createdAt as string).toLocaleDateString()}</CardDescription>
                        </div>
                        <div className="flex items-center">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => setIsDetailsOpen(true)}>Ver Detalhes</DropdownMenuItem>
                                    <DropdownMenuItem>Editar</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                             <div {...listeners} className="cursor-grab p-2 text-muted-foreground">
                                <GripVertical className="h-5 w-5" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{route.driverName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-muted-foreground" />
                            <span>{route.orders.length} entrega(s)</span>
                        </div>
                         <div className="flex items-center gap-2 font-semibold">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span>{formatCurrency(route.totalCashInRoute || 0)} em dinheiro</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <RouteDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} route={route} onRouteFinalized={onRouteFinalized} />
        </>
    );
}
