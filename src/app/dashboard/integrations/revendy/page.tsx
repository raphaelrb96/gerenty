
"use client";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { saveRevendyConfig, getRevendyApiKey, testRevendyConnection } from "@/services/revendy-service";
import { syncProductsWithRevendy } from "@/services/product-service";
import { useState, useEffect } from "react";
import { useCompany } from "@/context/company-context";
import { Loader2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


export default function RevendyIntegrationPage() {
    const { toast } = useToast();
    const { activeCompany } = useCompany();
    const [apiKey, setApiKey] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const loadApiKey = async () => {
            if (activeCompany) {
                const storedKey = await getRevendyApiKey(activeCompany.id);
                if (storedKey) {
                    setApiKey(storedKey);
                }
            }
        };
        loadApiKey();
    }, [activeCompany]);

    const handleSave = async () => {
        if (!activeCompany) {
            toast({ variant: "destructive", title: "Nenhuma empresa ativa selecionada." });
            return;
        }
        if (!apiKey) {
            toast({ variant: "destructive", title: "Chave de API é obrigatória." });
            return;
        }
        setIsSaving(true);
        try {
            await saveRevendyConfig(activeCompany.id, apiKey);
            toast({ title: "Configuração salva com sucesso!" });
        } catch (e) {
            toast({ variant: "destructive", title: "Erro ao salvar." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        if (!apiKey) {
            toast({ variant: "destructive", title: "Insira uma chave de API para testar." });
            return;
        }
        setIsTesting(true);
        try {
            await testRevendyConnection(apiKey);
            toast({ title: "Conexão bem-sucedida!", description: "A chave de API é válida e a comunicação foi estabelecida." });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Falha na conexão.", description: e.message || "Verifique sua chave de API." });
        } finally {
            setIsTesting(false);
        }
    };
    
    const handleSyncProducts = async () => {
        if (!activeCompany) {
            toast({ variant: "destructive", title: "Nenhuma empresa ativa selecionada." });
            return;
        }
        setIsSyncing(true);
        try {
            const result = await syncProductsWithRevendy(activeCompany.id, activeCompany.ownerId);
            toast({ title: "Sincronização Concluída", description: `${result.synced} produtos do Revendy foram sincronizados.` });
        } catch (e: any) {
            toast({ variant: "destructive", title: "Falha na Sincronização", description: e.message });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Integração Revendy"
                description="Conecte sua conta Revendy para sincronizar produtos, revendedores e lojas."
            />
            
            <Card>
                <CardHeader>
                    <CardTitle>Configuração da API</CardTitle>
                    <CardDescription>Insira sua chave de API do Revendy para estabelecer a conexão.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="revendy-api-key">Chave de API</Label>
                        <Input
                            id="revendy-api-key"
                            type="password"
                            placeholder="cole_sua_chave_de_api_aqui"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handleSave} disabled={isSaving || !apiKey}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Chave
                        </Button>
                        <Button variant="outline" onClick={handleTest} disabled={isTesting || !apiKey}>
                            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Testar Conexão
                        </Button>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                    <p>Este botão faz uma chamada real à API do Revendy (`/api/test`) usando a chave fornecida para verificar se ela é válida.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sincronização de Produtos</CardTitle>
                    <CardDescription>Puxe os produtos do seu catálogo Revendy para o Gerenty.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Clique no botão abaixo para buscar os produtos cadastrados no Revendy e adicioná-los ao seu catálogo no Gerenty. Produtos com o mesmo SKU (código) serão atualizados, novos produtos serão criados.
                    </p>
                    <Button onClick={handleSyncProducts} disabled={isSyncing || !apiKey}>
                        {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sincronizar Produtos do Revendy
                    </Button>
                </CardContent>
            </Card>

        </div>
    );
}
