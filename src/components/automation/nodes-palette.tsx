
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageCircle, HelpCircle, Settings, GitBranch, Share2, Timer, UserCheck, CheckCircle, Zap } from "lucide-react";
import React from "react";
import { Separator } from "../ui/separator";

const triggerNodeTypes = [
     {
        type: 'keywordTrigger' as const,
        label: "Gatilho: Palavra-Chave",
        description: "Inicia um fluxo se a palavra for dita.",
        icon: Zap
    },
];

const actionNodeTypes = [
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
        label: "Condição Lógica",
        description: "Cria um caminho baseado em condições.",
        icon: GitBranch
    },
      {
        type: 'externalApi' as const,
        label: "API Externa",
        description: "Envia requisições para sistemas externos.",
        icon: Share2
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

const allNodeTypes = [...triggerNodeTypes, ...actionNodeTypes];
const nodeTypesByName = Object.fromEntries(allNodeTypes.map(n => [n.type, n]));

type NodePaletteProps = {
    onNodeAdd: (type: keyof typeof nodeTypesByName) => void;
}


export function NodesPalette({ onNodeAdd }: NodePaletteProps) {

    return (
        <Card className="border-0 shadow-none">
            <CardHeader>
                <CardDescription>Clique em uma tarefa para adicioná-la ao fluxo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Ações</h3>
                     <div className="grid grid-cols-2 gap-4">
                        {actionNodeTypes.map(nodeType => (
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
                </div>
            </CardContent>
        </Card>
    )
}
