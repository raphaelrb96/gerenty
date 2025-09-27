
"use client";

import { useState, useEffect, useCallback } from "react";
import { FlowBuilder } from "@/components/automation/flow-builder";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { getFlowById, updateFlow } from "@/services/flow-service";
import { useToast } from "@/hooks/use-toast";
import type { Flow, LibraryMessage } from "@/lib/types";
import { useRouter, useParams } from 'next/navigation';
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from "reactflow";
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { NodeConfigPanel } from "@/components/automation/node-config-panel";
import { NodesPalette } from "@/components/automation/nodes-palette";
import { Bot, MessageCircle, Settings, Plus, Pencil, Trash2, Save, MoreVertical, Clock, Calendar, Repeat, MessageSquareX, Forward, Send, HelpCircle, GitBranch, Share2, Timer, UserCheck, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useCompany } from "@/context/company-context";
import { getLibraryMessagesByCompany } from "@/services/library-message-service";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";


export const nodeTypeConfig = {
    keywordTrigger: { icon: <Bot size={20} />, color: 'border-yellow-500', defaultData: { label: 'Gatilho: Palavra-Chave', type: 'keywordTrigger' } },
    message: { icon: <MessageCircle size={20} />, color: 'border-green-500', defaultData: { label: 'Enviar Mensagem', type: 'message' } },
    captureData: { icon: <HelpCircle size={20} />, color: 'border-blue-500', defaultData: { label: 'Capturar Dados', type: 'captureData' } },
    internalAction: { icon: <Settings size={20} />, color: 'border-purple-500', defaultData: { label: 'Ação Interna', type: 'internalAction' } },
    conditional: { icon: <GitBranch size={20} />, color: 'border-cyan-500', defaultData: { label: 'Dividir Fluxo', type: 'conditional', conditions: [] } },
    externalApi: { icon: <Share2 size={20} />, color: 'border-indigo-500', defaultData: { label: 'API Externa', type: 'externalApi' } },
    delay: { icon: <Timer size={20} />, color: 'border-orange-500', defaultData: { label: 'Aguardar', type: 'delay' } },
    transfer: { icon: <UserCheck size={20} />, color: 'border-rose-500', defaultData: { label: 'Transferir Atendente', type: 'transfer' } },
    endFlow: { icon: <CheckCircle size={20} />, color: 'border-gray-500', defaultData: { label: 'Finalizar Fluxo', type: 'endFlow' } },
};


const enrichNodeData = (node: Node, onConfigure: (node: Node) => void, onDelete: (node: Node) => void, onQuickAdd: (node: Node) => void): Node => {
    const config = nodeTypeConfig[node.data.type as keyof typeof nodeTypeConfig] || {};
    
    const isDeletable = node.id !== '1';

    return {
        ...node,
        data: {
            ...node.data,
            icon: config.icon,
            color: config.color,
            onConfigure: () => onConfigure(node),
            onDelete: () => onDelete(node),
            onQuickAdd: () => onQuickAdd(node),
            isDeletable: isDeletable,
            isMainTrigger: node.id === '1',
        },
    };
};

