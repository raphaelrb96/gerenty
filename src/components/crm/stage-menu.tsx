
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "../ui/badge";
import { GripVertical, PlusCircle } from "lucide-react";

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
    const { setNodeRef, isOver } = useDroppable({
        id: `stage-${stage}`,
        data: {
            type: 'Stage',
            stage: stage
        }
    });

     const {
        attributes,
        listeners,
        setNodeRef: setDraggableNodeRef,
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
        <div ref={setDraggableNodeRef} style={style} {...attributes}>
             <button
                ref={setNodeRef}
                onClick={onClick}
                className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex justify-between items-center group",
                    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted/50",
                    isOver && "ring-2 ring-primary ring-offset-2"
                )}
            >
                <div className="flex items-center gap-2">
                    <div {...listeners} className="cursor-grab">
                        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </div>
                    <span>{stage}</span>
                </div>
               <Badge variant={isActive ? "primary" : "secondary"}>{count}</Badge>
            </button>
        </div>
    )
}
