
"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/common/page-header";
import { FlowBuilder } from "@/components/automation/flow-builder";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { createFlow, getFlowById, updateFlow } from "@/services/flow-service";
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import type { Flow } from "@/lib/types";
import { useRouter, useParams } from 'next/navigation';
import type { Node, Edge, OnNodesChange, OnEdgesChange } from "reactflow";
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';

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
    const { user, effectiveOwnerId } = useAuth();
    const { activeCompany } = useCompany();
    const { toast } = useToast();
    const router = useRouter();

    const [flow, setFlow] = useState<Flow | null>(null);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeFlow = async () => {
            if (!effectiveOwnerId || !activeCompany) return;
            setLoading(true);
            try {
                const newFlow = await createFlow(effectiveOwnerId, activeCompany.id);
                setFlow(newFlow);
                setNodes(newFlow.nodes || []);
                setEdges(newFlow.edges || []);
                // Update URL without reloading page
                window.history.replaceState(null, '', `/dashboard/automation/flows/edit/${newFlow.id}`);
            } catch (error) {
                toast({ variant: 'destructive', title: "Erro ao criar fluxo", description: "Não foi possível iniciar um novo fluxo." });
                router.push('/dashboard/automation');
            } finally {
                setLoading(false);
            }
        };
        initializeFlow();
    }, [effectiveOwnerId, activeCompany, toast, router]);

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
        <div className="h-full flex flex-col">
            <PageHeader
                title="Criar Novo Fluxo de Conversa"
                description="Desenhe o fluxo da conversa usando nós e conexões para automatizar o atendimento."
            />
            <div className="flex-1 mt-4 border rounded-lg">
                <FlowBuilder 
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                />
            </div>
        </div>
    );
}
