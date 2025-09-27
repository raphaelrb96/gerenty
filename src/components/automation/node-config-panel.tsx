

"use client";

import type { Node } from "reactflow";
import { Settings, HelpCircle, PlusCircle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import type { LibraryMessage } from "@/lib/types";
import { useState, useEffect, KeyboardEvent } from "react";
import { getLibraryMessagesByCompany } from "@/services/library-message-service";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "../ui/sheet";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type NodeConfigPanelProps = {
    selectedNode: Node | null;
    onNodeDataChange: (nodeId: string, data: any) => void;
}

function TriggerPanel({ node, onNodeDataChange }: { node: Node, onNodeDataChange: NodeConfigPanelProps['onNodeDataChange'] }) {
    
    const triggerType = node.data.triggerType || 'keyword';
    const [keywords, setKeywords] = useState<{ value: string; matchType: string }[]>(node.data.triggerKeywords || []);
    const [newKeyword, setNewKeyword] = useState("");
    const [editingKeyword, setEditingKeyword] = useState<{ index: number; value: string } | null>(null);

    useEffect(() => {
        setKeywords(node.data.triggerKeywords || []);
    }, [node.data.triggerKeywords]);


    const handleAddKeyword = () => {
        if (newKeyword && !keywords.some(kw => kw.value === newKeyword)) {
            const updatedKeywords = [...keywords, { value: newKeyword, matchType: 'exact' }];
            setKeywords(updatedKeywords);
            onNodeDataChange(node.id, { triggerKeywords: updatedKeywords });
            setNewKeyword("");
        }
    };
    
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddKeyword();
        }
    }

    const handleDeleteKeyword = (index: number) => {
        const updatedKeywords = keywords.filter((_, i) => i !== index);
        setKeywords(updatedKeywords);
        onNodeDataChange(node.id, { triggerKeywords: updatedKeywords });
    };

    const handleUpdateKeyword = () => {
        if (editingKeyword) {
            const updatedKeywords = [...keywords];
            updatedKeywords[editingKeyword.index].value = editingKeyword.value;
            setKeywords(updatedKeywords);
            onNodeDataChange(node.id, { triggerKeywords: updatedKeywords });
            setEditingKeyword(null);
        }
    };
    
    const handleKeywordMatchTypeChange = (index: number, newMatchType: string) => {
        const updatedKeywords = [...keywords];
        updatedKeywords[index].matchType = newMatchType;
        setKeywords(updatedKeywords);
        onNodeDataChange(node.id, { triggerKeywords: updatedKeywords });
    };


    const handleTriggerTypeChange = (value: string) => {
        onNodeDataChange(node.id, { triggerType: value });
    };

    const handleMediaTypeChange = (value: string) => {
        onNodeDataChange(node.id, { triggerMediaType: value });
    }

    const handleInteractionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onNodeDataChange(node.id, { triggerInteractionId: e.target.value });
    }
    
    return (
        <div className="space-y-4">
             <p className="text-sm text-muted-foreground">
                Defina o gatilho que irá acionar o início deste fluxo de conversa.
            </p>
            <Separator />
            
            <div className="space-y-2">
                <Label htmlFor="trigger-type-select">Tipo de Gatilho</Label>
                <Select value={triggerType} onValueChange={handleTriggerTypeChange}>
                    <SelectTrigger id="trigger-type-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="keyword">Palavra-Chave</SelectItem>
                        <SelectItem value="media">Tipo de Mensagem</SelectItem>
                        <SelectItem value="interaction">Interação (Clique)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {triggerType === 'keyword' && (
                <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label htmlFor="keyword-input">Palavras-Chave</Label>
                         <div className="flex gap-2">
                            <Input
                                id="keyword-input"
                                placeholder="Digite uma palavra-chave"
                                value={newKeyword}
                                onChange={(e) => setNewKeyword(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <Button type="button" onClick={handleAddKeyword}><PlusCircle className="h-4 w-4" /></Button>
                        </div>
                        <div className="space-y-2 mt-2">
                            {keywords.map((kw, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                                    <span className="font-mono text-sm flex-1">{kw.value}</span>
                                    <Select value={kw.matchType} onValueChange={(value) => handleKeywordMatchTypeChange(index, value)}>
                                        <SelectTrigger className="w-[120px] h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="exact">Exata</SelectItem>
                                            <SelectItem value="contains">Contém</SelectItem>
                                            <SelectItem value="starts_with">Começa com</SelectItem>
                                            <SelectItem value="regex">Regex</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onSelect={() => setEditingKeyword({ index, value: kw.value })}><Pencil className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleDeleteKeyword(index)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Excluir</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                        </div>
                    </div>
                     <AlertDialog open={!!editingKeyword} onOpenChange={() => setEditingKeyword(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Editar Palavra-Chave</AlertDialogTitle>
                                <AlertDialogDescription>Altere o valor da palavra-chave.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <Input 
                                value={editingKeyword?.value || ''}
                                onChange={(e) => setEditingKeyword(prev => prev ? { ...prev, value: e.target.value } : null)}
                            />
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleUpdateKeyword}>Salvar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
            
            {triggerType === 'media' && (
                <div className="space-y-4 pt-4 border-t">
                     <div className="space-y-2">
                        <Label htmlFor="media-type-select">Tipo de Mídia Recebida</Label>
                        <Select 
                            defaultValue={node.data.triggerMediaType}
                            onValueChange={handleMediaTypeChange}
                        >
                            <SelectTrigger id="media-type-select">
                                <SelectValue placeholder="Selecione um tipo de mídia..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Qualquer Mídia</SelectItem>
                                <SelectItem value="image">Imagem</SelectItem>
                                <SelectItem value="video">Vídeo</SelectItem>
                                <SelectItem value="audio">Áudio</SelectItem>
                                <SelectItem value="location">Localização</SelectItem>
                                <SelectItem value="contact">Contato</SelectItem>
                                <SelectItem value="document">Documento</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {triggerType === 'interaction' && (
                <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label htmlFor="interaction-id-input">ID da Interação</Label>
                        <Input 
                            id="interaction-id-input" 
                            placeholder="Ex: btn_comprar_agora" 
                            value={node.data.triggerInteractionId || ""}
                            onChange={handleInteractionIdChange}
                        />
                         <p className="text-xs text-muted-foreground">
                            Insira o ID único do botão ou item de lista que acionará este fluxo.
                        </p>
                    </div>
                </div>
            )}
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

    const renderPanelContent = () => {
        if (!selectedNode) {
            return (
                <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground h-full">
                    <Settings className="h-8 w-8 mb-2" />
                    <p className="text-sm">Selecione uma tarefa no fluxograma para ver e editar suas propriedades aqui.</p>
                </div>
            )
        }

        const nodeType = selectedNode.data.type;
        switch(nodeType) {
            case 'keywordTrigger':
                return <TriggerPanel node={selectedNode} onNodeDataChange={onNodeDataChange} />;
            case 'message':
                 return <MessagePanel node={selectedNode} onNodeDataChange={onNodeDataChange} />;
            default:
                 return (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 h-full">
                        <HelpCircle className="h-8 w-8 mb-2" />
                        <p>Tarefa de tipo desconhecido. Não há configurações disponíveis.</p>
                    </div>
                )
        }
    }

    const handleClose = () => {
        const closeButton = document.querySelector('[data-radix-collection-item] > button[aria-label="Close"]') as HTMLElement;
        if (closeButton) {
            closeButton.click();
        }
    }


    return (
        <SheetContent className="sm:max-w-lg flex flex-col p-0">
            <SheetHeader className="p-6">
                <SheetTitle>Configurar: {selectedNode?.data.label || 'Tarefa'}</SheetTitle>
                 <SheetDescription>
                    ID da Tarefa: <span className="font-mono text-xs">{selectedNode?.id}</span>
                </SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1 px-6">
                {renderPanelContent()}
            </ScrollArea>
            <SheetFooter className="p-6 border-t gap-2">
                <Button variant="outline" onClick={handleClose}>
                    Cancelar
                </Button>
                 <Button onClick={handleClose}>
                    Salvar Alterações
                </Button>
            </SheetFooter>
        </SheetContent>
    );
}