export default function EditConversationFlowPage() {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const { id: flowId } = params;
    const { activeCompany } = useCompany();

    const [flow, setFlow] = useState<Flow | null>(null);
    const [allFlows, setAllFlows] = useState<Flow[]>([]);
    const [libraryMessages, setLibraryMessages] = useState<LibraryMessage[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isFlowSettingsOpen, setIsFlowSettingsOpen] = useState(false);
    
    const [flowSettings, setFlowSettings] = useState({
        name: "",
        status: 'draft' as Flow['status'],
        sessionTimeout: 30,
        timeoutAction: 'end_flow' as Flow['sessionConfig']['timeoutAction'],
        timeoutMessageId: '',
        timeoutForwardFlowId: '',
        timezone: 'America/Sao_Paulo',
        isPerpetual: false,
        activationTime: '00:00',
        deactivationTime: '23:59',
        activeDays: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as Flow['schedule']['activeDays'],
    });
    
    const [nodeToDelete, setNodeToDelete] = useState<Node | null>(null);
    const [quickAddSourceNode, setQuickAddSourceNode] = useState<Node | null>(null);

    
    const handleConfigureNode = (node: Node) => {
        setSelectedNode(node);
        setIsConfigOpen(true);
    };

    const handleDeleteNode = (node: Node) => {
        setNodeToDelete(node);
    };

    const handleQuickAdd = (sourceNode: Node) => {
        setQuickAddSourceNode(sourceNode);
        setIsPaletteOpen(true);
    };

    const confirmDeleteNode = () => {
        if (!nodeToDelete) return;
        setNodes((nds) => nds.filter(n => n.id !== nodeToDelete.id));
        setEdges((eds) => eds.filter(e => e.source !== nodeToDelete.id && e.target !== nodeToDelete.id));
        setNodeToDelete(null);
        setHasUnsavedChanges(true);
        toast({ title: "Tarefa removida com sucesso!" });
    };

    const handleEdgesDelete = useCallback((edgesToDelete: Edge[]) => {
        setEdges(eds => eds.filter(e => !edgesToDelete.find(etd => etd.id === e.id)));
        setHasUnsavedChanges(true);
    }, [setEdges]);


    useEffect(() => {
        if (typeof flowId !== 'string') return;
        
        const fetchFlow = async () => {
            setLoading(true);
            try {
                const fetchedFlow = await getFlowById(flowId);
                if (fetchedFlow) {
                    setFlow(fetchedFlow);
                    setNodes((fetchedFlow.nodes || []).map(n => enrichNodeData(n, handleConfigureNode, handleDeleteNode, handleQuickAdd)));
                    setEdges(fetchedFlow.edges || []);
                    setFlowSettings({
                        name: fetchedFlow.name,
                        status: fetchedFlow.status,
                        sessionTimeout: fetchedFlow.sessionConfig?.timeoutMinutes || 30,
                        timeoutAction: fetchedFlow.sessionConfig?.timeoutAction || 'end_flow',
                        timeoutMessageId: fetchedFlow.sessionConfig?.timeoutMessageId || '',
                        timeoutForwardFlowId: fetchedFlow.sessionConfig?.timeoutForwardFlowId || '',
                        timezone: fetchedFlow.schedule?.timezone || 'America/Sao_Paulo',
                        isPerpetual: fetchedFlow.schedule?.isPerpetual || false,
                        activationTime: fetchedFlow.schedule?.activationTime || '00:00',
                        deactivationTime: fetchedFlow.schedule?.deactivationTime || '23:59',
                        activeDays: fetchedFlow.schedule?.activeDays || ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
                    });
                } else {
                    toast({ variant: 'destructive', title: "Fluxo não encontrado" });
                    router.push('/dashboard/automation');
                }
            } catch (error) {
                toast({ variant: 'destructive', title: "Erro ao carregar fluxo" });
                router.push('/dashboard/automation');
            } finally {
                setLoading(false);
            }
        };
        fetchFlow();
    }, [flowId, toast, router]);
    
    // Fetch complementary data for the settings modal
    useEffect(() => {
        if (activeCompany) {
            getLibraryMessagesByCompany(activeCompany.id)
                .then(setLibraryMessages)
                .catch(() => toast({ variant: 'destructive', title: 'Erro ao carregar mensagens da biblioteca' }));

            // You'd also fetch all other flows here for the "Forward Flow" option
            // getFlowsByCompany(activeCompany.id).then(setAllFlows)...
        }
    }, [activeCompany, toast]);

    const handleFlowSettingsSave = async () => {
        if (!flow) return;

        const dataToUpdate: Partial<Flow> = {
            name: flowSettings.name,
            status: flowSettings.status,
            sessionConfig: {
                timeoutMinutes: flowSettings.sessionTimeout,
                timeoutAction: flowSettings.timeoutAction,
                timeoutMessageId: flowSettings.timeoutMessageId,
                timeoutForwardFlowId: flowSettings.timeoutForwardFlowId,
            },
            schedule: {
                timezone: flowSettings.timezone,
                isPerpetual: flowSettings.isPerpetual,
                activationTime: flowSettings.activationTime,
                deactivationTime: flowSettings.deactivationTime,
                activeDays: flowSettings.activeDays,
            },
        };

        try {
            await updateFlow(flow.id, dataToUpdate);
            setFlow(prev => prev ? { ...prev, ...dataToUpdate } as Flow : null);
            toast({ title: "Configurações do fluxo salvas com sucesso!" });
            setIsFlowSettingsOpen(false);
            setHasUnsavedChanges(true); // Mark changes to be saved on the main flow
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao salvar configurações" });
        }
    };

    const handleSaveFlow = async () => {
        if (!flow || !hasUnsavedChanges) return;
        
        setIsSaving(true);
        try {
            // Remove the circular 'on*' functions before saving
            const nodesToSave = nodes.map(node => {
                const { icon, color, onConfigure, onDelete, onQuickAdd, isDeletable, isMainTrigger, ...restData } = node.data;
                return { ...node, data: restData };
            });
            await updateFlow(flow.id, { nodes: nodesToSave, edges });
            toast({ title: "Fluxo salvo com sucesso!" });
            setHasUnsavedChanges(false);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao salvar o fluxo." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const onNodesChange: OnNodesChange = useCallback((changes) => {
        setNodes((nds) => {
            const newNodes = applyNodeChanges(changes, nds);
            return newNodes.map(n => enrichNodeData(n, handleConfigureNode, handleDeleteNode, handleQuickAdd));
        });
        setHasUnsavedChanges(true);
    }, [setNodes]);

    const onEdgesChange: OnEdgesChange = useCallback((changes) => {
        setEdges((eds) => applyEdgeChanges(changes, eds));
        setHasUnsavedChanges(true);
    }, [setEdges]);

    const onNodeDataChange = (nodeId: string, data: any) => {
        setNodes((nds) => {
            const newNodes = nds.map((node) => {
                if (node.id === nodeId) {
                    const enrichedNode = enrichNodeData({ ...node, data: { ...node.data, ...data } }, handleConfigureNode, handleDeleteNode, handleQuickAdd);
                    return enrichedNode;
                }
                return node;
            });
            if (selectedNode?.id === nodeId) {
                 setSelectedNode(newNodes.find(n => n.id === nodeId) || null);
            }
            return newNodes;
        });
        setHasUnsavedChanges(true);
    };

     const addNode = (type: keyof typeof nodeTypeConfig, sourceHandle?: string) => {
        if (quickAddSourceNode) {
            const isConditional = quickAddSourceNode.data.type === 'conditional';
            // Only check for existing connections if the source is not a conditional node and we are not using a specific source handle (like 'else')
            if (!isConditional && !sourceHandle) {
                const sourceHasConnection = edges.some(edge => edge.source === quickAddSourceNode.id && !edge.sourceHandle);
                if (sourceHasConnection) {
                    toast({
                        variant: 'destructive',
                        title: 'Conexão Inválida',
                        description: 'Esta tarefa já possui uma conexão de saída. Use o nó "Dividir Fluxo" para criar ramificações.'
                    });
                    setQuickAddSourceNode(null); // Reset source node
                    setIsPaletteOpen(false); // Close palette
                    return;
                }
            }
        }
        
        const config = nodeTypeConfig[type];
        let position = { x: Math.random() * 400, y: Math.random() * 400 };

        if (quickAddSourceNode) {
            position = {
                x: quickAddSourceNode.position.x,
                y: quickAddSourceNode.position.y + (quickAddSourceNode.height || 100) + 75
            };
        }
        
        const newNodeId = `${Date.now()}`;
        const newNode: Node = {
            id: newNodeId,
            type: 'custom',
            position,
            data: config.defaultData,
        };

        const enriched = enrichNodeData(newNode, handleConfigureNode, handleDeleteNode, handleQuickAdd);
        setNodes((nds) => nds.concat(enriched));

        if (quickAddSourceNode) {
            const newEdge: Edge = {
                id: `e${quickAddSourceNode.id}-${newNodeId}`,
                source: quickAddSourceNode.id,
                target: newNodeId,
                type: 'smoothstep',
                sourceHandle: sourceHandle || null,
            };
            setEdges((eds) => addEdge(newEdge, eds));
            
            if (quickAddSourceNode.data.type === 'conditional' && sourceHandle) {
                 setNodes(nds => nds.map(n => {
                     if (n.id === quickAddSourceNode.id) {
                         const existingConditions = n.data.conditions || [];
                         // Check if a condition for this handle already exists
                         if (!existingConditions.some((c: any) => c.id === sourceHandle)) {
                             // Add a new blank condition associated with the new handle
                             const newConditions = [...existingConditions, { id: sourceHandle, variable: '', operator: '==', value: '', label: '' }];
                             return {...n, data: {...n.data, conditions: newConditions}};
                         }
                     }
                     return n;
                 }));
            }
            
            setQuickAddSourceNode(null); // Reset after adding
        }
        
        setIsPaletteOpen(false);
        setHasUnsavedChanges(true);
        return newNode;
    };

     const onConnect = useCallback(
        (params: Edge | Connection) => {
            setEdges((currentEdges) => {
                const targetHasConnection = currentEdges.some(
                    (edge) => edge.target === params.target && edge.targetHandle === params.targetHandle
                );
                if (targetHasConnection) {
                    toast({ variant: 'destructive', title: 'Conexão Inválida', description: 'Cada tarefa só pode ter uma conexão de entrada.' });
                    return currentEdges;
                }

                const sourceNode = nodes.find((node) => node.id === params.source);
                const isConditional = sourceNode?.data.type === 'conditional';
                
                if (!isConditional) {
                    const sourceHasConnection = currentEdges.some(
                        (edge) => edge.source === params.source && edge.sourceHandle === params.sourceHandle
                    );
                    if (sourceHasConnection) {
                        toast({ variant: 'destructive', title: 'Conexão Inválida', description: 'Esta tarefa já possui uma conexão de saída. Use o nó "Dividir Fluxo" para criar ramificações.' });
                        return currentEdges;
                    }
                }
                
                // If a new connection is made from a conditional node, create a new condition for it
                if (isConditional && params.source && params.sourceHandle) {
                     setNodes(nds => {
                         const sourceNode = nds.find(n => n.id === params.source);
                         if (sourceNode) {
                             const existingConditions = sourceNode.data.conditions || [];
                             const handleAlreadyExists = existingConditions.some((c: any) => c.id === params.sourceHandle);
                             
                             if (!handleAlreadyExists) {
                                 return nds.map(n => {
                                     if (n.id === params.source) {
                                         const newConditions = [...existingConditions, { id: params.sourceHandle, variable: '', operator: '==', value: '', label: '' }];
                                         return {...n, data: {...n.data, conditions: newConditions}};
                                     }
                                     return n;
                                 });
                             }
                         }
                         return nds;
                     });
                }


                setHasUnsavedChanges(true);
                return addEdge({ ...params, type: 'smoothstep' }, currentEdges);
            });
        },
        [setEdges, nodes, toast]
    );

    const onConnectFromPanel = (source: string, sourceHandle: string, target: string) => {
        const newEdge: Edge = {
            id: `e${source}-${target}-${sourceHandle}`,
            source,
            sourceHandle,
            target,
            type: 'smoothstep'
        };
        onConnect(newEdge);
    }


    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="h-[calc(100vh-8rem)] w-full relative p-4 flex flex-col">
             <header className="mb-4 flex justify-between items-center flex-shrink-0">
                <h1 className="text-2xl font-bold">{flow?.name || "Carregando..."}</h1>
                <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                        <Button onClick={handleSaveFlow} disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? "Salvando..." : "Salvar"}
                        </Button>
                    )}
                    <Button variant="outline" size="icon" onClick={() => setIsFlowSettingsOpen(true)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
            </header>
            
            <main className="flex-1 h-full w-full border rounded-lg overflow-hidden bg-background relative">
                <FlowBuilder 
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgesDelete={handleEdgesDelete}
                />
                 <Button 
                    className="absolute bottom-6 right-6 rounded-full w-14 h-14"
                    onClick={() => {
                        setQuickAddSourceNode(null);
                        setIsPaletteOpen(true);
                    }}
                >
                    <Plus className="h-6 w-6" />
                    <span className="sr-only">Adicionar Tarefa</span>
                </Button>
            </main>

             <Dialog open={isPaletteOpen} onOpenChange={setIsPaletteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Paleta de Tarefas</DialogTitle>
                    </DialogHeader>
                    <NodesPalette onNodeAdd={addNode} />
                </DialogContent>
            </Dialog>
            
            <Sheet open={isConfigOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedNode(null); setIsConfigOpen(isOpen);}}>
                <NodeConfigPanel 
                    selectedNode={selectedNode} 
                    onNodeDataChange={onNodeDataChange}
                    onSave={handleSaveFlow}
                    hasUnsavedChanges={hasUnsavedChanges}
                    allNodes={nodes}
                    allEdges={edges}
                    onConnect={onConnectFromPanel}
                    onCreateAndConnect={addNode}
                />
            </Sheet>
            
            <Sheet open={isFlowSettingsOpen} onOpenChange={setIsFlowSettingsOpen}>
                 <SheetContent className="sm:max-w-lg flex flex-col p-0">
                    <SheetHeader className="p-6">
                        <SheetTitle>Configurações Avançadas do Fluxo</SheetTitle>
                        <SheetDescription>
                            Ajuste detalhes de funcionamento, agendamento e comportamento do seu fluxo de conversa.
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-1 px-6">
                        <div className="space-y-6 pb-6">
                            <Card>
                                <CardContent className="p-4 pt-6 space-y-4">
                                    <h4 className="font-semibold">Geral</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="flow-name">Nome do Fluxo</Label>
                                            <Input id="flow-name" value={flowSettings.name} onChange={(e) => setFlowSettings(prev => ({...prev, name: e.target.value}))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="flow-status">Status</Label>
                                            <Select value={flowSettings.status} onValueChange={(value) => setFlowSettings(prev => ({...prev, status: value as Flow['status']}))}>
                                                <SelectTrigger id="flow-status">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="draft">Rascunho</SelectItem>
                                                    <SelectItem value="published">Publicado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                 <CardContent className="p-4 pt-6 space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4"/> Configurações de Sessão</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="session-timeout">Timeout de Inatividade (minutos)</Label>
                                            <Input id="session-timeout" type="number" value={flowSettings.sessionTimeout} onChange={(e) => setFlowSettings(prev => ({...prev, sessionTimeout: Number(e.target.value)}))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="timeout-action">Ação Pós-Timeout</Label>
                                            <Select value={flowSettings.timeoutAction} onValueChange={(value) => setFlowSettings(prev => ({...prev, timeoutAction: value as any}))}>
                                                <SelectTrigger id="timeout-action"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="end_flow"><MessageSquareX className="h-4 w-4 mr-2" />Encerrar Fluxo</SelectItem>
                                                    <SelectItem value="send_message"><Send className="h-4 w-4 mr-2"/>Enviar Mensagem Automática</SelectItem>
                                                    <SelectItem value="transfer"><Bot className="h-4 w-4 mr-2"/>Transferir para Atendente</SelectItem>
                                                    <SelectItem value="forward_flow"><Forward className="h-4 w-4 mr-2"/>Encaminhar para Outro Fluxo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground pt-1">
                                                Define o que acontece se o cliente não responder dentro do tempo limite.
                                            </p>
                                        </div>
                                    </div>
                                    {flowSettings.timeoutAction === 'send_message' && (
                                        <div className="space-y-2 pt-4 border-t">
                                            <Label htmlFor="timeout-message-select">Mensagem a Enviar</Label>
                                            <Select value={flowSettings.timeoutMessageId} onValueChange={(value) => setFlowSettings(prev => ({...prev, timeoutMessageId: value}))}>
                                                <SelectTrigger id="timeout-message-select"><SelectValue placeholder="Selecione uma mensagem..." /></SelectTrigger>
                                                <SelectContent>
                                                    {libraryMessages.map(msg => (
                                                        <SelectItem key={msg.id} value={msg.id}>{msg.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                    {flowSettings.timeoutAction === 'forward_flow' && (
                                        <div className="space-y-2 pt-4 border-t">
                                            <Label htmlFor="timeout-flow-select">Fluxo de Destino</Label>
                                            <Select value={flowSettings.timeoutForwardFlowId} onValueChange={(value) => setFlowSettings(prev => ({...prev, timeoutForwardFlowId: value}))}>
                                                <SelectTrigger id="timeout-flow-select"><SelectValue placeholder="Selecione um fluxo..." /></SelectTrigger>
                                                <SelectContent>
                                                    {allFlows.filter(f => f.id !== flow?.id).map(f => (
                                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                 <CardContent className="p-4 pt-6 space-y-4">
                                    <h4 className="font-semibold flex items-center gap-2"><Calendar className="h-4 w-4"/> Horário de Ativação</h4>
                                     <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id="is-perpetual" 
                                            checked={flowSettings.isPerpetual} 
                                            onCheckedChange={(checked) => setFlowSettings(prev => ({ ...prev, isPerpetual: checked as boolean }))}
                                        />
                                        <Label htmlFor="is-perpetual">Fluxo Vitalício (Sempre Ativo)</Label>
                                    </div>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="flow-timezone">Fuso Horário</Label>
                                        <Select value={flowSettings.timezone} onValueChange={(value) => setFlowSettings(prev => ({...prev, timezone: value}))} disabled={flowSettings.isPerpetual}>
                                            <SelectTrigger id="flow-timezone"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="America/Sao_Paulo">Brasil (São Paulo)</SelectItem>
                                                <SelectItem value="America/New_York">EUA (Nova York)</SelectItem>
                                                <SelectItem value="Europe/Lisbon">Portugal (Lisboa)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="activation-time">Ativar às</Label>
                                            <Input id="activation-time" type="time" value={flowSettings.activationTime} onChange={(e) => setFlowSettings(prev => ({...prev, activationTime: e.target.value}))} disabled={flowSettings.isPerpetual}/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="deactivation-time">Desativar às</Label>
                                            <Input id="deactivation-time" type="time" value={flowSettings.deactivationTime} onChange={(e) => setFlowSettings(prev => ({...prev, deactivationTime: e.target.value}))} disabled={flowSettings.isPerpetual}/>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Dias Ativos</Label>
                                        <ToggleGroup type="multiple" value={flowSettings.activeDays} onValueChange={(value) => setFlowSettings(prev => ({...prev, activeDays: value as any[]}))} className="flex-wrap justify-start" disabled={flowSettings.isPerpetual}>
                                            <ToggleGroupItem value="sun">Dom</ToggleGroupItem>
                                            <ToggleGroupItem value="mon">Seg</ToggleGroupItem>
                                            <ToggleGroupItem value="tue">Ter</ToggleGroupItem>
                                            <ToggleGroupItem value="wed">Qua</ToggleGroupItem>
                                            <ToggleGroupItem value="thu">Qui</ToggleGroupItem>
                                            <ToggleGroupItem value="fri">Sex</ToggleGroupItem>
                                            <ToggleGroupItem value="sat">Sáb</ToggleGroupItem>
                                        </ToggleGroup>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </ScrollArea>
                    <SheetFooter className="p-6 border-t">
                        <Button variant="outline" onClick={() => setIsFlowSettingsOpen(false)}>Cancelar</Button>
                        <Button onClick={handleFlowSettingsSave}>Salvar Configurações</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            <AlertDialog open={!!nodeToDelete} onOpenChange={() => setNodeToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Tarefa?</AlertDialogTitle>
                        <AlertDialogDescription>
                           Tem certeza de que deseja excluir a tarefa "{nodeToDelete?.data.label}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteNode} className="bg-destructive hover:bg-destructive/90">
                           Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );

    