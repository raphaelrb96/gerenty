

"use client";

import type { Node, Edge } from "reactflow";
import { Settings, HelpCircle, PlusCircle, MoreHorizontal, Pencil, Trash2, Save, TextCursorInput, Link, Bot, MessageCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";
import type { LibraryMessage, Employee, Stage } from "@/lib/types";
import { useState, useEffect, KeyboardEvent } from "react";
import { getLibraryMessagesByCompany } from "@/services/library-message-service";
import { getEmployeesByUser } from "@/services/employee-service";
import { getStagesByUser } from "@/services/stage-service";
import { useCompany } from "@/context/company-context";
import { useAuth } from "@/context/auth-context";
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
import { nodeTypeConfig } from "@/app/dashboard/automation/flows/edit/[id]/page";

type NodeConfigPanelProps = {
    selectedNode: Node | null;
    onNodeDataChange: (nodeId: string, data: any) => void;
    onSave: () => Promise<void>;
    hasUnsavedChanges: boolean;
    allNodes: Node[]; // Pass all nodes for selection
    allEdges: Edge[];
    onConnect: (source: string, sourceHandle: string, target: string) => void;
    onCreateAndConnect: (type: keyof typeof nodeTypeConfig, sourceHandle?: string) => Node | undefined;
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

function CaptureDataPanel({ node, onNodeDataChange }: { node: Node, onNodeDataChange: NodeConfigPanelProps['onNodeDataChange'] }) {
    const handleFieldChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
        const value = typeof e === 'string' ? e : e.target.value;
        onNodeDataChange(node.id, { [field]: value });
    };

    return (
        <div className="space-y-4">
             <p className="text-sm text-muted-foreground">Peça uma informação ao usuário e armazene-a em uma variável.</p>
            <Separator />
             <div className="space-y-2">
                <Label htmlFor="capture-message">Mensagem de Solicitação</Label>
                <Input id="capture-message" placeholder="Qual o seu CPF?" value={node.data.captureMessage || ''} onChange={handleFieldChange('captureMessage')} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="capture-variable">Nome da Variável</Label>
                 <div className="flex items-center gap-2">
                    <TextCursorInput className="h-5 w-5 text-muted-foreground" />
                    <Input id="capture-variable" placeholder="cpf_cliente" value={node.data.captureVariable || ''} onChange={handleFieldChange('captureVariable')} />
                </div>
                 <p className="text-xs text-muted-foreground">Use este nome para referenciar o dado em outros nós (ex: {{`{{cpf_cliente}}`}}).</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="capture-validation">Validação</Label>
                <Select value={node.data.captureValidation || 'none'} onValueChange={handleFieldChange('captureValidation')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="number">Número</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="phone">Telefone</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="capture-error-message">Mensagem de Erro na Validação</Label>
                <Input id="capture-error-message" placeholder="Formato inválido. Por favor, digite novamente." value={node.data.captureErrorMessage || ''} onChange={handleFieldChange('captureErrorMessage')} />
            </div>
        </div>
    );
}

function InternalActionPanel({ node, onNodeDataChange }: { node: Node, onNodeDataChange: NodeConfigPanelProps['onNodeDataChange'] }) {
    const { effectiveOwnerId } = useAuth();
    const { toast } = useToast();
    const [crmStages, setCrmStages] = useState<Stage[]>([]);

    useEffect(() => {
        if (effectiveOwnerId) {
            getStagesByUser(effectiveOwnerId)
                .then(setCrmStages)
                .catch(() => toast({ variant: 'destructive', title: 'Erro ao buscar estágios do CRM' }));
        }
    }, [effectiveOwnerId, toast]);
    
    const handleActionTypeChange = (value: string) => {
        onNodeDataChange(node.id, { actionType: value });
    };

    const handleValueChange = (field: string) => (value: string) => {
        onNodeDataChange(node.id, { [field]: value });
    };
    
    const actionType = node.data.actionType;

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Execute uma ação automática no sistema.</p>
            <Separator />
            <div className="space-y-2">
                <Label htmlFor="action-type">Tipo de Ação</Label>
                <Select value={actionType} onValueChange={handleActionTypeChange}>
                    <SelectTrigger id="action-type"><SelectValue placeholder="Selecione uma ação..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="addTag">Adicionar Tag ao Contato</SelectItem>
                        <SelectItem value="removeTag">Remover Tag do Contato</SelectItem>
                        <SelectItem value="moveCrmStage">Mover Contato no Funil</SelectItem>
                        <SelectItem value="updateOrderStatus">Atualizar Status de Pedido</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            {actionType === 'addTag' && (
                <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="tag-value">Tag a ser Adicionada</Label>
                    <Input id="tag-value" placeholder="Ex: lead_qualificado" value={node.data.actionValue || ''} onChange={(e) => onNodeDataChange(node.id, { actionValue: e.target.value })} />
                </div>
            )}
            {actionType === 'removeTag' && (
                <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="tag-value">Tag a ser Removida</Label>
                    <Input id="tag-value" placeholder="Ex: novo_cliente" value={node.data.actionValue || ''} onChange={(e) => onNodeDataChange(node.id, { actionValue: e.target.value })} />
                </div>
            )}
             {actionType === 'moveCrmStage' && (
                <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="crm-stage-select">Mover para o Estágio</Label>
                    <Select onValueChange={handleValueChange('actionValue')} value={node.data.actionValue}>
                        <SelectTrigger id="crm-stage-select"><SelectValue placeholder="Selecione um estágio..." /></SelectTrigger>
                        <SelectContent>
                            {crmStages.map(stage => <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {/* Add more fields for other actions */}
        </div>
    );
}

function ConditionalPanel({ node, onNodeDataChange, allNodes, allEdges, onConnect, onCreateAndConnect }: { node: Node, onNodeDataChange: NodeConfigPanelProps['onNodeDataChange'], allNodes: Node[], allEdges: Edge[], onConnect: NodeConfigPanelProps['onConnect'], onCreateAndConnect: NodeConfigPanelProps['onCreateAndConnect'] }) {
    const conditions = node.data.conditions || [];
    const [editingHandle, setEditingHandle] = useState<string | null>(null);

    const availableNodes = allNodes.filter(n => {
        if (n.id === node.id) return false;
        // A node is available if it's not a target of ANY edge yet.
        const hasConnection = allEdges.some(edge => edge.target === n.id);
        return !hasConnection;
    });

    const handleAddCondition = () => {
        const newConditions = [...conditions, { id: `handle_${Date.now()}`, variable: '', operator: '==', value: '', label: '' }];
        onNodeDataChange(node.id, { conditions: newConditions });
    };

    const handleRemoveCondition = (index: number) => {
        const newConditions = conditions.filter((_: any, i: number) => i !== index);
        onNodeDataChange(node.id, { conditions: newConditions });
    };

    const handleConditionChange = (index: number, field: string, value: string) => {
        const newConditions = [...conditions];
        newConditions[index][field] = value;
        onNodeDataChange(node.id, { conditions: newConditions });
    };
    
    const handleAction = (handleId: string, action: 'connect' | 'create', value?: any) => {
        if (action === 'create' && value) {
             onCreateAndConnect(value, handleId);
        } else if (action === 'connect' && value) {
            onConnect(node.id, handleId, value);
        }
        setEditingHandle(null);
    };

    const getConnectedNodeName = (handleId: string) => {
        const edge = allEdges.find(e => e.source === node.id && e.sourceHandle === handleId);
        if (!edge) return null;
        const targetNode = allNodes.find(n => n.id === edge.target);
        return targetNode?.data.label || 'Nó desconhecido';
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Crie caminhos "Se" para o fluxo. A saída padrão "Senão" será usada se nenhuma das regras for atendida.</p>
            <Separator />
            {conditions.map((cond: any, index: number) => {
                const connectedNodeName = getConnectedNodeName(cond.id);
                const isEditing = editingHandle === cond.id;
                return (
                    <div key={index} className="p-3 border rounded-lg space-y-3 relative bg-muted/50">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive" onClick={() => handleRemoveCondition(index)}><Trash2 className="h-4 w-4"/></Button>
                        <p className="text-sm font-semibold">Caminho {index + 1}</p>
                        <div className="space-y-2">
                            <Label>SE</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input placeholder="Variável (ex: cpf)" value={cond.variable} onChange={(e) => handleConditionChange(index, 'variable', e.target.value)} />
                                <Select value={cond.operator} onValueChange={(val) => handleConditionChange(index, 'operator', val)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="==">É igual a</SelectItem>
                                        <SelectItem value="!=">É diferente de</SelectItem>
                                        <SelectItem value=">">É maior que</SelectItem>
                                        <SelectItem value="<">É menor que</SelectItem>
                                        <SelectItem value="contains">Contém</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input placeholder="Valor a comparar" value={cond.value} onChange={(e) => handleConditionChange(index, 'value', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>ENTÃO</Label>
                            {isEditing ? (
                                <Select onValueChange={(value) => handleAction(cond.id, value === 'create_new' ? 'create' : 'connect', value === 'create_new' ? undefined : value)}>
                                    <SelectTrigger><SelectValue placeholder="Conectar ou criar..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="create_new">Criar nova tarefa...</SelectItem>
                                        <Separator className="my-1"/>
                                        {availableNodes.map(n => <SelectItem key={n.id} value={n.id}>{n.data.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            ) : connectedNodeName ? (
                                <div className="flex items-center justify-between p-2 border rounded-md bg-background">
                                    <span className="text-sm font-medium">Conectado a: {connectedNodeName}</span>
                                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingHandle(cond.id)}>Alterar</Button>
                                </div>
                            ) : (
                                <Button type="button" className="w-full" variant="outline" onClick={() => setEditingHandle(cond.id)}>Conectar ou Criar Tarefa</Button>
                            )}
                        </div>
                    </div>
                );
            })}
            <Button type="button" variant="outline" size="sm" onClick={handleAddCondition}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Caminho</Button>
        </div>
    );
}


function TransferPanel({ node, onNodeDataChange }: { node: Node, onNodeDataChange: NodeConfigPanelProps['onNodeDataChange'] }) {
    const { effectiveOwnerId } = useAuth();
    const { toast } = useToast();
    const [employees, setEmployees] = useState<Employee[]>([]);

    useEffect(() => {
        if (effectiveOwnerId) {
            getEmployeesByUser(effectiveOwnerId)
                .then(setEmployees)
                .catch(() => toast({ variant: 'destructive', title: 'Erro ao buscar funcionários' }));
        }
    }, [effectiveOwnerId, toast]);
    
    return (
         <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Transfira a conversa para um atendente humano ou departamento.</p>
            <Separator />
            <div className="space-y-2">
                <Label htmlFor="transfer-to">Transferir Para</Label>
                <Select value={node.data.transferTo} onValueChange={(value) => onNodeDataChange(node.id, { transferTo: value })}>
                    <SelectTrigger id="transfer-to"><SelectValue placeholder="Selecione um destino..." /></SelectTrigger>
                    <SelectContent>
                        {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

export function NodeConfigPanel({ selectedNode, onNodeDataChange, onSave, hasUnsavedChanges, allNodes, allEdges, onConnect, onCreateAndConnect }: NodeConfigPanelProps) {

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
            case 'captureData':
                return <CaptureDataPanel node={selectedNode} onNodeDataChange={onNodeDataChange} />;
            case 'internalAction':
                return <InternalActionPanel node={selectedNode} onNodeDataChange={onNodeDataChange} />;
            case 'conditional':
                return <ConditionalPanel node={selectedNode} onNodeDataChange={onNodeDataChange} allNodes={allNodes} allEdges={allEdges} onConnect={onConnect} onCreateAndConnect={onCreateAndConnect}/>;
            case 'transfer':
                return <TransferPanel node={selectedNode} onNodeDataChange={onNodeDataChange} />;
            case 'delay':
                return (
                    <div className="space-y-2">
                        <Label htmlFor="delay-seconds">Aguardar (em segundos)</Label>
                        <Input id="delay-seconds" type="number" value={selectedNode.data.delaySeconds || ''} onChange={(e) => onNodeDataChange(selectedNode.id, { delaySeconds: Number(e.target.value) })} />
                    </div>
                )
            default:
                 return (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-4 h-full">
                        <HelpCircle className="h-8 w-8 mb-2" />
                        <p>Nenhuma configuração disponível para este tipo de tarefa ainda.</p>
                    </div>
                )
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
             <SheetFooter className="p-6 border-t">
                 <Button variant="outline" onClick={onSave} disabled={!hasUnsavedChanges}>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                </Button>
            </SheetFooter>
        </SheetContent>
    );
}

    

    

    

