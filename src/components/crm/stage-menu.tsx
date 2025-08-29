
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, PlusCircle, MoreHorizontal, List } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "../ui/dropdown-menu";
import type { Stage } from "@/services/stage-service";

type StageMenuProps = {
    stages: Stage[];
    activeStageId: string | null;
    onSelectStage: (stageId: string | null) => void;
    onAddStage: () => void;
    onEditStage: (stage: Stage) => void;
    onDeleteStage: (stage: Stage) => void;
};

export function StageMenu({ stages, activeStageId, onSelectStage, onAddStage, onEditStage, onDeleteStage }: StageMenuProps) {
    return (
        <Card className="h-full">
            <CardContent className="p-2">
                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => onSelectStage(null)}
                        className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 group",
                            activeStageId === null ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
                        )}
                    >
                        <List className="h-4 w-4" />
                        <span>Todos</span>
                    </button>
                    <hr className="my-1 border-border" />
                    {stages.map(stage => (
                        <StageMenuItem
                            key={stage.id}
                            stage={stage}
                            isActive={activeStageId === stage.id}
                            onClick={() => onSelectStage(stage.id)}
                            onEdit={() => onEditStage(stage)}
                            onDelete={() => onDeleteStage(stage)}
                        />
                    ))}
                    <Button variant="outline" size="sm" className="mt-2" onClick={onAddStage}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Estágio
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}


function StageMenuItem({ stage, isActive, onClick, onEdit, onDelete }: { stage: Stage, isActive: boolean, onClick: () => void, onEdit: () => void, onDelete: () => void }) {
    const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
        id: `stage-drop-${stage.id}`,
        data: {
            type: 'Stage',
            stage: stage
        }
    });

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({
        id: stage.id,
        data: {
            type: 'Stage',
            stage: stage,
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <button
                ref={setDroppableNodeRef}
                onClick={onClick}
                className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex justify-between items-center group",
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted/50",
                    isOver && "ring-2 ring-primary ring-offset-2"
                )}
            >
                <div className="flex items-center gap-2">
                    <div {...listeners} className="cursor-grab touch-none p-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </div>
                    <span>{stage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onClick={e => e.stopPropagation()}>
                            <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:bg-destructive/10 focus:text-destructive">Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </button>
        </div>
    )
}

    