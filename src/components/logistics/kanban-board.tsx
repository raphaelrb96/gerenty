
"use client";

import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import type { Route } from "@/lib/types";

const statuses: Route['status'][] = ['A Processar', 'Em Trânsito', 'Entregue', 'Outro'];

type KanbanBoardProps = {
    routes: Route[];
    setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
}

export function KanbanBoard({ routes, setRoutes }: KanbanBoardProps) {
    
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const activeRoute = routes.find(r => r.id === active.id);
            const overColumnStatus = over.id.toString();

            if (activeRoute && statuses.includes(overColumnStatus as any)) {
                // Optimistic UI update
                setRoutes(prev => prev.map(r => r.id === active.id ? { ...r, status: overColumnStatus as Route['status'] } : r));

                // TODO: Here you would call a server action to persist the status change
                console.log(`Route ${active.id} moved to ${overColumnStatus}`);
            }
        }
    };

    return (
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                {statuses.map(status => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        routes={routes.filter(r => r.status === status)}
                    />
                ))}
            </div>
        </DndContext>
    );
}
