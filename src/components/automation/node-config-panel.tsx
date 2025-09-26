
"use client";

import type { Node } from "reactflow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, HelpCircle } from "lucide-react";

type NodeConfigPanelProps = {
    selectedNode: Node | null;
}

export function NodeConfigPanel({ selectedNode }: NodeConfigPanelProps) {

    if (!selectedNode) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-muted/50 border-l">
                <Settings className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium">Configurações do Nó</h3>
                <p className="text-sm">Selecione um nó no fluxograma para ver e editar suas propriedades aqui.</p>
            </div>
        );
    }
    
    const renderPanelContent = () => {
        const nodeType = selectedNode.data.type;
        switch(nodeType) {
            case 'keywordTrigger':
                return (
                    <div>
                        <p>Configure a palavra-chave e o tipo de correspondência.</p>
                        {/* Placeholder for keyword trigger form */}
                    </div>
                );
            case 'message':
                 return (
                    <div>
                        <p>Selecione uma mensagem da sua biblioteca de respostas.</p>
                        {/* Placeholder for message selection form */}
                    </div>
                );
            default:
                 return (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                        <HelpCircle className="h-8 w-8 mb-2" />
                        <p>Nó de tipo desconhecido. Não há configurações disponíveis.</p>
                    </div>
                )
        }
    }


    return (
        <div className="h-full bg-muted/50 border-l p-4">
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Configurar Nó: {selectedNode.data.label}</CardTitle>
                    <CardDescription>
                        Tipo: <span className="font-semibold">{selectedNode.data.type}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderPanelContent()}
                </CardContent>
            </Card>
        </div>
    );
}
