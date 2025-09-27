
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageCircle, HelpCircle, Settings, GitBranch, Share2, Timer, UserCheck, CheckCircle } from "lucide-react";
import React from "react";

const nodeTypes = [
    {
        type: 'message' as const,
        label: "Enviar Mensagem",
        description: "Envia uma mensagem da biblioteca.",
        icon: MessageCircle
    },
    {
        type: 'captureData' as const,
        label: "Capturar Dados",
        description: "Solicita e valida uma informação do usuário.",
        icon: HelpCircle
    },
    {
        type: 'internalAction' as const,
        label: "Ação Interna",
        description: "Executa ações no CRM ou em Pedidos.",
        icon: Settings
    },
     {
        type: 'conditional' as const,
        label: "Dividir Fluxo",
        description: "Cria um caminho baseado em condições.",
        icon: GitBranch
    },
    {
        type: 'delay' as const,
        label: "Aguardar",
        description: "Pausa o fluxo por um tempo determinado.",
        icon: Timer
    },
    {
        type: 'transfer' as const,
        label: "Transferir Atendente",
        description: "Encerra e notifica um atendente.",
        icon: UserCheck
    },
    {
        type: 'endFlow' as const,
        label: "Finalizar Fluxo",
        description: "Marca o fim de um caminho no fluxo.",
        icon: CheckCircle
    }
]

type NodePaletteProps = {
    onNodeAdd: (type: keyof typeof nodeTypesByName) => void;
}

const nodeTypesByName = Object.fromEntries(nodeTypes.map(n => [n.type, n]));

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
