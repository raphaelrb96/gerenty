
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { RouteCard } from "./route-card";
import type { Route } from "@/lib/types";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
    status: Route['status'];
    routes: Route[];
};

export function KanbanColumn({ status, routes }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: status });

    const getStatusColor = (status: Route['status']) => {
        switch (status) {
            case 'A Processar': return 'border-blue-500';
            case 'Em Trânsito': return 'border-yellow-500';
            case 'Entregue': return 'border-green-500';
            case 'Outro': return 'border-gray-500';
        }
    }

    return (
        <div 
            ref={setNodeRef}
            className={cn(
                "bg-muted/50 rounded-lg p-4 space-y-4 min-h-[200px] transition-colors",
                isOver && "bg-muted"
            )}
        >
            <h3 className={`font-semibold text-lg border-l-4 pl-2 ${getStatusColor(status)}`}>
                {status} ({routes.length})
            </h3>
            <SortableContext items={routes.map(r => r.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {routes.map(route => (
                        <RouteCard key={route.id} route={route} />
                    ))}
                </div>
            </SortableContext>
        </div>
    );
}
