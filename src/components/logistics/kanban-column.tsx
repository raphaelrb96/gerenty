
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { RouteCard } from "./route-card";
import type { Route } from "@/lib/types";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
    status: Route['status'];
    routes: Route[];
    onRouteUpdate: () => void;
};

const statusConfig = {
    'em_andamento': { label: 'Em Andamento', color: 'border-yellow-500' },
    'finalizada': { label: 'Finalizada', color: 'border-green-500' },
}

export function KanbanColumn({ status, routes, onRouteUpdate }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: status });
    const config = statusConfig[status];

    return (
        <div 
            ref={setNodeRef}
            className={cn(
                "bg-muted/50 rounded-lg p-4 space-y-4 min-h-[200px] transition-colors",
                isOver && "bg-muted"
            )}
        >
            <h3 className={cn('font-semibold text-lg border-l-4 pl-2', config.color)}>
                {config.label} ({routes.length})
            </h3>
            <SortableContext items={routes.map(r => r.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {routes.map(route => (
                        <RouteCard key={route.id} route={route} onRouteFinalized={onRouteUpdate} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}
