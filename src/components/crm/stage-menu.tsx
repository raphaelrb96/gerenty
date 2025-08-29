"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { Badge } from "../ui/badge";

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
                <nav className="flex flex-col gap-1">
                    {stages.map(stage => (
                        <StageMenuItem
                            key={stage}
                            stage={stage}
                            isActive={activeStage === stage}
                            onClick={() => onSelectStage(stage)}
                            count={customerCount[stage] || 0}
                        />
                    ))}
                     <Button variant="outline" size="sm" className="mt-2">Adicionar Estágio</Button>
                </nav>
            </CardContent>
        </Card>
    );
}


function StageMenuItem({ stage, isActive, onClick, count }: { stage: string, isActive: boolean, onClick: () => void, count: number }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `stage-${stage}`,
    });

    return (
        <button
            ref={setNodeRef}
            onClick={onClick}
            className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex justify-between items-center",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted/50",
                isOver && "ring-2 ring-primary ring-offset-2"
            )}
        >
           <span>{stage}</span>
           <Badge variant={isActive ? "primary" : "secondary"}>{count}</Badge>
        </button>
    )
}
