
// src/components/integrations/WhatsAppConfigForm.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { Company, WhatsAppIntegration } from "@/lib/types";
import { checkWhatsAppIntegration, saveWhatsAppCredentials, sendTestMessage, getWhatsAppIntegrationStatus } from "@/services/integration-service";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, Copy, CheckCircle, AlertCircle, XCircle, Info, TestTube2, ExternalLink, ChevronsUpDown, Building } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/context/i18n-context";
import { useCompany as useCompanyContext } from "@/context/company-context";
import Link from "next/link";
import { EmptyState } from "../common/empty-state";


// Schema atualizado para corresponder ao back-end
const formSchema = z.object({
    whatsAppBusinessId: z.string().min(10, "ID da Conta do WhatsApp Business é obrigatório."),
    phoneNumberId: z.string().min(10, "ID do Telefone é obrigatório."),
    accessToken: z.string().min(20, "Token de Acesso é obrigatório."),
    metaAppSecret: z.string().min(10, "Meta App Secret é obrigatório."),
});

type FormValues = z.infer<typeof formSchema>;


function CompanySelector() {
    const { t } = useTranslation();
    const { companies, activeCompany, setActiveCompany } = useCompanyContext();

    const getDisplayName = () => {
        if (!activeCompany) {
            return "Selecione uma empresa";
        }
        return activeCompany.name;
    };

    if (companies.length === 0) {
        return null;
    }

    return (
        <Card className="mb-6">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-md bg-muted">
                        <Building className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Empresa Ativa</p>
                        <h2 className="text-lg font-bold">{getDisplayName()}</h2>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            Trocar Empresa
                            <ChevronsUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {companies.map((company) => (
                            <DropdownMenuItem key={company.id} onSelect={() => setActiveCompany(company)}>
                                {company.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardContent>
        </Card>
    );
}

export function WhatsAppConfigForm({ company }: { company: Company }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true); // ← Novo estado
    const [showToken, setShowToken] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null);
    const { user } = useAuth();
    const [isTestModalOpen, setIsTestModalOpen] = useState(false);
    const [testPhoneNumber, setTestPhoneNumber] = useState("");

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            whatsAppBusinessId: "",
            phoneNumberId: "",
            accessToken: "",
            metaAppSecret: ""
        },
    });

    // Carrega o status da integração
    useEffect(() => {
        if (!company?.id) return;

        const loadIntegrationStatus = async () => {
            setIsLoadingStatus(true);
            try {
                const status = await getWhatsAppIntegrationStatus(company.id);

                if (status.exists) {
                    // Cria um objeto de integração com os dados recebidos
                    const integrationData: WhatsAppIntegration = {
                        whatsAppId: status.whatsAppId || "",
                        phoneNumberId: status.phoneNumberId || "",
                        webhookUrl: status.webhookUrl || "",
                        status: status.status as any || 'connected',
                        companyId: company.id,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    setIntegration(integrationData);

                    // Preenche o formulário
                    form.reset({
                        whatsAppBusinessId: status.whatsAppId || "",
                        phoneNumberId: status.phoneNumberId || "",
                        accessToken: "",
                        metaAppSecret: ""
                    });
                } else {
                    setIntegration(null);
                    form.reset();
                }
            } catch (error) {
                console.error('Error loading integration status:', error);
                // Em caso de erro, assume que não há integração
                setIntegration(null);
                form.reset();
            } finally {
                setIsLoadingStatus(false);
            }
        };

        loadIntegrationStatus();
    }, [company.id, form]);

    // Listener em tempo real para mudanças no Firestore (apenas para updates)
    useEffect(() => {
        if (!company?.id || !integration) return;

        const unsub = onSnapshot(
            doc(db, 'companies', company.id, 'integrations', 'whatsapp'),
            (doc) => {
                if (doc.exists()) {
                    const data = doc.data() as WhatsAppIntegration;
                    setIntegration(data);

                    // Atualiza apenas os campos não sensíveis
                    form.setValue('whatsAppBusinessId', data.whatsAppId || "");
                    form.setValue('phoneNumberId', data.phoneNumberId || "");
                }
            },
            (error) => {
                console.error("Error listening to integration updates:", error);
            }
        );

        return () => unsub();
    }, [company.id, integration, form]);

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({
            title: "Copiado!",
            description: "URL copiada para a área de transferência."
        });
    };

    const getStatusContent = () => {
        if (!integration) {
            return {
                icon: <XCircle className="h-5 w-5 text-destructive" />,
                title: "Não Configurado",
                description: "Configure as credenciais para conectar com o WhatsApp Business API.",
                variant: "destructive" as const
            };
        }

        switch (integration.status) {
            case 'connected':
                return {
                    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
                    title: "Conectado",
                    description: "A integração com o WhatsApp está ativa e funcionando.",
                    variant: "default" as const
                };
            case 'error':
                return {
                    icon: <AlertCircle className="h-5 w-5 text-destructive" />,
                    title: "Erro na Conexão",
                    description: integration.error || "Erro na integração. Verifique as credenciais.",
                    variant: "destructive" as const
                };
            case 'disconnected':
                return {
                    icon: <XCircle className="h-5 w-5 text-destructive" />,
                    title: "Desconectado",
                    description: "A integração foi desconectada.",
                    variant: "destructive" as const
                };
            default:
                return {
                    icon: <XCircle className="h-5 w-5 text-destructive" />,
                    title: "Desconhecido",
                    description: "Status desconhecido.",
                    variant: "destructive" as const
                };
        }
    };

    const statusContent = getStatusContent();

    const onSubmit = async (values: FormValues) => {
        setIsLoading(true);
        try {
            const result = await saveWhatsAppCredentials(company.id, values);

            toast({
                title: "Sucesso!",
                description: result.message,
                variant: "default"
            });

            // Se é uma edição, volta para o modo de visualização
            if (integration) {
                setIsEditing(false);
            }

        } catch (error: any) {
            console.error("Error saving credentials:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: error.message || "Não foi possível salvar as credenciais."
            });
        } finally {
            setIsLoading(false);
        }
    };


    const handleTestConnection = async () => {
        if (!testPhoneNumber) {
            toast({ variant: "destructive", title: "Campo obrigatório", description: "Por favor, insira um número de telefone." });
            return;
        }

        if (!testPhoneNumber.match(/^\d{10,15}$/)) {
            toast({
                variant: "destructive",
                title: "Número inválido",
                description: "Use apenas números no formato internacional (ex: 5511999999999)."
            });
            return;
        }

        setIsTesting(true);
        try {
            const testMessage = `🚀 Mensagem de teste do Gerenty\n\nEsta é uma mensagem de teste para verificar a integração com o WhatsApp Business API.\n\n✅ Integração funcionando!\n⏰ ${new Date().toLocaleString('pt-BR')}`;

            const result = await sendTestMessage(testPhoneNumber, company.id, testMessage);

            if (result.success && result.messageId) {
                let description = `Mensagem enviada para ${testPhoneNumber}. ID: ${result.messageId}`;

                // Adiciona informação sobre o tipo de mensagem
                if (result.messageType === 'template') {
                    description += '\n📋 Enviado como template (fora da janela de 24h)';
                } else {
                    description += '\n💬 Enviado como mensagem de conversação';
                }

                toast({
                    title: "Teste Enviado!",
                    description,
                    variant: "default"
                });
                setIsTestModalOpen(false);
                setTestPhoneNumber("");
            } else {
                throw new Error(result.message || 'Falha ao enviar mensagem');
            }
        } catch (error: any) {
            console.error('Error sending test message:', error);

            let errorMessage = error.message || "Não foi possível enviar a mensagem de teste.";

            if (error.message.includes('outside_24h_window')) {
                errorMessage = `
                    Fora da janela de 24h. 
                    
                    O sistema tentou criar um template automaticamente para resolver este problema.
                    Se a mensagem ainda não foi enviada, pode levar alguns minutos para o template ser aprovado.
                    
                    💡 Dica: Para testes imediatos, use números de teste da Meta.
                    `.replace(/\n\s+/g, '\n').trim();
                    
            } else if (error.message.includes('template') || error.message.includes('Template')) {
                errorMessage = `
                    Sistema de templates em ação:
                    
                    ✅ Tentamos criar um template automaticamente
                    ⏰ Pode levar alguns minutos para aprovação
                    🔄 Tente novamente em 2-3 minutos
                    
                    Para configuração manual:
                    1. Acesse WhatsApp → Configuração da API → Gerenciar Templates
                    2. Crie o template 'test_send'
                    3. Categoria: UTILITY
                    `.replace(/\n\s+/g, '\n').trim();
            }

            toast({
                variant: "destructive",
                title: "🔄 Processando Templates",
                description: errorMessage
            });
        } finally {
            setIsTesting(false);
        }
    };

    const webhookUrl = integration?.webhookUrl;

    return (
        <div className="space-y-6">
            {isLoadingStatus ? (
                <Alert>
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <div className="flex-1">
                            <AlertTitle>Carregando...</AlertTitle>
                            <AlertDescription>Verificando status da integração</AlertDescription>
                        </div>
                    </div>
                </Alert>
            ) : (
                <Alert variant={statusContent.variant}>
                    <div className="flex items-center gap-3">
                        {statusContent.icon}
                        <div className="flex-1">
                            <AlertTitle>{statusContent.title}</AlertTitle>
                            <AlertDescription>{statusContent.description}</AlertDescription>
                        </div>
                        {integration?.status === 'connected' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsTestModalOpen(true)}
                                disabled={isTesting}
                            >
                                <TestTube2 className="mr-2 h-4 w-4" />
                                Testar
                            </Button>
                        )}
                    </div>
                </Alert>
            )}

            <AlertDialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Enviar Mensagem de Teste</AlertDialogTitle>
                        <AlertDialogDescription>
                            Digite um número de telefone completo com código do país para enviar uma mensagem de teste.
                            <br /><br />
                            <strong>Formato:</strong> 5511999999999 (55 = Brasil, 11 = DDD, 999999999 = número)
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Label htmlFor="test-phone-number">Número de Telefone</Label>
                        <Input
                            id="test-phone-number"
                            placeholder="Ex: 5511999999999"
                            value={testPhoneNumber}
                            onChange={(e) => setTestPhoneNumber(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleTestConnection} disabled={isTesting}>
                            {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enviar Teste
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Guia Completo de Configuração
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Passo 1: Criar sua Conta de Negócios</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <p>Para usar a API do WhatsApp, você precisa de uma Conta de Negócios da Meta (antigo Facebook). Se você já tem uma, pode pular para o próximo passo.</p>
                                <ul className="list-decimal list-inside space-y-2 text-muted-foreground">
                                    <li>Acesse o <a href="https://business.facebook.com/overview" target="_blank" rel="noopener noreferrer" className="text-primary underline">Gerenciador de Negócios da Meta <ExternalLink className="inline h-3 w-3" /></a>.</li>
                                    <li>Clique em "Criar conta" e siga as instruções para configurar sua empresa.</li>
                                    <li>É crucial que sua empresa seja verificada pela Meta para ter acesso completo aos recursos da API.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                            <AccordionTrigger>Passo 2: Criar um Aplicativo de Desenvolvedor</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <p>Toda a comunicação com o WhatsApp é feita através de um "Aplicativo" no painel de desenvolvedores da Meta.</p>
                                <ul className="list-decimal list-inside space-y-2 text-muted-foreground">
                                    <li>Vá para <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Meta for Developers <ExternalLink className="inline h-3 w-3" /></a> e faça login.</li>
                                    <li>Clique em "Criar aplicativo" e selecione o tipo "Negócios".</li>
                                    <li>Dê um nome para seu aplicativo (ex: "Atendimento Gerenty") e associe-o à sua Conta de Negócios criada no Passo 1.</li>
                                    <li>Dentro do painel do seu novo aplicativo, encontre o produto "WhatsApp" e clique em "Configurar".</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3">
                            <AccordionTrigger>Passo 3: Configurar um Número de Telefone</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <p>Agora você precisa adicionar um número de telefone que será usado para enviar e receber mensagens.</p>
                                <ul className="list-decimal list-inside space-y-2 text-muted-foreground">
                                    <li>No painel do seu aplicativo, vá para a seção <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="text-primary underline font-mono text-xs bg-muted p-1 rounded">WhatsApp {'>'} Configuração da API <ExternalLink className="inline h-3 w-3" /></a>.</li>
                                    <li>Você pode usar um número de teste fornecido pela Meta para desenvolvimento ou clicar em "Adicionar número de telefone" para registrar um número seu.</li>
                                    <li><strong>Importante:</strong> O número que você registrar não pode estar sendo usado em uma conta normal ou Business do WhatsApp no seu celular. Ele será dedicado à API.</li>
                                    <li>Siga os passos de verificação do número por SMS ou chamada de voz.</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4">
                            <AccordionTrigger>Passo 4: Obter suas Credenciais</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <p>Com tudo configurado, agora você precisa copiar as credenciais e colá-las no formulário abaixo.</p>
                                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                    <li><b>ID da Conta do WhatsApp Business:</b> Na tela <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="text-primary underline font-mono text-xs bg-muted p-1 rounded">WhatsApp {'>'} Configuração da API <ExternalLink className="inline h-3 w-3" /></a>, você encontrará este ID no topo.</li>
                                    <li><b>ID do Número de Telefone:</b> Na mesma tela, na seção "Enviar e receber mensagens", copie o ID do número de telefone que você configurou.</li>
                                    <li><b>Token de Acesso Permanente:</b> Na mesma seção, clique em "Gerar token". <strong>Importante:</strong> Você deve gerar um token de acesso permanente, pois o token temporário expira em 24 horas.</li>
                                    <li><b>Meta App Secret (Segredo do Aplicativo):</b> No menu lateral esquerdo, vá para <span className="font-mono text-xs bg-muted p-1 rounded">Configurações do aplicativo {'>'} Básico</span>. Clique em "Mostrar" ao lado de "Segredo do Aplicativo" e copie o valor.</li>
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-5">
                            <AccordionTrigger>Passo 5: Configurar o Webhook</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <p className="text-muted-foreground">O Webhook é o "endereço" para onde o WhatsApp enviará as mensagens que seus clientes mandarem.</p>
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Primeiro, preencha e salve as 4 credenciais do passo anterior neste formulário. A URL do Webhook será gerada automaticamente.</li>
                                    <li>Volte ao painel da Meta, em <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" className="text-primary underline font-mono text-xs bg-muted p-1 rounded">WhatsApp {'>'} Configuração da API <ExternalLink className="inline h-3 w-3" /></a> e clique em "Editar" na seção de Webhooks.</li>
                                    <li>Cole a URL de Webhook fornecida abaixo no campo "URL de Retorno de Chamada".</li>
                                    <li>No campo "Token de Verificação", cole o seu <strong>Meta App Secret</strong> (a mesma credencial do campo "Segredo do Aplicativo" deste formulário).</li>
                                    <li>Clique em "Verificar e Salvar". Se tudo estiver correto, uma mensagem de sucesso aparecerá.</li>
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-6">
                            <AccordionTrigger>Entendendo a Janela de 24h e Templates</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Importante: Janela de 24h</h4>
                                    <p className="text-yellow-700 text-sm">
                                        O WhatsApp Business API possui duas formas de enviar mensagens:
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border rounded-lg p-4">
                                        <h4 className="font-semibold text-green-600 mb-2">💬 Mensagens de Conversação</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Dentro de 24h após o contato iniciar conversa</li>
                                            <li>• Gratuitas</li>
                                            <li>• Resposta a clientes</li>
                                            <li>• Sem necessidade de template</li>
                                        </ul>
                                    </div>

                                    <div className="border rounded-lg p-4">
                                        <h4 className="font-semibold text-blue-600 mb-2">📋 Mensagens de Template</h4>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                            <li>• Fora da janela de 24h</li>
                                            <li>• Templates pré-aprovados pela Meta</li>
                                            <li>• Iniciativa da empresa</li>
                                            <li>• Necessitam de template aprovado</li>
                                        </ul>
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    <strong>Para testes:</strong> Use números de teste da Meta ou inicie uma conversa primeiro.
                                    Para produção, configure templates aprovados no painel da Meta.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>URL de Webhook</CardTitle>
                    <CardDescription>Use esta URL no painel da Meta para receber mensagens.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input id="webhook-url" value={webhookUrl || 'Salve as credenciais para gerar a URL'} readOnly className="flex-1 font-mono text-sm" />
                        <Button type="button" size="icon" variant="outline" onClick={() => copyToClipboard(webhookUrl || '')} disabled={!webhookUrl}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Credenciais da API</CardTitle>
                            <CardDescription>
                                Insira as credenciais obtidas no painel da Meta for Developers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Campos sempre visíveis */}
                            <FormField
                                control={form.control}
                                name="whatsAppBusinessId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID da Conta do WhatsApp Business</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="123456789012345"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="phoneNumberId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID do Número de Telefone</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="123456789012345"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Botão para mostrar/ocultar campos sensíveis */}
                            {integration && !isEditing && (
                                <Alert>
                                    <AlertDescription className="flex items-center justify-between">
                                        <span>Credenciais sensíveis estão ocultas por segurança</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Alterar Credenciais
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Campos sensíveis - mostrados apenas quando editando */}
                            {(isEditing || !integration) && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="metaAppSecret"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Meta App Secret (Segredo do Aplicativo)</FormLabel>
                                                <div className="relative">
                                                    <FormControl>
                                                        <Input
                                                            type={showSecret ? "text" : "password"}
                                                            placeholder="abc123def456..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                                        onClick={() => setShowSecret(!showSecret)}
                                                    >
                                                        {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="accessToken"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Token de Acesso Permanente</FormLabel>
                                                <div className="relative">
                                                    <FormControl>
                                                        <Input
                                                            type={showToken ? "text" : "password"}
                                                            placeholder="EAAD..."
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                                        onClick={() => setShowToken(!showToken)}
                                                    >
                                                        {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between border-t px-6 py-4">
                            <div className="flex gap-2">
                                {isEditing && integration && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                        disabled={isLoading}
                                    >
                                        Cancelar
                                    </Button>
                                )}
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || isLoadingStatus || (integration != null && !isEditing)}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoadingStatus ? 'Carregando...' :
                                    integration ? (isEditing ? 'Atualizar Credenciais' : 'Credenciais Salvas') :
                                        'Salvar Credenciais'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}

