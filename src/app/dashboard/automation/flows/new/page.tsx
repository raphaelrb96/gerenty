
"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context";
import { useCompany } from "@/context/company-context";
import { useToast } from "@/hooks/use-toast";
import { createFlow } from "@/services/flow-service";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function NewConversationFlowPage() {
    const { effectiveOwnerId } = useAuth();
    const { activeCompany } = useCompany();
    const { toast } = useToast();
    const router = useRouter();
    
    const [flowName, setFlowName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateFlow = async () => {
        if (!effectiveOwnerId || !activeCompany) {
            toast({ variant: 'destructive', title: "Erro de contexto", description: "Usuário ou empresa não identificado." });
            return;
        }
        if (!flowName.trim()) {
            toast({ variant: 'destructive', title: "Nome obrigatório", description: "Por favor, dê um nome ao seu fluxo." });
            return;
        }
        
        setIsLoading(true);

        try {
            // A 'flowType' (e.g., 'keyword') is now handled by default in the service
            const newFlow = await createFlow(effectiveOwnerId, activeCompany.id, flowName);
            toast({ title: "Fluxo criado com sucesso!", description: `Redirecionando para a edição de "${flowName}".`});
            router.push(`/dashboard/automation/flows/edit/${newFlow.id}`);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao criar fluxo", description: "Não foi possível iniciar um novo fluxo de conversa." });
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
             <PageHeader
                title="Criar Novo Fluxo de Conversa"
                description="Dê um nome para sua automação para começar a construí-la."
            />
             <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Nome do Fluxo</CardTitle>
                        <CardDescription>Você poderá alterar o nome e adicionar mais detalhes depois.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="flow-name">Nome</Label>
                            <Input 
                                id="flow-name" 
                                placeholder="Ex: Fluxo de Boas-Vindas"
                                value={flowName}
                                onChange={(e) => setFlowName(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button onClick={handleCreateFlow} disabled={isLoading}>
                           {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Criar e Editar Fluxo
                        </Button>
                    </CardFooter>
                </Card>
             </div>
        </div>
    );
}
