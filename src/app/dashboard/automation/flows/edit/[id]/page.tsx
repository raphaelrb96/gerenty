

"use client";

import { useState, useEffect, useCallback } from "react";
import { FlowBuilder } from "@/components/automation/flow-builder";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { getFlowById, updateFlow } from "@/services/flow-service";
import { useToast } from "@/hooks/use-toast";
import type { Flow } from "@/lib/types";
import { useRouter, useParams } from 'next/navigation';
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from "reactflow";
import { applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import { NodeConfigPanel } from "@/components/automation/node-config-panel";
import { NodesPalette } from "@/components/automation/nodes-palette";
import { Bot, MessageCircle, Settings, Plus, Pencil, Trash2, Save, MoreVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const nodeTypeConfig = {
    keywordTrigger: { icon: <Bot size={20} />, color: 'border-yellow-500', defaultData: { label: 'Gatilho: Palavra-Chave', type: 'keywordTrigger' } },
    message: { icon: <MessageCircle size={20} />, color: 'border-green-500', defaultData: { label: 'Enviar Mensagem', type: 'message' } },
};


const enrichNodeData = (node: Node, onConfigure: (node: Node) => void, onDelete: (node: Node) => void): Node => {
    const config = nodeTypeConfig[node.data.type as keyof typeof nodeTypeConfig] || {};
    
    // Forçar que os nós 1 e 2 não sejam deletáveis
    const isDeletable = node.id !== '1' && node.id !== '2';

    return {
        ...node,
        data: {
            ...node.data,
            icon: config.icon,
            color: config.color,
            onConfigure: () => onConfigure(node),
            onDelete: () => onDelete(node),
            isDeletable: isDeletable,
        },
    };
};

export default function EditConversationFlowPage() {
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const { id: flowId } = params;

    const [flow, setFlow] = useState<Flow | null>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isFlowSettingsOpen, setIsFlowSettingsOpen] = useState(false);
    
    const [flowName, setFlowName] = useState("");
    const [flowStatus, setFlowStatus] = useState<Flow['status']>('draft');
    
    const [nodeToDelete, setNodeToDelete] = useState<Node | null>(null);
    
    const handleConfigureNode = (node: Node) => {
        setSelectedNode(node);
        setIsConfigOpen(true);
    };

    const handleDeleteNode = (node: Node) => {
        setNodeToDelete(node);
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
                    setNodes((fetchedFlow.nodes || []).map(n => enrichNodeData(n, handleConfigureNode, handleDeleteNode)));
                    setEdges(fetchedFlow.edges || []);
                    setFlowName(fetchedFlow.name);
                    setFlowStatus(fetchedFlow.status);
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
    
    const handleFlowSettingsSave = async () => {
        if (!flow) return;
        try {
            await updateFlow(flow.id, { name: flowName, status: flowStatus });
            setFlow(prev => prev ? { ...prev, name: flowName, status: flowStatus } : null);
            toast({ title: "Configurações do fluxo salvas com sucesso!" });
            setIsFlowSettingsOpen(false);
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
                const { onConfigure, onDelete, ...restData } = node.data;
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
            return newNodes.map(n => enrichNodeData(n, handleConfigureNode, handleDeleteNode));
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
                    const enrichedNode = enrichNodeData({ ...node, data: { ...node.data, ...data } }, handleConfigureNode, handleDeleteNode);
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

    const addNode = (type: keyof typeof nodeTypeConfig) => {
        const config = nodeTypeConfig[type];
        const newNode: Node = {
            id: `${nodes.length + 1}`,
            type: 'custom',
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: config.defaultData,
        };
        const enriched = enrichNodeData(newNode, handleConfigureNode, handleDeleteNode);
        setNodes((nds) => nds.concat(enriched));
        setIsPaletteOpen(false); // Close modal on add
        setHasUnsavedChanges(true);
    };

     const onConnect = useCallback(
        (params: Edge | Connection) => {
            setEdges((eds) => addEdge(params, eds));
            setHasUnsavedChanges(true);
        },
        [setEdges]
    );

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
                            {isSaving ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setIsPaletteOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Tarefa
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setIsFlowSettingsOpen(true)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar Fluxo
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
            
            <main className="flex-1 h-full w-full border rounded-lg overflow-hidden bg-background">
                <FlowBuilder 
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgesDelete={handleEdgesDelete}
                />
            </main>

             <Dialog open={isPaletteOpen} onOpenChange={setIsPaletteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Paleta de Tarefas</DialogTitle>
                    </DialogHeader>
                    <NodesPalette onNodeAdd={addNode} />
                </DialogContent>
            </Dialog>
            
            <Dialog open={isConfigOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedNode(null); setIsConfigOpen(isOpen);}}>
                <DialogContent>
                     <NodeConfigPanel selectedNode={selectedNode} onNodeDataChange={onNodeDataChange} />
                </DialogContent>
            </Dialog>
            
            <Dialog open={isFlowSettingsOpen} onOpenChange={setIsFlowSettingsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurações do Fluxo</DialogTitle>
                        <DialogDescription>
                            Altere o nome e o status do seu fluxo de conversa.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="flow-name">Nome do Fluxo</Label>
                            <Input id="flow-name" value={flowName} onChange={(e) => setFlowName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="flow-status">Status</Label>
                            <Select value={flowStatus} onValueChange={(value) => setFlowStatus(value as Flow['status'])}>
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
                     <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFlowSettingsOpen(false)}>Cancelar</Button>
                        <Button onClick={handleFlowSettingsSave}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
}
