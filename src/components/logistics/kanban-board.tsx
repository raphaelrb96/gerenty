
"use client";

import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import type { Route } from "@/lib/types";
import { updateRoute } from "@/services/logistics-service";
import { useToast } from "@/hooks/use-toast";

const statuses: Route['status'][] = ['em_andamento', 'finalizada'];

type KanbanBoardProps = {
    routes: Route[];
    setRoutes: React.Dispatch<React.SetStateAction<Route[]>>;
    onRouteUpdate: () => void;
}

export function KanbanBoard({ routes, setRoutes, onRouteUpdate }: KanbanBoardProps) {
    const { toast } = useToast();
    
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const activeRoute = routes.find(r => r.id === active.id);
            const overColumnStatus = over.id.toString();

            if (activeRoute && statuses.includes(overColumnStatus as any) && activeRoute.status !== overColumnStatus) {
                
                if (overColumnStatus === 'finalizada') {
                    toast({
                        variant: "destructive",
                        title: "Ação Inválida",
                        description: "Finalize a rota através do modal de detalhes para alterar para este status.",
                    });
                    return;
                }

                const originalStatus = activeRoute.status;
                // Optimistic UI update
                setRoutes(prev => prev.map(r => r.id === active.id ? { ...r, status: overColumnStatus as Route['status'] } : r));

                try {
                    await updateRoute(activeRoute.id, { status: overColumnStatus as Route['status'] });
                     toast({ title: "Status da rota atualizado!" });
                } catch (error) {
                    // Revert UI on error
                    setRoutes(prev => prev.map(r => r.id === active.id ? { ...r, status: originalStatus } : r));
                    toast({ variant: "destructive", title: "Erro ao atualizar rota" });
                    console.error("Failed to update route status:", error);
                }
            }
        }
    };

    return (
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {statuses.map(status => (
                    <KanbanColumn
                        key={status}
                        status={status}
                        routes={routes.filter(r => r.status === status)}
                        onRouteUpdate={onRouteUpdate}
                    />
                ))}
            </div>
        </DndContext>
    );
}
