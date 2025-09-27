"use client";

import type { Node } from "reactflow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, HelpCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import type { LibraryMessage } from "@/lib/types";
import { useState, useEffect } from "react";
import { getLibraryMessagesByCompany } from "@/services/library-message-service";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";


type NodeConfigPanelProps = {
    selectedNode: Node | null;
    onNodeDataChange: (nodeId: string, data: any) => void;
}

function KeywordTriggerPanel({ node, onNodeDataChange }: { node: Node, onNodeDataChange: NodeConfigPanelProps['onNodeDataChange'] }) {
    
    const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onNodeDataChange(node.id, { triggerKeyword: e.target.value });
    };

    const handleMatchTypeChange = (value: string) => {
        onNodeDataChange(node.id, { triggerMatchType: value });
    };
    
    return (
        <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
                Defina a palavra-chave que irá acionar o início deste fluxo de conversa.
            </p>
            <Separator />
            <div className="space-y-2">
                <Label htmlFor="keyword-input">Palavra-Chave</Label>
                <Input 
                    id="keyword-input" 
                    placeholder="Ex: olá, preço, suporte" 
                    value={node.data.triggerKeyword || ""}
                    onChange={handleKeywordChange}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="match-type-select">Tipo de Correspondência</Label>
                <Select 
                    defaultValue={node.data.triggerMatchType || "exact"}
                    onValueChange={handleMatchTypeChange}
                >
                    <SelectTrigger id="match-type-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="exact">Correspondência Exata</SelectItem>
                        <SelectItem value="contains">Contém</SelectItem>
                        <SelectItem value="starts_with">Começa com</SelectItem>
                        <SelectItem value="regex">Regex (Avançado)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}

function MessagePanel({ node, onNodeDataChange }: { node: Node, onNodeDataChange: NodeConfigPanelProps['onNodeDataChange'] }) {
    const [messages, setMessages] = useState<LibraryMessage[]>([]);
    const { activeCompany } = useCompany();
    const { toast } = useToast();

    useEffect(() => {
        if(activeCompany) {
            getLibraryMessagesByCompany(activeCompany.id).then(setMessages).catch(() => {
                toast({ variant: 'destructive', title: 'Erro ao carregar mensagens' });
            });
        }
    }, [activeCompany, toast]);

    const handleMessageChange = (value: string) => {
        onNodeDataChange(node.id, { messageId: value });
    };

    return (
        <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
                Escolha uma mensagem pré-configurada da sua biblioteca para ser enviada neste passo do fluxo.
            </p>
            <Separator />
             <div className="space-y-2">
                <Label htmlFor="library-message-select">Mensagem da Biblioteca</Label>
                <Select
                    value={node.data.messageId || ""}
                    onValueChange={handleMessageChange}
                >
                    <SelectTrigger id="library-message-select">
                        <SelectValue placeholder="Selecione uma mensagem..." />
                    </SelectTrigger>
                    <SelectContent>
                        {messages.map(msg => (
                            <SelectItem key={msg.id} value={msg.id}>{msg.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}


export function NodeConfigPanel({ selectedNode, onNodeDataChange }: NodeConfigPanelProps) {

    if (!selectedNode) {
        return (
            <>
            <DialogHeader>
                <DialogTitle>Configuração da Tarefa</DialogTitle>
                <DialogDescription>Selecione uma tarefa no fluxograma para ver e editar suas propriedades aqui.</DialogDescription>
            </DialogHeader>
            <div className="h-32 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <Settings className="h-8 w-8 mb-2" />
                <p className="text-sm">Nenhuma tarefa selecionada.</p>
            </div>
            </>
        );
    }
    
    const renderPanelContent = () => {
        const nodeType = selectedNode.data.type;
        switch(nodeType) {
            case 'keywordTrigger':
                return <KeywordTriggerPanel node={selectedNode} onNodeDataChange={onNodeDataChange} />;
            case 'message':
                 return <MessagePanel node={selectedNode} onNodeDataChange={onNodeDataChange} />;
            default:
                 return (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                        <HelpCircle className="h-8 w-8 mb-2" />
                        <p>Tarefa de tipo desconhecido. Não há configurações disponíveis.</p>
                    </div>
                )
        }
    }


    return (
        <div className="h-full bg-card">
            <DialogHeader>
                <DialogTitle>Configurar: {selectedNode.data.label}</DialogTitle>
                 <DialogDescription>
                    ID da Tarefa: <span className="font-mono text-xs">{selectedNode.id}</span>
                </DialogDescription>
            </DialogHeader>
            <div className="p-4">
                {renderPanelContent()}
            </div>
        </div>
    );
}
