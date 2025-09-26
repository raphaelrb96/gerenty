
"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/page-header";
import { FlowBuilder } from "@/components/automation/flow-builder";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { getFlowById, updateFlow } from "@/services/flow-service";
import { useToast } from "@/hooks/use-toast";
import type { Flow } from "@/lib/types";
import { useRouter, useParams } from 'next/navigation';
import type { Node, Edge, OnNodesChange, OnEdgesChange } from "reactflow";
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { NodeConfigPanel } from "@/components/automation/node-config-panel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
                    setNodes(fetchedFlow.nodes || []);
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
            await updateFlow(flow.id, { nodes: nodesToSave, edges: edgesToSave });
            // Optional: show a subtle saving indicator
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao salvar", description: "Não foi possível salvar as alterações." });
        }
    }, [flow, toast]);
    
    const debouncedSave = useCallback(debounce(saveFlow, 2000), [saveFlow]);

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

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <PageHeader
                title={flow?.name || "Editando Fluxo"}
                description="Desenhe o fluxo da conversa usando nós e conexões para automatizar o atendimento."
            />
             <Card className="flex-1 mt-4">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    <ResizablePanel defaultSize={75}>
                        <FlowBuilder 
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                        />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={25} minSize={20} maxSize={30}>
                        <NodeConfigPanel selectedNode={selectedNode} />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </Card>
        </div>
    );
}

