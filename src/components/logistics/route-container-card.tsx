
"use client";

import { useDroppable } from "@dnd-kit/core";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, User } from "lucide-react";
import type { Route } from "@/lib/types";
import { cn } from "@/lib/utils";

type RouteContainerCardProps = {
    route: Route;
    children: React.ReactNode;
    onDataRefresh: () => void;
}

export function RouteContainerCard({ route, children, onDataRefresh }: RouteContainerCardProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `route-container-${route.id}`,
        data: {
            status: 'em_transito',
            routeId: route.id,
        }
    });

    return (
        <Card 
            ref={setNodeRef}
            className={cn(
                "bg-card/80 border-dashed",
                isOver && "border-primary ring-2 ring-primary"
            )}
        >
            <CardHeader className="p-3 flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {route.driverName}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-2 space-y-2">
                {children}
                 {Array.isArray(children) && children.length === 0 && (
                    <div className="text-center text-xs text-muted-foreground py-4">
                        Arraste uma entrega aqui
                    </div>
                 )}
            </CardContent>
        </Card>
    );
}
