
"use client";

import type { Node } from "reactflow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, HelpCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";

type NodeConfigPanelProps = {
    selectedNode: Node | null;
}

function KeywordTriggerPanel() {
    return (
        <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
                Defina a palavra-chave que irá acionar o início deste fluxo de conversa.
            </p>
            <Separator />
            <div className="space-y-2">
                <Label htmlFor="keyword-input">Palavra-Chave</Label>
                <Input id="keyword-input" placeholder="Ex: olá, preço, suporte" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="match-type-select">Tipo de Correspondência</Label>
                <Select defaultValue="exact">
                    <SelectTrigger id="match-type-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="exact">Correspondência Exata</SelectItem>
                        <SelectItem value="contains">Contém</SelectItem>
                        <SelectItem value="starts_with">Começa com</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

function MessagePanel() {
    return (
        <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
                Escolha uma mensagem pré-configurada da sua biblioteca para ser enviada neste passo do fluxo.
            </p>
            <Separator />
             <div className="space-y-2">
                <Label htmlFor="library-message-select">Mensagem da Biblioteca</Label>
                <Select>
                    <SelectTrigger id="library-message-select">
                        <SelectValue placeholder="Selecione uma mensagem..." />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Placeholder - será preenchido com dados reais */}
                        <SelectItem value="welcome">Boas-vindas</SelectItem>
                        <SelectItem value="support_options">Opções de Suporte</SelectItem>
                        <SelectItem value="pricing_info">Informações de Preço</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}


export function NodeConfigPanel({ selectedNode }: NodeConfigPanelProps) {

    if (!selectedNode) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground bg-card border-l">
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
                return <KeywordTriggerPanel />;
            case 'message':
                 return <MessagePanel />;
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
        <div className="h-full bg-card border-l p-4">
            <Card className="h-full border-0 shadow-none">
                <CardHeader>
                    <CardTitle>Configurar: {selectedNode.data.label}</CardTitle>
                    <CardDescription>
                        ID do Nó: <span className="font-mono text-xs">{selectedNode.id}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {renderPanelContent()}
                </CardContent>
            </Card>
        </div>
    );
}
