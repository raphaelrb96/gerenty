
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function NewConversationFlowPage() {
    const { effectiveOwnerId } = useAuth();
    const { activeCompany } = useCompany();
    const { toast } = useToast();
    const router = useRouter();
    
    const [flowName, setFlowName] = useState("");
    const [flowType, setFlowType] = useState("keyword");
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
            const newFlow = await createFlow(effectiveOwnerId, activeCompany.id, flowName, flowType);
            toast({ title: "Fluxo criado com sucesso!", description: `Redirecionando para a edição de "${flowName}".`});
            router.push(`/dashboard/automation/flows/edit/${newFlow.id}`);
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro ao criar fluxo", description: "Não foi possível iniciar um novo fluxo de conversa." });
            setIsLoading(false);
        }
    };

    const getFlowTypeDescription = () => {
        switch(flowType) {
            case 'product':
                return "Responde automaticamente com detalhes do produto (foto, preço, link) quando um cliente digita o nome de um produto.";
            case 'ai':
                return "Utiliza Inteligência Artificial para interpretar e responder as mensagens dos clientes com base no contexto do seu negócio.";
            case 'keyword':
            default:
                return "Crie um fluxo de conversa com múltiplos passos usando o construtor visual de arrastar e soltar.";
        }
    };

    return (
        <div className="space-y-6">
             <PageHeader
                title="Criar Novo Fluxo de Conversa"
                description="Escolha um nome e o tipo de automação que deseja criar."
            />
             <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuração Inicial</CardTitle>
                        <CardDescription>Você poderá alterar essas configurações e adicionar mais detalhes depois.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="flow-name">Nome do Fluxo</Label>
                            <Input 
                                id="flow-name" 
                                placeholder="Ex: Fluxo de Boas-Vindas"
                                value={flowName}
                                onChange={(e) => setFlowName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="flow-type">Tipo de Fluxo</Label>
                             <Select value={flowType} onValueChange={setFlowType}>
                                <SelectTrigger id="flow-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="keyword">Fluxo Padrão (Construtor Visual)</SelectItem>
                                    <SelectItem value="product">Fluxo de Produtos (Automático)</SelectItem>
                                    <SelectItem value="ai">Fluxo de IA (Inteligência Artificial)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground pt-1 min-h-[30px]">
                                {getFlowTypeDescription()}
                            </p>
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
