"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageCircle, type LucideIcon } from "lucide-react";
import React from "react";

const nodeTypes = [
    {
        type: 'keywordTrigger' as const,
        label: "Gatilho de Palavra-Chave",
        description: "Inicia o fluxo com base em uma palavra.",
        icon: Bot
    },
    {
        type: 'message' as const,
        label: "Enviar Mensagem",
        description: "Envia uma mensagem da biblioteca.",
        icon: MessageCircle
    }
]

type NodePaletteProps = {
    onNodeAdd: (type: 'keywordTrigger' | 'message') => void;
}

export function NodesPalette({ onNodeAdd }: NodePaletteProps) {

    return (
        <Card className="border-0 shadow-none">
            <CardHeader>
                <CardDescription>Clique em uma tarefa para adicioná-la ao fluxo.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    {nodeTypes.map(nodeType => (
                        <Button 
                            key={nodeType.type} 
                            variant="outline" 
                            className="h-auto p-4 flex flex-col gap-2 items-center text-center"
                            onClick={() => onNodeAdd(nodeType.type)}
                        >
                            <nodeType.icon className="h-6 w-6" />
                            <span className="text-sm font-semibold">{nodeType.label}</span>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
