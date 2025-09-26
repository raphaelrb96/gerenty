
"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { FlowBuilder } from "@/components/automation/flow-builder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { NodeConfigPanel } from "@/components/automation/node-config-panel";
import type { Node } from "reactflow";

export default function NewConversationFlowPage() {
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <PageHeader
                title="Criar Novo Fluxo de Conversa"
                description="Desenhe o fluxo da conversa usando nós e conexões para automatizar o atendimento."
            />
             <ResizablePanelGroup direction="horizontal" className="flex-1 mt-4 border rounded-lg bg-card">
                <ResizablePanel defaultSize={70}>
                    <FlowBuilder onNodeClick={(node) => setSelectedNode(node)} />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                    <NodeConfigPanel selectedNode={selectedNode} />
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
