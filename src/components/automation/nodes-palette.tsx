
"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageCircle, HelpCircle, Settings, GitBranch, Share2, Timer, UserCheck, CheckCircle, Zap, MessageSquareReply } from "lucide-react";
import React from "react";
import { Separator } from "../ui/separator";

const triggerNodeTypes = [
     {
        type: 'keywordTrigger' as const,
        label: "Gatilho: Palavra-Chave",
        description: "Inicia o fluxo quando o cliente envia uma mensagem específica (ex: 'oi', 'cardápio').",
        icon: Zap
    },
    {
        type: 'waitForResponse' as const,
        label: "Aguardar Resposta",
        description: "Pausa o fluxo e espera pela próxima mensagem do cliente, seja texto, imagem ou áudio.",
        icon: MessageSquareReply
    },
    {
        type: 'captureData' as const,
        label: "Capturar Dados",
        description: "Faz uma pergunta e salva a resposta do cliente em uma variável para uso posterior.",
        icon: HelpCircle
    },
];

const actionNodeTypes = [
    {
        type: 'message' as const,
        label: "Enviar Mensagem",
        description: "Envia uma mensagem de texto, imagem, vídeo ou com botões da sua biblioteca.",
        icon: MessageCircle
    },
    {
        type: 'internalAction' as const,
        label: "Ação Interna",
        description: "Executa ações automáticas no sistema, como adicionar uma tag a um cliente ou mover no CRM.",
        icon: Settings
    },
     {
        type: 'conditional' as const,
        label: "Condição Lógica (Se/Então)",
        description: "Cria diferentes caminhos no fluxo com base em regras (ex: se a resposta contém 'sim').",
        icon: GitBranch
    },
      {
        type: 'externalApi' as const,
        label: "API Externa",
        description: "Envia ou busca informações de outros sistemas, como um banco de dados externo ou outro software.",
        icon: Share2
    },
    {
        type: 'transfer' as const,
        label: "Transferir para Atendente",
        description: "Encerra a automação e notifica um atendente humano para assumir a conversa.",
        icon: UserCheck
    },
    {
        type: 'endFlow' as const,
        label: "Finalizar Fluxo",
        description: "Marca o fim de um caminho no fluxo. É o ponto final da automação.",
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
        <div className="space-y-6">
            <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Gatilhos e Etapas de Entrada</h3>
                 <div className="flex flex-col gap-2">
                    {triggerNodeTypes.map(nodeType => (
                        <Button 
                            key={nodeType.type} 
                            variant="outline" 
                            className="h-auto p-3 flex items-center justify-start gap-3 text-left"
                            onClick={() => onNodeAdd(nodeType.type)}
                        >
                            <div className="p-2 bg-yellow-500/10 rounded-md">
                                <nodeType.icon className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div className="flex-1 flex flex-col min-w-0">
                                <span className="text-sm font-semibold truncate">{nodeType.label}</span>
                                <span className="text-xs text-muted-foreground font-normal whitespace-normal">{nodeType.description}</span>
                            </div>
                        </Button>
                    ))}
                </div>
            </div>
             <Separator />
            <div className="mb-4">
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Ações e Lógica</h3>
                 <div className="flex flex-col gap-2">
                    {actionNodeTypes.map(nodeType => (
                        <Button 
                            key={nodeType.type} 
                            variant="outline" 
                            className="h-auto p-3 flex items-center justify-start gap-3 text-left"
                            onClick={() => onNodeAdd(nodeType.type)}
                        >
                            <div className="p-2 bg-blue-500/10 rounded-md">
                                <nodeType.icon className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex-1 flex flex-col min-w-0">
                                <span className="text-sm font-semibold truncate">{nodeType.label}</span>
                                <span className="text-xs text-muted-foreground font-normal whitespace-normal">{nodeType.description}</span>
                            </div>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}
