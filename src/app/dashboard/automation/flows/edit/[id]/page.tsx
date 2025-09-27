
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { Bot, MessageCircle, Settings, Plus, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// Debounce function
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: Parameters<F>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
            timeout = null;
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };

    return debounced;
};

const nodeTypeConfig = {
    keywordTrigger: { icon: <Bot size={20} />, color: 'border-yellow-500', defaultData: { label: 'Gatilho: Palavra-Chave', type: 'keywordTrigger' } },
    message: { icon: <MessageCircle size={20} />, color: 'border-green-500', defaultData: { label: 'Enviar Mensagem', type: 'message' } },
};


const enrichNodeData = (node: Node, onConfigure: (node: Node) => void): Node => {
    const config = nodeTypeConfig[node.data.type as keyof typeof nodeTypeConfig] || {};
    return {
        ...node,
        data: {
            ...node.data,
            icon: config.icon,
            color: config.color,
            onConfigure: () => onConfigure(node), // Add callback to data
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

    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isFlowSettingsOpen, setIsFlowSettingsOpen] = useState(false);
    
    const [flowName, setFlowName] = useState("");
    const [flowStatus, setFlowStatus] = useState<Flow['status']>('draft');
    
    const handleConfigureNode = (node: Node) => {
        setSelectedNode(node);
        setIsConfigOpen(true);
    };

    useEffect(() => {
        if (typeof flowId !== 'string') return;
        
        const fetchFlow = async () => {
            setLoading(true);
            try {
                const fetchedFlow = await getFlowById(flowId);
                if (fetchedFlow) {
                    setFlow(fetchedFlow);
                    // Pass the configure callback when enriching nodes
                    setNodes((fetchedFlow.nodes || []).map(n => enrichNodeData(n, handleConfigureNode)));
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

    const saveFlow = useCallback(async (nodesToSave: Node[], edgesToSave: Edge[]) => {
        if (!flow) return;
        try {
            const nodesToPersist = nodesToSave.map(n => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { icon, color, onConfigure, ...restData } = n.data; // Remove transient data
                return {
                    id: n.id,
                    type: n.type,
                    position: n.position,
                    data: restData,
                }
            });
            await updateFlow(flow.id, { nodes: nodesToPersist, edges: edgesToSave });
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao salvar", description: "Não foi possível salvar as alterações." });
        }
    }, [flow, toast]);
    
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
    
    const debouncedSave = useMemo(() => debounce(saveFlow, 2000), [saveFlow]);

    const onNodesChange: OnNodesChange = useCallback((changes) => {
        setNodes((nds) => {
            const newNodes = applyNodeChanges(changes, nds);
            // Re-enrich nodes to ensure onConfigure callback is fresh
            const enrichedNodes = newNodes.map(n => enrichNodeData(n, handleConfigureNode));
            debouncedSave(enrichedNodes, edges);
            return enrichedNodes;
        });
    }, [setNodes, edges, debouncedSave]);

    const onEdgesChange: OnEdgesChange = useCallback((changes) => {
        setEdges((eds) => {
            const newEdges = applyEdgeChanges(changes, eds);
            debouncedSave(nodes, newEdges);
            return newEdges;
        });
    }, [setEdges, nodes, debouncedSave]);

    const onNodeDataChange = (nodeId: string, data: any) => {
        setNodes((nds) => {
            const newNodes = nds.map((node) => {
                if (node.id === nodeId) {
                    const enrichedNode = enrichNodeData({ ...node, data: { ...node.data, ...data } }, handleConfigureNode);
                    return enrichedNode;
                }
                return node;
            });
            if (selectedNode?.id === nodeId) {
                 setSelectedNode(newNodes.find(n => n.id === nodeId) || null);
            }
            debouncedSave(newNodes, edges);
            return newNodes;
        });
    };

    const addNode = (type: keyof typeof nodeTypeConfig) => {
        const config = nodeTypeConfig[type];
        const newNode: Node = {
            id: `${nodes.length + 1}`,
            type: 'custom',
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: config.defaultData,
        };
        const enriched = enrichNodeData(newNode, handleConfigureNode);
        setNodes((nds) => nds.concat(enriched));
        setIsPaletteOpen(false); // Close modal on add
    };

     const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
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
                    <Button onClick={() => setIsPaletteOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Tarefa
                    </Button>
                     <Button variant="outline" onClick={() => setIsFlowSettingsOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Fluxo
                    </Button>
                </div>
            </header>
            
            <main className="flex-1 h-full w-full border rounded-lg overflow-hidden bg-background">
                <FlowBuilder 
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
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
        </div>
    );
}
