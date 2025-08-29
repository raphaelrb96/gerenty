
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "../ui/badge";
import { GripVertical, PlusCircle, MoreHorizontal } from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "../ui/dropdown-menu";

type StageMenuProps = {
    stages: string[];
    activeStage: string;
    onSelectStage: (stage: string) => void;
    customerCount: Record<string, number>;
};

export function StageMenu({ stages, activeStage, onSelectStage, customerCount }: StageMenuProps) {
    return (
        <Card className="h-full">
            <CardContent className="p-2">
                <div className="flex flex-col gap-1">
                    {stages.map(stage => (
                        <StageMenuItem
                            key={stage}
                            stage={stage}
                            isActive={activeStage === stage}
                            onClick={() => onSelectStage(stage)}
                            count={customerCount[stage] || 0}
                        />
                    ))}
                     <Button variant="outline" size="sm" className="mt-2">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Estágio
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}


function StageMenuItem({ stage, isActive, onClick, count }: { stage: string, isActive: boolean, onClick: () => void, count: number }) {
    const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
        id: `stage-${stage}`,
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
        id: stage,
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
                    <span>{stage}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={isActive ? "primary" : "secondary"}>{count}</Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onClick={e => e.stopPropagation()}>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </button>
        </div>
    )
}
