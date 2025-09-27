"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/common/page-header";
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
import { Bot, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";


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


const enrichNodeData = (node: Node): Node => {
    const config = nodeTypeConfig[node.data.type as keyof typeof nodeTypeConfig] || {};
    return {
        ...node,
        data: {
            ...node.data,
            icon: config.icon,
            color: config.color,
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

    useEffect(() => {
        if (typeof flowId !== 'string') return;
        
        const fetchFlow = async () => {
            setLoading(true);
            try {
                const fetchedFlow = await getFlowById(flowId);
                if (fetchedFlow) {
                    setFlow(fetchedFlow);
                    setNodes((fetchedFlow.nodes || []).map(enrichNodeData));
                    setEdges(fetchedFlow.edges || []);
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
                const { icon, color, ...restData } = n.data; // Remove transient data
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
    
    const debouncedSave = useMemo(() => debounce(saveFlow, 2000), [saveFlow]);

    const onNodesChange: OnNodesChange = useCallback((changes) => {
        setNodes((nds) => {
            const newNodes = applyNodeChanges(changes, nds);
            // Find which node was selected
            const selectedChange = changes.find(c => c.type === 'select' && c.selected);
            if (selectedChange) {
                setSelectedNode(newNodes.find(n => n.id === selectedChange.id) || null);
            } else if (changes.some(c => c.type === 'select' && !c.selected)) {
                 const selectedNodeExists = changes.some(c => c.type === 'select' && c.selected);
                 if(!selectedNodeExists) setSelectedNode(null);
            }

            debouncedSave(newNodes, edges);
            return newNodes;
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
                    const enrichedNode = enrichNodeData({ ...node, data: { ...node.data, ...data } });
                    return enrichedNode;
                }
                return node;
            });
            // Also update the selected node's view
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
        const enriched = enrichNodeData(newNode);
        setNodes((nds) => nds.concat(enriched));
    };

     const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
            <header>
                <PageHeader
                    title={flow?.name || "Editando Fluxo"}
                    description="Crie e gerencie fluxos de conversa interativos para automatizar o atendimento."
                />
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                 <NodesPalette onNodeAdd={addNode} />
                 <NodeConfigPanel selectedNode={selectedNode} onNodeDataChange={onNodeDataChange} />
            </div>

            <main className="flex-1 border rounded-lg overflow-hidden bg-background">
                <FlowBuilder 
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                />
            </main>
        </div>
    );
}
