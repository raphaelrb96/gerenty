
"use client";

import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getRevendyProducts, saveRevendyConfig } from "@/services/revendy-service";
import { useState } from "react";
import { useCompany } from "@/context/company-context";
import { Loader2 } from "lucide-react";


export default function RevendyIntegrationPage() {
    const { toast } = useToast();
    const { activeCompany } = useCompany();
    const [apiKey, setApiKey] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    
    const handleSave = async () => {
        if (!activeCompany) {
            toast({ variant: "destructive", title: "Nenhuma empresa ativa selecionada."});
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
        } catch(e) {
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
            const products = await getRevendyProducts(apiKey);
            toast({ title: "Conexão bem-sucedida!", description: `Encontrados ${products.length} produtos no Revendy.` });
        } catch(e) {
             toast({ variant: "destructive", title: "Falha na conexão.", description: "Verifique sua chave de API." });
        } finally {
            setIsTesting(false);
        }
    }

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
                    <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Chave
                        </Button>
                         <Button variant="outline" onClick={handleTest} disabled={isTesting}>
                            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Testar Conexão
                        </Button>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Sincronização</CardTitle>
                    <CardDescription>Gerencie como os dados são sincronizados entre Gerenty e Revendy.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground p-8">
                   <p>(Em breve: Opções para sincronizar produtos, revendedores, estoque, etc.)</p>
                </CardContent>
            </Card>

        </div>
    );
}
