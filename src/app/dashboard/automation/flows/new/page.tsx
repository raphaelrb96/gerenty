
"use client";

import { PageHeader } from "@/components/common/page-header";
import { FlowBuilder } from "@/components/automation/flow-builder";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewConversationFlowPage() {
    return (
        <div className="space-y-4">
            <PageHeader
                title="Criar Novo Fluxo de Conversa"
                description="Desenhe o fluxo da conversa usando nós e conexões para automatizar o atendimento."
            />
             <Card>
                <CardHeader>
                    <CardTitle>Construtor de Fluxo</CardTitle>
                    <CardDescription>Arraste e conecte os nós para montar a lógica da sua conversa.</CardDescription>
                </CardHeader>
                <CardContent className="h-[600px] p-0">
                    <FlowBuilder />
                </CardContent>
            </Card>
        </div>
    );
}

    